export class ConnectionContext {
    /**
     *
     * @type {Object<string, any>}
     */
    #requestContext = {};
    get requestContext() {
        return this.#requestContext;
    }

    /**
     *
     * @type {Object<string, any>}
     */
    #sessionContext = {};
    get sessionContext() {
        return this.#sessionContext;
    }

    /**
     *
     * @type {boolean}
     */
    #done = false;

    /**
     * Can only be set to true. Will never reset to false.
     * @param isDone
     */
    set done(isDone) {
        this.#done = this.#done || isDone;
    }

    /**
     * Is the request processing done?
     * @returns {boolean}
     */
    get done() {
        return this.#done;
    }

    constructor(sessionContext) {
        this.#sessionContext = sessionContext;
    }
}

