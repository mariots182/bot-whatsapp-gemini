import { Request, Response, NextFunction } from "express";
import { handleGeocodingAddress } from "../utils/messages/messageGeocoding";
import { extractMessageDetails } from "../utils/messages/messageDetails";
import logger from "../utils/logger";

export const parseMessageMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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

  logger.info(
    `[ParseMessageMiddleware] Detalles del mensaje: ${JSON.stringify(messageDetails)}`,
  );

  if (!messageDetails.isValid) {
    return res.sendStatus(200);
  }

  let text: string | null = null;

  switch (type) {
    case "text":
      text = messageText;
      break;

    case "interactive":
      text = buttonReply?.title ?? listReply?.title ?? "";
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
