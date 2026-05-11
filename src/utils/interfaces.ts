import { Language, MessageType } from "./enums";

export interface WhatsAppMessage {
  to: string;
  phoneNumberId: string;
  message?: string;
  interactiveButtonReply?: InteractiveButtonReply;
  interactiveListReply?: InteractiveListReply;
  interactiveCatalog?: InteractiveCatalog;
  file?: WhatsappDocument;
}

export interface WhatsAppMessageDetails {
  from: string;
  text: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  type: string;
  timestamp: string;
  wamid: string;
  isValid: boolean;
  sticker: Record<string, unknown>;
  contacts?: Record<string, unknown>[];
  interactive?: Record<string, unknown>;
  typeInteractive?: string;
  buttonReply?: {
    id: string;
    title: string;
  };
  listReply?: {
    id: string;
    title: string;
    description: string;
  };
  image?: {
    mime_type: string;
    sha256: string;
    id: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  statuses?: {
    id: string;
    status: string;
    timestamp: string;
  };
  messageBody?: {
    text: string;
    type: string;
  };
}

export interface InteractiveButtonReply {
  headerText: string;
  bodyText: string;
  footerText: string;
  buttons: ButtonsReply[];
}

export interface InteractiveListReply {
  type: "list";
  header: {
    type: "text";
    text: string;
  };
  body: {
    text: string;
  };
  footer: {
    text: string;
  };
  action: {
    button: string;
    sections: Section[];
  };
}

export interface InteractiveCatalog {
  name: string;
  language: {
    code: Language;
  };
  components: Component[];
}

export interface Component {
  type: "body" | "button";
  parameters: Parameter[];
  sub_type?: MessageType.CATALOG;
  index?: number;
}

export interface Parameter {
  type: "text" | "action";
  text?: string;
  action?: {
    thumbnail_product_retailer_id: string;
  };
}

export interface ButtonsReply {
  type: "reply";
  reply: Buttons;
}

export interface Buttons {
  id: string;
  title: string;
}

export interface WhatsappDocument {
  link: string;
  filename: string;
}

interface Section {
  title: string;
  rows: row[];
}

interface row {
  id: string;
  title: string;
  description: string;
}

export interface MessageResponse {
  from: string;
  phoneNumberId: string;
  whatsappAnswer: WhatsappAnswer;
}

export interface WhatsappAnswer {
  messageType: MessageType;
  principalText: string;
  options:
    | InteractiveButtonReply
    | InteractiveListReply
    | InteractiveCatalog
    | WhatsappDocument;
}

export interface GeminiResponse {
  whatsappAnswer: WhatsappAnswer;
}
