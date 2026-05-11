import { Job, Worker } from "bullmq";
import config from "../config";
import { Queues } from "../utils/enums";
import logger from "../utils/logger";
import { BotHandler } from "./handlers/bot.handler";

const worker = new Worker(
  Queues.MESSAGES,
  async (job: Job) => {
    logger.info(
      `[MessageWorker] Procesando job ${job?.id}: ${JSON.stringify(job)}`,
    );
    const { from, phoneNumberId } = job.data;
    const botHandler = new BotHandler();
    const result = await botHandler.process(from, phoneNumberId);

    logger.info(
      `[Worker] Job ${job?.id} completado: ${JSON.stringify(result)}`,
    );
  },
  {
    connection: {
      host: config.redis.host,
      port: Number(config.redis.port),
    },
    concurrency: 10,
  },
);

worker.on("failed", (job, err) => {
  logger.error(`[Worker] Job ${job?.id} falló: ${err.message}`);
});
