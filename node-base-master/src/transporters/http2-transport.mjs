import {DataTransport} from "./data-transport.mjs";
import {Encoder as CBOREncoder, Decoder as CBORDecoder} from "cbor";
import {constants as http2Constants} from "http2";
import {ConnectionContext} from "../context.mjs";

const {HTTP2_HEADER_CONTENT_TYPE} = http2Constants;

/**
 * Response Options container usable in respond method.
 * @typedef Http2Transport~RespondOptions {Object<string, boolean>}
 * @property {boolean} endStream
 * @property {string} [error]
 * @property {boolean} waitForTrailers
 */
/**
 * HTTP2 Stream data transporter.
 * @note For the time being, the browsers do not support full duplex HTTP2 streams even though the specifications have it which means that notification from external streams triggering continuation of the current stream will be needed. This is ensured by the base class DataTransport extending from the EventEmitter.
 */
export class Http2Transport extends DataTransport {
    /**
     * Sent Headers
     * @type {Object<string, string | number>}
     */
    #outgoingHeaders = null;

    /**
     * HTTP2 Stream used for internal management.
     * @type {ServerHttp2Stream}
     */
    #http2Stream = null;

    /**
     *
     * @type {boolean}
     */
    #shouldStopProcessingInput = false;

    /**
     * Incoming Headers for the current stream.
     * @type {Object<string, number | string>}
     */
    #incomingHeaders = {};

    /**
     * The headers sent or null.
     * @returns {Object<string, string | number>}
     */
    get sentHeaders(){
        return this.#outgoingHeaders ? Object.assign({}, this.#outgoingHeaders) : null
    }

    /**
     * The incoming headers.
     * @returns {Object<string, number|string>}
     */
    get incomingHeaders(){
        return this.#incomingHeaders;
    }

    /**
     * Listener for incoming data.
     * @param chunk
     */
    #streamDataListener = (chunk) => {
        this.emit("dataChunk", chunk, this);
    };

    #streamErrorListener = (error) => {
        this.emit("error", error);
    };

    #streamEndListener = async () => {
        this.#cleanupH2StreamListeners();
        this.emit("end", this);
    };

    #cleanupH2StreamListeners() {
        this.#http2Stream.removeListener("data", this.#streamDataListener);
        this.#http2Stream.removeListener("error", this.#streamErrorListener);
        this.#http2Stream.removeListener("end", this.#streamEndListener);
    }

    /**
     *
     * @param {ServerHttp2Stream} http2Stream The HTTP2 Stream.
     * @param {Object<string, string | number> | IncomingHttpHeaders} incomingHeaders
     */
    constructor(http2Stream, incomingHeaders, sessionContext) {
        super(new ConnectionContext(sessionContext));
        this.#http2Stream = http2Stream;
        this.#incomingHeaders = Object.fromEntries(incomingHeaders.entries ? incomingHeaders.entries() : Object.getEntries(incomingHeaders));
        Object.freeze(this.#incomingHeaders);
    }

    /**
     * Starts processing the input data on the stream. The data might be available already as it's already sent or might keep coming, Internal H2 buffering will still occur.
     * @note stopping to process the data does not always mean data stops being received. For that notify the session to be destroyed instead.
     */
    startProcessingInput() {
        this.#http2Stream.addListener("data", this.#streamDataListener);
        this.#http2Stream.addListener("end", this.#streamEndListener);
        this.#http2Stream.addListener("error", this.#streamErrorListener);
    }

    /**
     * Stops processing the input by removing all listeners.
     * @note stopping to process the data does not always mean data stops being received. For that notify the session to be destroyed instead.
     */
    stopProcessingInput() {
        this.#cleanupH2StreamListeners(); // basically removes the listeners... data might still be coming in into the buffers.
    }

    /**
     * Sends a Response header frame over the stream. Please note that HTTP2 streams work in more or less the same way a multiplexor would over a TCP connection would
     * and the streams are simply separations of data and act more on a logical level than actual separate connections.
     * @param {OutgoingHttpHeaders} headers
     * @param {Http2Transport~RespondOptions} responseOptions
     */
    respond(headers, responseOptions) {
        if (headers.hasOwnProperty("Content-Type")) {
            headers["content-type"] = headers["Content-Type"];
            delete headers["Content-Type"];
        }
        if (!["application/json", "text/html", "application/cbor"].includes(headers["content-type"])) {
            throw new Error("Unknown content type");
        }
        this.#http2Stream.respond(headers, {
            endStream: responseOptions.endStream,
            waitForTrailers: responseOptions.waitForTrailers
        });
        this.#outgoingHeaders = headers;
    }

    /**
     * Sends Data encoding it using the set encoding.
     * @note Should only be used after responding.
     * @param {Object} dataObject
     */
    sendData(dataObject) {
        if (!this.#outgoingHeaders) {
            throw new Error("No response headers sent");
        }
        switch (this.#outgoingHeaders) {
            case "application/json":
                this.#http2Stream.write(JSON.stringify(dataObject));
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

    end() {
        if (!this.#outgoingHeaders) {
            throw new Error("Send headers first");
        }
        this.#http2Stream.end();
    }
}
