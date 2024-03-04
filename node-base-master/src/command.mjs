import {ConnectionContext} from "./context.mjs";
/**
 * @callback Handler
 * @param {DataTransport} dataTransport
 * @param {ConnectionContext} context
 */

/**
 * @callback ErrorHandler
 * @param {DataTransport} dataTransport
 * @param {ConnectionContext} context
 * @param {*} [error]
 */

/**
 * @typedef {Object} CommandConfig
 * @property {Handler[]} [preHandlers]
 * @property {Handler[]} [postHandlers]
 * @property {Handler} [handler]
 * @property {Handler} [errorHandler]
 */

export class Command {
    /**
     * The actual handler function.
     * @type Handler
     *
     */
    #handler = (dataTransport, context) => {};

    /**
     * Ordered array of preHandlers which are executed prior to the main command handler.
     * PreHandlers are meant to be used to pre-fetch, rearrange and prepare data used in the main action of the command. (i.e. fetching a user profile when requesting to make a post)
     * @type Handler[]
     */
    #preHandlers = [];

    /**
     * Ordered array of postHandlers which are to be executed after the command handler has been completed one way or another.
     * Post handlers are meant to be used to measure and log the actions after they have been taken (audit trails, timing logs etc)
     * @type Handler[]
     */
    #postHandlers = [];

    /**
     * Error Descriptor executed when an error is thrown.
     * @type ErrorHandler
     */
    #errorHandler;

    /**
     * @param {CommandConfig} config
     */
    constructor(config) {
        if (config.handler && typeof config.handler !== "function") {
            throw new Error("The handler must be a function");
        }

        this.#handler = config.handler || this.#handler;

        if (config.errorHandler && typeof config.errorHandler !== "function") {
            throw new Error("The error handler must be a function");
        }

        this.#errorHandler = config.errorHandler || this.#errorHandler;

        if (config.preHandlers && (typeof config.preHandlers !== "object" || !Array.isArray(config.preHandlers) || config.preHandlers.some((handler) => !(typeof handler === "function")))) {
            throw new Error("All pre-handlers must be functions");
        }

        if (config.postHandlers && (typeof config.postHandlers !== "object" || !Array.isArray(config.postHandlers) || config.postHandlers.some((handler) => !(typeof handler === "function")))) {
            throw new Error("All post-handlers must be functions");
        }

        this.#preHandlers = this.#preHandlers.concat(config.preHandlers || []);
        this.#postHandlers = this.#postHandlers.concat(config.postHandlers || []);
    }

    /**
     * Sets the handler function.
     * @param {Handler} handler
     */
    setHandler(handler) {
        if (typeof handler !== "function") {
            throw new Error("The handler must be a function");
        }

        this.#handler = handler;
    }

    /**
     * Sets the error descriptor.
     * @param {Handler} errorHandler
     */
    setErrorHandler(errorHandler) {
        if (typeof errorHandler !== "function") {
            throw new Error("The handler must be a function");
        }

        this.#errorHandler = errorHandler;
    }

    /**
     * Add command pre-handlers.
     * @param {Handler} preHandlers
     */
    addPreHandlers(...preHandlers) {
        if (preHandlers.some((preHandler) => (typeof preHandler !== "function"))) {
            throw new Error("All pre-handlers must be functions");
        }

        this.#preHandlers.push(...preHandlers);
    }

    /**
     * Add command post-handlers.
     * @param {Handler} postHandlers
     */
    addPostHandlers(...postHandlers) {
        if (postHandlers.some((postHandler) => (typeof postHandler !== "function"))) {
            throw new Error("All post-handlers must be functions");
        }

        this.#postHandlers.push(...postHandlers);
    }

    /**
     * Handle an incoming stream.
     * @param {DataTransport} dataTransport
     * @param {ConnectionContext} context
     * @return {Promise<void>}
     */
    async handle(dataTransport, context) {
        try {
            for (const preHandler of this.#preHandlers) {
                if (!context.done && !dataTransport.sentHeaders) {
                    await preHandler(dataTransport, context);
                }
            }

            if (!context.done && !dataTransport.sentHeaders) {
                await this.#handler(dataTransport, context);
            }

            for (const postHandler of this.#postHandlers) {
                await postHandler(dataTransport, context);
            }

        } catch (error) {
            if (!this.#errorHandler) {
                throw error;
            }

            await this.#errorHandler(dataTransport, context, error);
        }
    }
}
