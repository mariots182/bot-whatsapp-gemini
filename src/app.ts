import express from "express";
import cors from "cors";
import routes from "./api/routes/routes";
import config from "./config";

import { HTTP } from "./utils/consts";
import logger from "./utils/logger";
import { connectRedis } from "./utils/redis";

const { corsOrigin, port } = config.app;
const {
  METHODS: { GET, POST },
  HEADERS: { CONTENT_TYPE, AUTHORIZATION },
} = HTTP;

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: corsOrigin,
    methods: [GET, POST],
    allowedHeaders: [CONTENT_TYPE, AUTHORIZATION],
  }),
);

app.use(routes);

async function startServer() {
  try {
    await connectRedis();

    app.listen(port, () => {
      logger.info(`${port}`);
    });
  } catch (error) {
    logger.error("Error fatal al arrancar:", error);

    process.exit(1);
  }
}

startServer();
