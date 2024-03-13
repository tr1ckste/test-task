import { Command } from "../command.mjs";
const { MongoClient, ServerApiVersion } = require("mongodb");
// Replace the placeholder with your Atlas connection string
const uri = "<connection string>";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri,  {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  }
);

const conn = mongoose.createConnection('mongodb://localhost/testA');
const conn2 = mongoose.createConnection('mongodb://localhost/testB');

export const command = new Command({
  handler: (dataTransport, context) => {
    console.log(context)
    dataTransport.addListener("error", (error) => {
      console.error(error)
    })
    console.log(dataTransport.incomingHeaders)
    dataTransport.respond({
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }, {
      endStream: false,
      waitForTrailers: false
    })
    dataTransport.sendData('biba')
    dataTransport.end()
  }
});
