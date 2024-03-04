import {DataTransport} from "./data-transport.mjs";
import {Encoder as CBOREncoder, Decoder as CBORDecoder} from "cbor";
import {constants as http2Constants} from "http2";

const {HTTP2_HEADER_CONTENT_TYPE} = http2Constants;

/**
 * Response Options container usable in respond method.
 * @typedef Http2TransportBackup~RespondOptions {Object<string, boolean>}
 * @property {boolean} endStream
 * @property {boolean} waitForTrailers
 */
/**
 * HTTP2 Stream data transporter.
 * @note For the time being, the browsers do not support full duplex HTTP2 streams even though the specifications have it which means that notification from external streams triggering continuation of the current stream will be needed. This is ensured by the base class DataTransport extending from the EventEmitter.
 */
class Http2TransportBackup extends DataTransport {
    #outgoingHeaders = null;

    /**
     * Response Options container usable in respond method.
     * @type {Http2TransportBackup~RespondOptions}
     */
    static RespondOptions = {
        endStream: false,
        waitForTrailers: false
    };

    /**
     * HTTP2 Stream used for internal management.
     * @type {ServerHttp2Stream}
     */
    #http2Stream = null;
    /**
     * Whether the thing should hould its own internal buffer for data.
     * @type {boolean}
     */
    #hasInternalBuffer = false;
    /**
     * Internal Buffer if it's used.
     * @type {Buffer}
     */
    #internalBuffer = null;
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
     * Should the 
     * @type {boolean}
     */
    #shouldDoProcessingAtEnd = false;
    
    
    /**
     *
     * @returns {number}
     */
    get currentDataSize() {
        return this.#internalBuffer.length;
    }

    /**
     * Listener for incoming data.
     * @param chunk
     */
    #streamDataListener = (chunk) => {
        if (!this.#hasInternalBuffer) {
            this.emit("dataChunk", chunk, this);
            return;
        }
        
        if (this.#shouldStopProcessingInput) {
            this.#cleanupListeners(); // this is where the actual stopping occurs, but this has to run in a next tick event so that it gives the event user a chance to stop it.
            return;
        }
        this.#internalBuffer = this.#internalBuffer ? Buffer.concat([this.#internalBuffer, chunk]) : chunk;
        if(!this.#shouldDoProcessingAtEnd){
            
        }
    };

    /**
     * Processes the current buffer emitting a dataObject should it be the case.
     * @param {boolean} shouldClearOnSuccess This is a parameter and not an instance flag on purpose so it can be used in the end call.
     */
    async #processCurrentBuffer(shouldClearOnSuccess) {
        let result = null;
        switch (this.#incomingHeaders[HTTP2_HEADER_CONTENT_TYPE]) {
            case "application/json": {
                try {
                    result = JSON.parse(this.#internalBuffer.toString("utf-8"));
                    break;
                } catch (e) {
                    // means no success thus don't do anything for now.
                    return;
                }
            }
            case "application/cbor": {
                try {
                    result = await CBORDecoder.decodeAll(this.#internalBuffer);
                    break;
                } catch (e) {
                    // Silent catch.
                    return;
                }
            }
            default:
                // no content type means it has to be interpreted as text thus string.
                // this case should be treated in the end listener or one should not do continuous processing on this situation.
                break;
        }
        if (result) {
            this.#internalBuffer = shouldClearOnSuccess ? null : this.#internalBuffer;
            this.emit("dataObject", result, this);
        }
    }

    #streamErrorListener = (error) => {
        this.emit("error", error);
    };

    #streamEndListener = async () => {
        this.#cleanupListeners();
        // theoretically if there's data left in the buffer it should be processed regardless of whether processing happened only at the end or not.
        await this.#processCurrentBuffer(true);
        // if there's data left after this one then it's either text or it should error.
        
    };

    #cleanupListeners() {
        this.#http2Stream.removeListener("data", this.#streamDataListener);
        this.#http2Stream.removeListener("error", this.#streamErrorListener);
        this.#http2Stream.removeListener("end", this.#streamEndListener);
    }

    /**
     *
     * @param {ServerHttp2Stream} http2Stream The HTTP2 Stream.
     * @param {Object<string, string | number> | IncomingHttpHeaders} incomingHeaders
     */
    constructor(http2Stream, incomingHeaders) {
        super();
        this.#http2Stream = http2Stream;
        this.#incomingHeaders = Object.fromEntries(incomingHeaders.entries ? incomingHeaders.entries() : Object.getEntries(incomingHeaders));
    }

    /**
     * Starts processing the input data on the stream. The data might be available already as it's already sent or might keep coming.
     * @param {boolean} useInternalBuffer Should the system use its own internal buffer or pass through the events?
     * @param {boolean} doProcessingAtEnd Should it do processing of the buffer at the end or should it try to emit more than once each time an object is ready?
     */
    startProcessingInput(useInternalBuffer, doProcessingAtEnd= false, clearOnDataObject = true) {
        this.#hasInternalBuffer = !!useInternalBuffer;
        this.#http2Stream.addListener("data", this.#streamDataListener);
        this.#http2Stream.addListener("end", this.#streamEndListener);
        this.#http2Stream.addListener("error", this.#streamErrorListener);
    }

    stopProcessingInput() {
        this.#shouldStopProcessingInput = true;
        // should it also call the end ?
    }

    /**
     * Sends a Response header frame over the stream. Please note that HTTP2 streams work in more or less the same way a multiplexor would over a TCP connection would
     * and the streams are simply separations of data and act more on a logical level than actual separate connections.
     * @param {OutgoingHttpHeaders} headers
     * @param {Http2TransportBackup.RespondOptions} responseOptions
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
