import EventEmitter from "node:events";

export class DataTransport extends EventEmitter {
    /**
     * @type {ConnectionContext}
     */
    #context = null;

    /**
     *
     * @param {ConnectionContext} context
     */
    constructor(context) {
        super();
        this.#context = context;
        // this is an abstract class for all data transports.
    }

    /**
     *
     * @returns {ConnectionContext}
     */
    get context(){
        return this.#context;
    }

    get sentHeaders() {

    }

    /**
     * @abstract
     */
    respond() {

    }

    /**
     * @abstract
     */
    close() {

    }

    /**
     * @abstract
     */
    sendData() {

    }

    /**
     * @abstract
     */
    end() {

    }

    notify(notification, data) {
        if (["continue", ""].includes(notification)) {
            this.emit(notification, data);
        }
    }
}
