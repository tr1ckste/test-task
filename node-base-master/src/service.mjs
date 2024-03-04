import {Command} from "./command.mjs";

export class Service extends Handler {

    constructor() {
        super();
    }

    handle(dataTransport) {
        // The ws data transports will have been multiplexed and look identical to the http2 transports.
        // This is a multiplexer stage 2 for the HTTP2 and for Websockets. The stage 1 of the multiplexing for the websockets is done in the server.
        try {

        } catch (e) {

        }
    }
}
