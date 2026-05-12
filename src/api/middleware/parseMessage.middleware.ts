import { Request, Response, NextFunction } from "express";
import { handleGeocodingAddress } from "../../utils/messages/messageGeocoding";
import { extractMessageDetails } from "../../utils/messages/messageDetails";
import logger from "../../utils/logger";
import config from "../../config";

export const parseMessageMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.info(
    `[ParseMessageMiddleware] Received message: ${JSON.stringify(req.body)}`,
  );

  const change = req.body?.entry?.[0]?.changes?.[0]?.value;

  if (!change) {
    logger.warn(
      "[ParseMessageMiddleware] No se encontraron cambios en el cuerpo de la solicitud.",
    );
    return res.sendStatus(400);
  }

  if (change.statuses) {
    logger.warn(
      `[ParseMessageMiddleware] Recibido cambio de estado: ${JSON.stringify(
        change.statuses,
      )}`,
    );
    return res.sendStatus(200);
  }

  logger.info(
    `[ParseMessageMiddleware] Received message change: ${JSON.stringify(change)}`,
  );

  const messageDetails = extractMessageDetails(req.body);
  const {
    type,
    text: messageText,
    buttonReply,
    listReply,
    from,
    phoneNumberId,
    displayPhoneNumber,
  } = messageDetails;

  let text: string | null = null;

  if (!config.app.allowedNumbers!.includes(from)) {
    return res.sendStatus(200);
  }

  if (!messageDetails.isValid) {
    return res.sendStatus(200);
  }

  switch (type) {
    case "text":
      text = messageText;
      break;

    case "interactive":
      text = buttonReply?.title ?? listReply?.title ?? "";

      messageDetails.text = messageDetails.text;

      break;

    case "location":
      if (!messageDetails.location) {
        logger.warn(
          "[ParseMiddleware] No se pudo extraer la ubicación del mensaje.",
        );
        return res.sendStatus(200);
      }

      const { location } = messageDetails;

      logger.info(
        `[ParseMiddleware] Ubicación recibida: ${JSON.stringify(location)}`,
      );

      const address = await handleGeocodingAddress(location);

      text = `El usuario ha compartido una ubicación: ${address}`;

      messageDetails.text = messageDetails.text;

      break;

    case "sticker":
    case "image":
    case "audio":
    case "document":
      return res.sendStatus(200);

    default:
      logger.warn(
        `[ParseMiddleware] Tipo de mensaje no manejado: ${type}. Ignorando.`,
      );
      return res.sendStatus(200);
  }

  if (!text) {
    logger.info(
      `[ParseMiddleware] No se pudo extraer texto procesable del mensaje. Ignorando.`,
    );
    return res.sendStatus(200);
  }

  (req as any).message = {
    from,
    text,
    phoneNumberId,
    displayPhoneNumber,
    messageDetails,
    type,
  };

  logger.info(
    `[ParseMessageMiddleware] Mensaje procesado y agregado a la solicitud: ${text}`,
  );

  next();
};
