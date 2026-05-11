# Bot WhatsApp Gemini

Un bot de WhatsApp altamente escalable construido con **Node.js**, **Express**, **TypeScript**, **Google Gemini AI** y la **API Cloud de WhatsApp**. Diseñado para manejar altas cargas de tráfico (comprobado para escalar a +10,000 usuarios) gracias a su arquitectura basada en colas asíncronas con **BullMQ** y **Redis**.

## Características Principales

- **Arquitectura Escalable (Stateless):** Uso de Redis para gestionar el historial de chat y "debounce" de mensajes. Permite escalar el servidor horizontalmente.
- **Procesamiento Asíncrono:** Integración con BullMQ para manejar picos de tráfico encolando mensajes de WhatsApp sin bloquear el Event Loop.
- **Google GenAI Integrado:** Soporte para respuestas inteligentes e interactivas usando los últimos modelos de Gemini.
- **Tipos de Mensajes Soportados:** Texto, botones interactivos, listas, catálogos, archivos y solicitudes de ubicación.

## Arquitectura y Flujo

1. **Webhook (`Express`):** WhatsApp envía el mensaje de un usuario a nuestro Webhook. El servidor responde inmediatamente un `Status 200` a Meta para evitar bloqueos.
2. **Buffer/Debounce (`Redis`):** Los mensajes recibidos casi al mismo tiempo por el mismo usuario se concatenan en Redis durante una pequeña ventana de tiempo.
3. **Queue (`BullMQ`):** El evento se encola.
4. **Worker (`BullMQ` + `Gemini`):** El worker toma el mensaje, recupera el historial de chat desde Redis, inyecta el `PROMPT.md` y consulta a Gemini de manera asíncrona.
5. **WhatsApp Service:** Finalmente, se formatea la respuesta de la IA (identificando si es un texto plano, botones, etc.) y se envía de vuelta al usuario usando WhatsApp Cloud API.

## Requisitos Previos

Antes de instalar y correr este proyecto, asegúrate de tener:

- **Node.js** (v18 o superior)
- **Redis** instalado y corriendo en tu máquina (o un cluster en la nube como Upstash/Redis Cloud).
- **Cuenta de Desarrollador de Meta** configurada con una App de WhatsApp y su Token de acceso.
- **Google AI Studio / Google Cloud:** Una clave API válida para usar Google Gemini.

## Instalación

1. Clona el repositorio:

   ```bash
   git clone <url-de-tu-repo>
   cd bot-whatsapp-gemini
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Crea un archivo `.env` en la raíz del proyecto basándote en el siguiente formato:

   ```env
   ENV=DEVELOPMENT
   PORT=3000
   CORS_ORIGIN_LOCAL=http://localhost:3000
   CORS_ORIGIN_PROD=https://tu-dominio-produccion.com

   # WHATSAPP CREDENTIALS
   WHATSAPP_TOKEN=tu_token_de_whatsapp_aqui
   WHATSAPP_API_URL=https://graph.facebook.com/
   WHATSAPP_API_VERSION=v25.0

   # GEMINI CREDENTIALS
   GOOGLE_GEMINI_API_KEY=tu_gemini_api_key_aqui
   GOOGLE_GEMINI_MODEL=gemini-3.1-flash-lite-preview

   # GEOLOCATION
   GOOGLE_GEOLOCATION_API_KEY=tu_api_key_de_google_maps
   GOOGLE_GEOLOCATION_API_URL=https://maps.googleapis.com/maps/api/geocode/json

   # REDIS CONFIGURATION
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # BULLMQ CONFIGURATION
   BULLMQ_WORKER_CONCURRENCY=10
   BULLMQ_WORKER_MAX_CONCURRENCY=5000
   ```

4. Configura el comportamiento del bot modificando el archivo `PROMPT.md` en la raíz. Este archivo dictará el comportamiento base de Gemini.

## Uso en Local (Desarrollo)

Para probar el bot de forma local, necesitas exponer tu servidor local a Internet para que Meta pueda enviar los webhooks. Recomendamos usar **Ngrok** o **Localtunnel**.

1. Asegúrate de tener tu servidor **Redis** corriendo:

   ```bash
   redis-server
   ```

2. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

3. En otra terminal, expón el puerto de tu aplicación (ej. 3000):

   ```bash
   ngrok http 3000
   ```

4. Ve a tu panel de desarrollador de Meta (WhatsApp) y configura la URL de Webhook con la URL de Ngrok (ej. `https://tu-ngrok-url.app/webhook`). Usa el mismo token de validación que definiste en Meta (este coincide con la variable `WHATSAPP_TOKEN` en este proyecto, o configúralo en el código).

## Uso en Producción (Render)

La aplicación está preparada y configurada para ser desplegada en **Render** como un Web Service.

1. **Crear Web Service en Render:** Conecta tu repositorio de GitHub a Render y crea un nuevo Web Service.
2. **Configuración de Comandos:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. **Variables de Entorno (Environment):** En el panel de Render, agrega todas las variables de tu archivo `.env`.
   - Recuerda establecer `ENV=PRODUCTION`
   - Configura `CORS_ORIGIN_PROD` con la URL pública que Render te asigne (ej. `https://bot-whatsapp-gemini-xxxx.onrender.com`).
4. **Configuración de Redis Externo:** Dado que Render (en su capa gratuita para web services) no tiene Redis integrado de manera persistente o gratuita permanente, utiliza un servicio como **Upstash** o **Redis Cloud**. Obtén las credenciales y completa `REDIS_HOST`, `REDIS_PORT` y `REDIS_PASSWORD` en las variables de entorno de Render.
5. **Configuración en Meta:** Por último, no olvides actualizar la "URL de devolución de llamada" (Webhook URL) en el panel de desarrolladores de WhatsApp apuntando a tu nueva URL de Render: `https://tu-app.onrender.com/webhook`.

### Consideraciones de Escalabilidad (10,000+ usuarios)

- **Workers Dinámicos:** Puedes aumentar la cantidad de mensajes que procesas al mismo tiempo incrementando la variable `BULLMQ_WORKER_CONCURRENCY` según el hardware del servidor.
- **Caché en Memoria:** El archivo `PROMPT.md` se carga sincronamente _sólo al inicio_ (constructor de `GeminiService`) para no bloquear el Event Loop bajo estrés, asegurando tiempos de respuesta rápidos.
- **Balanceo de Carga:** Debido a que el estado (chat history y buffer) reside en Redis, puedes desplegar 2 o más contenedores/instancias del bot frente a un Load Balancer de forma segura.

## Estructura del Proyecto (`src/`)

- `api/`: Controladores, rutas (Webhook) y middlewares de Express.
- `queues/`: Lógica asíncrona de BullMQ (`message.queue.ts` y `message.worker.ts`).
- `services/`: Lógica central del negocio.
  - `bot.service.ts`: Coordina las integraciones.
  - `gemini.service.ts`: Comunicación con Google GenAI.
  - `whatsapp.service.ts`: Envío y formateo de mensajes a través de WhatsApp Graph API.
- `utils/`: Tipos (`interfaces.ts`), Redis client, constantes y configuradores.
- `app.ts` y `config.ts`: Inicialización y configuración central del sistema.
