import {DataTransport} from "./data-transport.mjs";
import {ConnectionContext} from "../context.mjs";
import {Encoder as CBOREncoder} from "cbor";


// The actual transport has to be doing some multiplexing on the level above which simulates the actual sessions and so on.
export class WsTransport extends DataTransport {
    /**
     *
     * @type {WebSocket}
     */
    #wsConn = null;

    /**
     *
     * @type {bigint}
     */
    #streamId = 0n;

    /**
     * Sent Headers
     * @type {Object<string, string | number>}
     */
    #outgoingHeaders = null;

    /**
     * Incoming Headers for the current stream.
     * @type {Object<string, number | string>}
     */
    #incomingHeaders = {};

    /**
     * The headers sent or null.
     * @returns {Object<string, string | number>}
     */
    get sentHeaders() {
        return this.#outgoingHeaders ? Object.assign({}, this.#outgoingHeaders) : null;
    }

    /**
     * The incoming headers.
     * @returns {Object<string, number|string>}
     */
    get incomingHeaders() {
        return this.#incomingHeaders;
    }

    /**
     *
     * @param {bigint} streamId
     * @param {WebSocket} wsConn
     * @param {Object<string, string | number> | IncomingHttpHeaders} incomingHeaders
     * @param {Object<string, any>} sessionContext
     */
    constructor(streamId, wsConn, incomingHeaders, sessionContext) {
        super(new ConnectionContext(sessionContext));
        this.#wsConn = wsConn;
        this.#streamId = streamId;
        this.#incomingHeaders = Object.fromEntries(incomingHeaders.entries ? incomingHeaders.entries() : Object.getEntries(incomingHeaders));
    }

    /**
     * Sends an HTTP2 like multiplexed header response over the websocket connection transport for the current stream id
     * @param {OutgoingHttpHeaders} headers
     * @param {{endStream: boolean, error?: string}} options
     */
    respond(headers, options) {
        /**
         * @type {[MultiplexerMessage, Object<string,string>]}
         */
        const message = [
            {
                stId: this.#streamId,
                isEnd: options.endStream,
                err: options.error
            }, headers
        ];

        this.#wsConn.send(CBOREncoder.encode(message));
    }

    #write(data) {
        /**
         *
         * @type {MultiplexerMessage}e
         */
        const outMultiplexerMessage = {
            stId: this.#streamId,
            isEnd: false,

        };
    }

    sendData() {
        if (!this.#outgoingHeaders) {
            throw new Error("No response headers sent");
        }
        switch (this.#outgoingHeaders) {
            case "application/json":
                // this.#wsConn.send(JSON.stringify(dataObject));
                break;
            case "application/cbor":
                this.#http2Stream.write(CBOREncoder.encode(dataObject));
                break;
            case "text/html":
            // no break;
            default: // probably binary
                // This may throw if the object is not writeable ( Typed Array, Buffer or String, or it has no string serialization method).
                this.#http2Stream.write(dataObject);
        }
    }
}
