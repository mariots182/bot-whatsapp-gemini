# TODO: Mejoras Avanzadas del Bot de WhatsApp

Este documento detalla los pasos y archivos a editar para implementar características avanzadas de interacción utilizando Gemini y la API de WhatsApp.

## 1. Manejo de Geolocalización
**Objetivo:** Que el bot procese ubicaciones enviadas por el usuario y pueda solicitar ubicaciones de forma proactiva.
- **Recepción de Ubicaciones:** 
  - La lógica base ya extrae la dirección usando Geocoding en `parseMessage.middleware.ts`.
  - **Archivos a revisar/editar:** 
    - `src/api/middleware/parseMessage.middleware.ts`: Asegurarse de que el texto resultante (`"El usuario ha compartido una ubicación: [dirección]"`) se pase correctamente a Redis como parte de los detalles del mensaje para que Gemini tenga el contexto de la ciudad/calle.
- **Solicitud de Ubicación (Bot a Usuario):**
  - **Archivos a editar:**
    - `PROMPT.md`: Instruir a Gemini para que, cuando requiera una dirección, responda con el `messageType` correspondiente (`REQUEST_LOCATION`) en su estructura JSON.
    - `src/services/whatsapp.service.ts`: Confirmar que el `case MessageType.REQUEST_LOCATION:` construye el payload correctamente.

## 2. Respuestas y Opciones Interactivos (Botones y Listas)
**Objetivo:** Procesar correctamente las interacciones del usuario en mensajes que contienen opciones.
- **Recepción de Botones/Listas:**
  - Actualmente se toma el `title` del botón/lista, pero a veces necesitas el `id` oculto de la respuesta para saber exactamente qué flujo activar sin depender de faltas de ortografía.
  - **Archivos a editar:**
    - `src/utils/messages/messageDetails.ts`: Validar que se están extrayendo correctamente `button_reply` y `list_reply`.
    - `src/api/middleware/parseMessage.middleware.ts`: En el `case "interactive":`, extraer tanto el `id` como el `title` para mandarle a Gemini un contexto claro (Ej: `"El usuario seleccionó la opción: [title] (ID: [id])"`).

## 3. Formularios (Flows) y Catálogos de WhatsApp
**Objetivo:** Utilizar carritos de compra nativos de WhatsApp y formularios de captura de datos interactivos (nfm_reply).
- **Recibir Formularios (Flows / `nfm_reply`):**
  - Cuando un usuario completa un Flow de WhatsApp, la respuesta llega como interactiva con un payload `nfm_reply`.
  - **Archivos a editar:**
    - `src/utils/interfaces.ts`: Agregar `nfm_reply` a las interfaces de interacción entrante.
    - `src/utils/messages/messageDetails.ts`: Extraer `interactive.nfm_reply`.
    - `src/api/middleware/parseMessage.middleware.ts`: Agregar lógica para parsear el string JSON que viene dentro de `nfm_reply.response_json` y enviárselo a Gemini como texto plano estructurado ("El usuario llenó el formulario con estos datos: ...").
- **Recibir Órdenes de Catálogo (`order`):**
  - Cuando envían un carrito de compras nativo, el `type` del webhook es `order`.
  - **Archivos a editar:**
    - `src/utils/messages/messageDetails.ts`: Quitar `"order"` de los tipos inválidos (si está) y extraer sus datos.
    - `src/api/middleware/parseMessage.middleware.ts`: Añadir un `case "order":` que formatee los items del carrito y su precio total para que Gemini los procese.

## 4. Edición del PROMPT.md (Dinámica de Interacción)
**Objetivo:** Enseñar a Gemini a utilizar todo este abanico de respuestas en lugar de solo texto plano.
- **Archivo a editar:** `PROMPT.md`
- **Acciones necesarias:**
  - Declarar explícitamente en el System Prompt los **tipos de mensaje** que Gemini puede responder (TEXT, BUTTONS_REPLY, LIST_INTERACTIVE, CATALOG, REQUEST_LOCATION, FILE).
  - Indicar **reglas de uso**. Por ejemplo:
    - *Si haces una pregunta de Sí o No, USA obligatoriamente `BUTTONS_REPLY`.*
    - *Si le das al usuario a elegir entre 4 a 10 productos/servicios, USA `LIST_INTERACTIVE`.*
    - *Si el usuario pide ver los productos de la tienda, USA `CATALOG`.*
  - Mostrar **ejemplos (few-shot prompting)** de cómo debe ser la salida en JSON puro para construir un `InteractiveButtonReply` o un `InteractiveListReply` correctamente para que encaje con tus interfaces en `src/utils/interfaces.ts`.
