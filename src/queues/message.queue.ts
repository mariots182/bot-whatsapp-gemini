import { Queue } from "bullmq";
import config from "../config";
import { Queues } from "../utils/enums";

const { host, port } = config.redis;

export const messageQueue = new Queue(Queues.MESSAGES, {
  connection: {
    host: `${host}`,
    port: Number(port),
    password: config.redis.password,
    maxRetriesPerRequest: null,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: true,
  },
});
