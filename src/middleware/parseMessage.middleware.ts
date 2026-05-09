import { Request, Response, NextFunction } from "express";
import { handleGeocodingAddress } from "../utils/messages/messageGeocoding";
import { extractMessageDetails } from "../utils/messages/messageDetails";
// import { sendMessage } from "../utils/whatsapp";

export const parseMessageMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("[ParseMessageMiddleware] INICIANDO parseMessageMiddleware");
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

  console.log("[ParseMessageMiddleware] Detalles del mensaje:", messageDetails);

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
        console.warn(
          "[ParseMiddleware] No se pudo extraer la ubicación del mensaje.",
        );
        return res.sendStatus(200);
      }

      const { location } = messageDetails;

      console.log("[ParseMiddleware] Ubicación recibida:", location);

      const address = await handleGeocodingAddress(location);

      text = `El usuario ha compartido una ubicación: ${address}`;

      break;

    case "sticker":
    case "image":
    case "audio":
    case "document":
      // await sendMessage({
      //   to: from,
      //   phoneNumberId: phoneNumberId,
      //   message:
      //     "Gracias, pero por ahora no puedo procesar este tipo de archivos. ¿Puedo ayudarte con otra cosa?",
      // });
      return res.sendStatus(200);

    default:
      console.warn(
        `[ParseMiddleware] Tipo de mensaje no manejado: ${type}. Ignorando.`,
      );
      return res.sendStatus(200);
  }

  if (!text) {
    console.log(
      "[ParseMiddleware] No se pudo extraer texto procesable del mensaje. Ignorando.",
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

  next();
};
