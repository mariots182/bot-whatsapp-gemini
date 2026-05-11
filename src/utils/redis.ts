import { createClient } from "redis";
import logger from "./logger";
import config from "../config";

const { host, port } = config.redis;

const redisUrl = `redis://${host}:${port}`;

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
  },
});

redisClient.on("error", (err) =>
  logger.error(`Redis Client Error: ${err.message}`),
);

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();

    logger.info("Conectado a Redis exitosamente");
  }
};

export const appendToBuffer = async (waId: string, text: string) => {
  const key = `buffer:${waId}`;
  const current = await redisClient.get(key);
  const updated = current ? `${current} ${text}` : text;
  await redisClient.set(key, updated, { EX: 60 });
  return updated;
};

export const clearBuffer = async (waId: string) => {
  await redisClient.del(`buffer:${waId}`);
};

export default redisClient;
