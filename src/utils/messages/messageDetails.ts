import { WhatsAppMessageDetails } from "../interfaces";
import logger from "../logger";

export function extractMessageDetails(body: {
  entry?: Array<{
    entry?: {
      changes?: Array<{ changes?: { value: any } }>;
    };
  }>;
}): WhatsAppMessageDetails {
  const value = body?.entry?.[0].entry?.changes?.[0].changes?.value;

  logger.info(
    "[messagesUtils][extractMessageDetails] Extracting message details from body:",
    body,
  );

  const {
    metadata,
    contacts,
    messages: [messages] = [],
    statuses: [statuses] = [],
  } = value ?? {};

  const phoneNumberId = metadata?.phone_number_id;
  const displayPhoneNumber = `+${metadata?.display_phone_number}`;

  const {
    from,
    type,
    timestamp,
    id: wamid,
    location,
    image,
    sticker,
    interactive,
    text: { body: text } = {},
  } = messages ?? {};

  const {
    type: typeInteractive,
    button_reply: buttonReply,
    list_reply: listReply,
  } = interactive ?? {};

  const messageDetails: WhatsAppMessageDetails = {
    from,
    text,
    contacts,
    phoneNumberId,
    displayPhoneNumber,
    type,
    timestamp,
    wamid,
    location,
    sticker,
    statuses,
    image,
    interactive,
    typeInteractive,
    buttonReply,
    listReply,
    isValid: true,
  };

  messageDetails.isValid = isValidMessage(messageDetails);

  return messageDetails;
}

function isValidMessage(messageDetails: WhatsAppMessageDetails): boolean {
  const { from, text, displayPhoneNumber, type } = messageDetails;

  if (
    (messageDetails.statuses !== undefined &&
      messageDetails.statuses.status === "sent") ||
    (messageDetails.statuses !== undefined &&
      messageDetails.statuses.status === "delivered")
  ) {
    logger.warn(
      "[messagesUtils][isValidMessage] Message already sent or delivered",
    );
    return false;
  }

  const invalidTypes = ["sticker", "image"];
  const validSpecialTypes = ["interactive", "location", "list_reply"];

  if (invalidTypes.includes(type)) {
    logger.warn(`[messagesUtils][isValidMessage] Is a ${type} message`);
    return false;
  }

  if (validSpecialTypes.includes(type)) {
    logger.warn(`[messagesUtils][isValidMessage] Is a ${type} message`);
    return true;
  }

  if (!from || !text || !displayPhoneNumber) {
    logger.warn("[messagesUtils][isValidMessage] Incomplete payload received");
    return false;
  }

  return true;
}
