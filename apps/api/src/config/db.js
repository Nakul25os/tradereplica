const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const fs = require("fs");
const os = require("os");
const path = require("path");
const env = require("./env");

let memoryServer;

const connectDatabase = async () => {
  mongoose.set("strictQuery", true);

  const connectionUri = env.useInMemoryMongo
    ? await getMemoryMongoUri()
    : env.mongoUri;

  await mongoose.connect(connectionUri);
  console.log(
    env.useInMemoryMongo
      ? "MongoDB connected using local embedded server"
      : "MongoDB connected"
  );
};

module.exports = {
  connectDatabase,
  shutdownDatabase,
};

async function getMemoryMongoUri() {
  if (!memoryServer) {
    const dbPath = path.join(
      process.env.LOCALAPPDATA || os.tmpdir(),
      "TradeReplica",
      "mongodb"
    );
    fs.mkdirSync(dbPath, { recursive: true });

    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: "tradereplica",
        dbPath,
      },
    });
  }

  return memoryServer.getUri();
}

async function shutdownDatabase() {
  await mongoose.connection.close();

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
