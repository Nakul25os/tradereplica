const mongoose = require("mongoose");
const app = require("./app");
const env = require("./config/env");
const { connectDatabase, shutdownDatabase } = require("./config/db");
const { seedDatabase } = require("./data/seed");

let server;

const start = async () => {
  await connectDatabase();

  if (env.seedSampleData) {
    await seedDatabase();
  }

  server = app.listen(env.port, () => {
    console.log(`TradeReplica API listening on port ${env.port}`);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down TradeReplica API`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await shutdownDatabase();
  process.exit(0);
};

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT").catch((error) => {
    console.error("Shutdown failed", error);
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM").catch((error) => {
    console.error("Shutdown failed", error);
    process.exit(1);
  });
});

start().catch(async (error) => {
  console.error("Failed to start API", error);
  await shutdownDatabase().catch(async () => {
    await mongoose.connection.close();
  });
  process.exit(1);
});
