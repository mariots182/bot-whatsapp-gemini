import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";

export const handleMessageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.info(
    `[HandleMessageMiddleware] INICIANDO handleMessageMiddleware
    req.body: ${JSON.stringify(req.body)}`,
  );

  const body = req.body;

  const change = body?.entry?.[0]?.changes?.[0]?.value;

  if (!change) {
    return res.sendStatus(400);
  }

  if (change.statuses) {
    return res.sendStatus(200);
  }

  logger.info(`[HandleMessageMiddleware] Received message change: ${change}`);

  next();
};
