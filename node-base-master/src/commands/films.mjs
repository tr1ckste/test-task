import { Command } from "../command.mjs";
import { client } from "../db/index.mjs";
import { CORS } from "../utils/cors.mjs";

export default new Command({
    handler: async (dataTransport, context) => {
        dataTransport.addListener("error", (error) => {
            console.error(error)
        })
        dataTransport.respond(Object.assign({
            'content-type': 'application/json',
        }, CORS), {
            endStream: false,
            waitForTrailers: false
        });
        await client.connect();
        const db = client.db("sample_mflix");
        const collection = db.collection('movies');
        const cursor = collection.find({});
        if (!(await cursor.hasNext())) {
            dataTransport.end();
            context.done = true;
            return;
        }
        const data = await cursor.next();
        dataTransport.sendData(JSON.stringify(data));
        context.done = true;
        dataTransport.end();
    }
});
