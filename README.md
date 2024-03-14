# Gastro Test task

Node version: `20.11.1`

## How to start the program

Go to `chrome://flags/#allow-insecure-localhost` in chrome and turn `Allow invalid certificates for resources loaded from localhost` to `Enabled`.

### Mongo start

```
git submodule init
git submodule update
```

Then follow the instrution in the `README.md` file in `mongodb-sample-dataset` to run & fill with data mongodb.

### Backend start:

```
cd node-base-master
npm run ssl-gen
npm run start
```

### Frontend start:
```
cd client
npm run dev
```
