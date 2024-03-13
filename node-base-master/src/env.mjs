const ENV_VARIABLES = {
  HOST: "localhost",
  PORT: "5000",
  MONGO_CONNECTION_URL: "mongodb://localhost:27017",
  SSL_KEY_FILENAME: 'localhost-privkey.pem',
  SSL_CERT_FILENAME: 'localhost-cert.pem',
}

export const initEnv = () => {
  for (const [key, value] of Object.entries(ENV_VARIABLES)) {
    process.env[key] = value
  }
}
