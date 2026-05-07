export interface WhatsAppMessage {
  to: string;
  phoneNumberId: string;
  message?: string;
  interactiveButtonReply?: InteractiveButtonReply;
  interactiveListReply?: InteractiveListReply;
  file?: Document;
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
