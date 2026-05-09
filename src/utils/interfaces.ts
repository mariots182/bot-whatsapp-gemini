import { MessageType } from "./enums";

export interface WhatsAppMessage {
  to: string;
  phoneNumberId: string;
  message?: string;
  interactiveButtonReply?: InteractiveButtonReply;
  interactiveListReply?: InteractiveListReply;
  file?: Document;
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
  sticker: any;
  contacts?: any[];
  interactive?: any;
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
  body: {
    text: string;
  };
  header: {
    type: "text";
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

export interface ButtonsReply {
  type: "reply";
  reply: Buttons;
}

export interface Buttons {
  id: string;
  title: string;
}

interface Document {
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
  options: {
    button_reply?: InteractiveButtonReply;
    interactive_list?: InteractiveListReply;
    file?: {
      link: string;
      filename: string;
    };
  };
}

export interface GeminiResponse {
  whatsappAnswer: WhatsappAnswer;
}
