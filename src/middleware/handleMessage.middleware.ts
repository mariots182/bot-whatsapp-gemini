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
    logger.warn(
      "[HandleMessageMiddleware] No se encontraron cambios en el cuerpo de la solicitud.",
    );
    return res.sendStatus(400);
  }

  if (change.statuses) {
    logger.info(
      `[HandleMessageMiddleware] Recibido cambio de estado: ${JSON.stringify(
        change.statuses,
      )}`,
    );
    return res.sendStatus(200);
  }

  logger.info(
    `[HandleMessageMiddleware] Received message change: ${JSON.stringify(change)}`,
  );

  next();
};
