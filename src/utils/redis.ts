import { createClient } from "redis";
import logger from "./logger";
import config from "../config";

const redisUrl = config.redis.url;

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
  },
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();

    logger.info("Conectado a Redis exitosamente");
  }
};

export default redisClient;
