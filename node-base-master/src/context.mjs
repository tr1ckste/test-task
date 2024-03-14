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
        const { path } = this.#requestContext;
        this.#sessionContext[path].searchParams = this.#requestContext.searchParams;
        this.#done = this.#done || isDone;
    }

    /**
     * Sets cursor for data
     * @param cursor
     */
    set cursor(cursor) {
        const { path } = this.#requestContext;
        this.#sessionContext[path].cursor = cursor;
    }

    /**
     * Gets cursor for data if it exists
     * @param cursor
     */
    get cursor() {
        const { path } = this.#requestContext;
        if (this.#sessionContext[path].cursor) return this.#sessionContext[path].cursor;
        return null;
    }

    /**
     * Sets search params (we need them to check if cursor resetting is needed)
     * @param {URLSearchParams} searchParams
     */
    set searchParams(searchParams) {
        this.#sessionContext[path].searchParams = searchParams;
    }

    /**
     * @returns {object}
     */
    get sessionSearchParams() {
        const { path } = this.#requestContext;
        if (this.#sessionContext[path].searchParams) {
            return this.#sessionContext[path].searchParams;
        }
        return null;
    }

    /**
     * @returns {URLSearchParams}
     */
    get requestSearchParams() {
        if (this.#requestContext.searchParams) {
            return this.#requestContext.searchParams;
        }
        return null;
    }

    /**
     * Is the request processing done?
     * @returns {boolean}
     */
    get done() {
        return this.#done;
    }

    constructor(sessionContext, path, searchParams) {
        this.#sessionContext = sessionContext;
        if (!this.#sessionContext[path]) this.#sessionContext[path] = {}; 
        this.#requestContext.searchParams = searchParams;
        this.#requestContext.path = path;
    }
}
