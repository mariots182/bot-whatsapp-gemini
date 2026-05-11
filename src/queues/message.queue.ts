import { Queue } from "bullmq";
import config from "../config";

const { host, port } = config.redis;

export const messageQueue = new Queue("messages", {
  connection: {
    host,
    port: Number(port),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
