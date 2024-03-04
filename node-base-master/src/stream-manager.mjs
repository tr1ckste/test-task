class StreamManager {
    #streams = {};
    static #instance = null;

    constructor() {
        if (StreamManager.#instance) {
            return StreamManager.#instance;
        }
        StreamManager.#instance = this;
    }

    #getEmptyId() {
        while (true) {
            let id = Math.floor(Math.random() * 1e13);
            if (!this.#streams[id]) {
                return id;
            }
        }
    }

    addCommStream(commStream) {
        const id = this.#getEmptyId();
        this.#streams[id] = commStream;
        return id;
    }

    getCommStream(id) {
        return this.#streams[id];
    }
}
