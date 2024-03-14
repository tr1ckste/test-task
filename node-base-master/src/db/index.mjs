import { MongoClient, ServerApiVersion } from "mongodb";
import { initEnv } from "../env.mjs";
initEnv();

const uri = process.env.MONGO_CONNECTION_URL;
export const client = new MongoClient(uri,  {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

/**
 *
 * @param {string} database
 * @param {string} collection
 */
export const getCollection = (database, collection) =>
    client.db(database).collection(collection);
