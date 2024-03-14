import fs from "fs";
import path from "path";
import { H2Server } from "./server.mjs";
import { Multiplexer } from "./multiplexer.mjs";
import { initEnv } from "./env.mjs";
initEnv();

const {
    HOST,
    PORT,
    SSL_KEY_FILENAME,
    SSL_CERT_FILENAME,
} = process.env;

const pathToSslKey = path.join(import.meta.dirname, `../ssl/${SSL_KEY_FILENAME}`);
const pathToSslCert = path.join(import.meta.dirname, `../ssl/${SSL_CERT_FILENAME}`);

const ssl = {
    key: fs.readFileSync(pathToSslKey),
    cert: fs.readFileSync(pathToSslCert),
};

const server = new H2Server({
    ssl,
    allowHttp1: true,
    useWebSockets: true,
});
new Multiplexer(server, x => x)
server.listen(PORT, HOST);
