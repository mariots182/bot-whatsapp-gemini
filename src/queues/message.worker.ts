import { Job, Worker } from "bullmq";
import config from "../config";
import { Queues } from "../utils/enums";
import logger from "../utils/logger";
import { BotHandler } from "./handlers/bot.handler";

const botHandler = new BotHandler();
const { redis, bullmq } = config;
const { host, port, password } = redis;
const { concurrency } = bullmq.worker;

const worker = new Worker(
  Queues.MESSAGES,
  async (job) => {
    const { from, phoneNumberId } = job.data;

    logger.info(`[MessageWorker] Procesando job ${job?.id} para ${from}`);

    const result = await botHandler.process(from, phoneNumberId);

    logger.info(
      `[Worker] Job ${job?.id} completado: ${JSON.stringify(result)}`,
    );
  },
  {
    connection: {
      host,
      port: Number(port),
      password,
    },
    concurrency,
  },
);

worker.on("ready", () => {
  logger.info(
    `[Worker] Worker de BullMQ está listo y escuchando trabajos de la cola ${Queues.MESSAGES}`,
  );
});

worker.on("active", (job) => {
  logger.info(`[Worker] Job ${job?.id} activo`);
});

worker.on("completed", (job) => {
  logger.info(`[Worker] Job ${job?.id} completado`);
});

worker.on("error", (err) => {
  logger.error(`[Worker] Error: ${err}`);
});

worker.on("failed", (job, err) => {
  logger.error(`[Worker] Job ${job?.id} falló: ${err.message}`);
});
