import {H2Server} from "./server.mjs";
import {Decoder as CBORDecorder, Encoder as CBOREncoder} from "cbor";
import {randomBigIntNotInKeys} from "./utils/random-bigint.mjs";
import {WsTransport} from "./transporters/ws-transport.mjs";
import {Http2Transport} from "./transporters/http2-transport.mjs";
import {readWholeStream} from "./utils/read-data.mjs";
import {constants as http2Constants} from "http2";

const {
    HTTP2_HEADER_STATUS,
    HTTP_STATUS_NOT_FOUND
} = http2Constants;

/**
 * @callback ServiceDispatcherCallback
 * @param {DataTransport} dataTransport
 */

/**
 * @typedef MultiplexerMessage
 * @property {bigint} [stId]
 * @property {boolean} [isEnd]
 * @property {any} [err]
 */
export class Multiplexer {
    /**
     * @type {ServiceDispatcherCallback}
     */
    #serviceDispatcher = null;
    /**
     * Http2 with Websockets server.
     * @type {H2Server}
     */
    #server = null;
    /**
     * Header used to identify commands
     * @type {string}
     */
    #commandHeader = "command";

    /**
     * Header for service identification
     * @type {string}
     */
    #serviceHeader = "service";


    #h1ReqListener = (req, res) => {
        // For now, it will just error out.
        res.statusCode = 501;
        res.end("Not implemented");
    };

    #wsConnectionListener = (wsConn, wsSession) => {
        /**
         * @type {Map<bigint, DataTransport>}
         */
        let connectionTransports = new Map();
        wsConn.addListener("message", (message) => {
            /**
             * @type {CBOR~ExtendedResults | null}
             */
            let result = null;
            try {
                result = CBORDecorder.decodeFirstSync(message, {
                    max_depth: 150,
                    preferWeb: true,
                    extendedResults: true
                });
            } catch (e) {
                wsConn.send("INVALID_DATA");
                wsConn.close();
            }
            if (result) {
                // this first message has to be the multiplexer message.
                /**
                 * @type MultiplexerMessage
                 */
                const multiplexerMessage = result.value;
                // the rest of the message is data to be sent to the actual service or it's headers and it should be sent to the service dispatcher.
                this.resolveAndDispatchWS(wsConn, wsSession, multiplexerMessage, result.unused, connectionTransports);
            }
        });
    };

    /**
     *
     * @param {WebSocket} wsConn
     * @param {Object<string, any>} wsSession
     * @param {MultiplexerMessage} multiplexerMessage
     * @param {Buffer | ArrayBuffer | Uint8Array | Uint8ClampedArray | DataView | stream.Readable} remainingBytes
     * @param {Map<bigint, DataTransport>} connectionTransports
     */
    resolveAndDispatchWS(wsConn, wsSession, multiplexerMessage, remainingBytes, connectionTransports) {
        let streamId = multiplexerMessage.stId;
        if (!streamId) {
            // @todo first check whether the second message is a correct header message conforming to the same principles as http2
            // Not entirely sure whether that should be done right now ... as the only check is about the 4 h2 headers
            // and the rest is just completely random data ... the only rule is to have it all on a single level rather than nesting.
            try {
                const headersMessage = CBORDecorder.decodeFirstSync(remainingBytes);
                streamId = randomBigIntNotInKeys(connectionTransports);
                connectionTransports[streamId] = new WsTransport(streamId, wsConn, headersMessage, wsSession);
                this.#serviceDispatcher(connectionTransports[streamId]);
                if (multiplexerMessage.isEnd) {
                    connectionTransports[streamId].emit("end");
                }
                return;
            } catch (e) {
                const outMultiplexerMessage = {
                    stId: streamId,
                    err: "Missing headers",
                    isEnd: true
                };
                wsConn.send(CBOREncoder.encode(outMultiplexerMessage));
                return;
            }
        }
        const transport = connectionTransports[streamId];
        if (!transport) {
            /**
             * @type {MultiplexerMessage}
             */
            const outMultiplexerMessage = {
                stId: streamId,
                err: "Unknown stream",
                isEnd: true
            };
            wsConn.send(CBOREncoder.encode(outMultiplexerMessage));
            return;
        }
        if (multiplexerMessage.isEnd) {
            transport.emit("end");
        }
        transport.emit("dataChunk", remainingBytes); // Since this emits directly dataChunk there's no need for a listener and re-emitter in the WSTransport.
    }

    /**
     * @param {ServerHttp2Session}session
     */
    #h2StreamListener = (session) => {
        /**
         * @type {Map<bigint, any>}
         */
        const sessionTransports = new Map();
        const sessionData = {};
        session.addListener("stream", async (stream, headers) => {
            if (headers[this.#commandHeader] === "NOTIFY") {
                try {
                    const data = await readWholeStream(stream);
                    let decodedData = CBORDecorder.decodeAllSync(data);
                    // the decoded data has to be a message with the details of the continue notification (streamId etc)

                } catch (e) {
                    if (!stream.closed) {
                        stream.respond({
                            [HTTP2_HEADER_STATUS]: HTTP_STATUS_NOT_FOUND
                        }, {endStream: true});
                    }
                }
            }

            const streamId = randomBigIntNotInKeys(sessionTransports); // this one is only for notification purposes.
            sessionTransports[streamId] = new Http2Transport(stream, headers, sessionData);
            // treat the continuation notifications right here, the rest will go to the service multiplexer.
        });
    };

    /**
     *
     * @param {H2Server} server
     * @param {ServiceDispatcherCallback} serviceDispatcher
     * @param {string} serviceHeader
     * @param {string} commandHeader
     */
    constructor(server, serviceDispatcher, serviceHeader = "service", commandHeader = "command") {
        // This should attach itself to the server and do the multiplexing of the first stage on the Websockets and initial setup for the services to take over.
        this.#server = server;
        this.#serviceDispatcher = serviceDispatcher;
        this.#serviceHeader = serviceHeader;
        this.#commandHeader = commandHeader;
        this.#attachListeners();
    }

    #attachListeners() {
        this.#server.addListener("wsConn", this.#wsConnectionListener);
        this.#server.addListener("h1req", this.#h1ReqListener);
        this.#server.addListener("h2session", this.#h2StreamListener);
    }
}
