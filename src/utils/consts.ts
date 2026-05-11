export const ENV = {
  PRODUCTION: "PRODUCTION",
  DEVELOPMENT: "DEVELOPMENT",
};

export const WHATSAPP = {
  SUBSCRIBE: "subscribe",
  MESSAGING_PRODUCT: "whatsapp",
  RECIPIENT_TYPE: "individual",
};

export const HTTP = {
  METHODS: {
    GET: "GET",
    POST: "POST",
  },
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
  HEADERS: {
    CONTENT_TYPE: "Content-Type",
    AUTHORIZATION: "Authorization",
  },
} as const;

export const ERROR_MESSAGE =
  "Hubo un error al procesar tu solicitud. Por favor, intenta nuevamente más tarde.";
