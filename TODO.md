# Buenas prácticas y hoja de ruta — WhatsApp Bot + Ventas

> Basado en: `app.ts`, `bot_service.ts`, `gemini_service.ts`, `whatsapp_service.ts`, `schema.prisma`, `gemini.ts (promptV2)` y la arquitectura discutida.

---

## 1. Diagnóstico del estado actual

### Lo que está bien

- Separación de responsabilidades clara: `BotService`, `GeminiService`, `WhatsappService`.
- Logging estructurado con Winston (niveles, archivos separados por error/all).
- Buffer de mensajes en Redis con TTL para agrupar ráfagas rápidas del mismo usuario.
- Middleware `parseMessage` que valida y normaliza antes de llegar al controller.
- El `promptV2` tiene una arquitectura sólida: contrato de API definido, estados de conversación, validación de botones, abstracción de IDs internos.
- El schema de Prisma cubre bien el dominio: órdenes, pagos, entregas, reseñas, establecimientos.

### Problemas críticos a resolver

| Problema                                    | Impacto                                                       | Solución                                        |
| ------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| `setTimeout` vive en memoria del proceso    | Crash o redeploy = mensajes perdidos sin rastro               | BullMQ con `delay` y `jobId` por usuario        |
| `new BotService()` por cada request         | No comparte estado ni conexiones                              | Instancia singleton o inyección de dependencias |
| Historial de chat solo en Redis con TTL 24h | Sin historial persistente para negocio                        | Guardar mensajes en PostgreSQL                  |
| Sin registro de usuarios desde WhatsApp     | No puedes saber quién es el cliente                           | `upsert` en tabla `User` al primer mensaje      |
| `PROMPT.md` estático sin contexto dinámico  | El bot no sabe el catálogo real ni el usuario                 | Inyectar contexto en cada llamada a Gemini      |
| `StateConversation` en tabla `User`         | El estado conversacional mezcla dominio de negocio con sesión | Mover estado a tabla `Conversation`             |

---

## 2. Arquitectura objetivo

### Patrón adoptado

**Layered Architecture + Event-Driven (BullMQ) + Repository Pattern**

```
Entrada (Webhook Express)
    ↓
Cola BullMQ (Redis)         ← desacopla HTTP del procesamiento
    ↓
Worker(s) BullMQ
    ↓
Capa de Dominio             ← UserService, OrderService, BotService
    ↓
Repositorios                ← UserRepository, OrderRepository, etc.
    ↓
PostgreSQL + Redis
```

### Estructura de carpetas

```
src/
├── api/
│   ├── controllers/
│   │   └── webhook.controller.ts       ← solo encola, responde 200
│   ├── middleware/
│   │   └── parseMessage.middleware.ts
│   └── routes/
│       ├── routes.ts
│       └── webhook.routes.ts
├── queues/
│   ├── message.queue.ts                ← definición de la cola BullMQ
│   ├── message.worker.ts               ← worker que procesa los jobs
│   └── handlers/
│       ├── bot.handler.ts              ← orquesta UserService + BotService
│       └── order.handler.ts            ← ejecuta backendActions de Gemini
├── services/
│   ├── bot.service.ts                  ← lógica de conversación + Gemini
│   ├── gemini.service.ts
│   └── whatsapp.service.ts
├── domain/
│   ├── user.service.ts                 ← upsert, buscar por wa_id
│   ├── order.service.ts                ← crear, actualizar órdenes
│   ├── address.service.ts
│   └── catalog.service.ts             ← productos disponibles del establecimiento
├── repositories/
│   ├── user.repository.ts
│   ├── order.repository.ts
│   ├── address.repository.ts
│   └── message.repository.ts          ← guarda cada mensaje recibido/enviado
├── db/
│   ├── client.ts                       ← instancia singleton de postgres/prisma
│   └── migrations/
├── utils/
│   ├── consts.ts
│   ├── enums.ts
│   ├── interfaces.ts
│   ├── logger.ts
│   └── redis.ts
├── config.ts
└── app.ts
```

---

## 3. BullMQ: migración del setTimeout

### El problema actual

```typescript
// BotService actual — timers en memoria, se pierden en cualquier crash
const timeout = setTimeout(async () => {
  await this.executeConversation(from, phoneNumberId);
}, 4000);
BotService.timers.set(from, timeout);
```

### La solución con BullMQ

```typescript
// message.queue.ts
import { Queue } from "bullmq";
import redisClient from "../utils/redis";

export const messageQueue = new Queue("messages", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
```

```typescript
// webhook.controller.ts — solo encola
export const webhookMessageController = async (req: Request, res: Response) => {
  res.sendStatus(200); // responde a WhatsApp INMEDIATAMENTE

  const message = (req as any).message;
  if (!message) return;

  const { from, phoneNumberId } = message;

  // Acumular en buffer Redis
  const bufferKey = `buffer:${from}`;
  const current = await redisClient.get(bufferKey);
  const updated = current ? `${current} ${message.text}` : message.text;
  await redisClient.set(bufferKey, updated, { EX: 60 });

  // jobId fijo por usuario = BullMQ deduplica automáticamente
  await messageQueue.add(
    "process-burst",
    { from, phoneNumberId },
    {
      delay: 4000,
      jobId: `burst:${from}`, // si llegan 5 mensajes, solo se procesa el último
    },
  );
};
```

```typescript
// message.worker.ts
import { Worker } from "bullmq";

const worker = new Worker(
  "messages",
  async (job) => {
    const { from, phoneNumberId } = job.data;
    const botHandler = new BotHandler();
    await botHandler.process(from, phoneNumberId);
  },
  {
    connection: redisClient,
    concurrency: 10, // ajustar según recursos en Render
  },
);

worker.on("failed", (job, err) => {
  logger.error(`[Worker] Job ${job?.id} falló: ${err.message}`);
});
```

---

## 4. Base de datos: decisión ORM vs SQL directo

### Recomendación para este proyecto

Dado que ya tienes un schema Prisma trabajado y relaciones complejas (User → Order → OrderItem → Product, Delivery, Payment), **mantén Prisma** para el dominio de negocio. Para las queries de sesión/buffer usa Redis directamente.

Si prefieres SQL directo, usa `postgres` (Porsager) — tagged templates, sin overhead, mismas queries.

### Modelo de datos: ajustes clave al schema actual

**1. Separar estado conversacional del User**

```prisma
// Problema: el estado de la conversación vive en User
model User {
  state StateConversation @default(INICIO)  // ❌ mezcla dominio con sesión
}

// Solución: tabla Conversation independiente
model Conversation {
  id              String            @id @default(uuid())
  userId          Int
  waId            String            // número de WhatsApp del usuario
  state           StateConversation @default(INICIO)
  currentOrder    Json?             // OBJETO_PEDIDO temporal de Gemini
  startedAt       DateTime          @default(now())
  endedAt         DateTime?
  user            User              @relation(fields: [userId], references: [id])
  messages        Message[]
}
```

**2. Agregar campo `waId` al User**

```prisma
model User {
  // ...campos existentes...
  waId        String?   @unique   // número de WhatsApp sin código de país prefix
  displayName String?             // nombre del perfil de WhatsApp
  lastActiveAt DateTime?
}
```

**3. Tabla Message para historial persistente**

```prisma
model Message {
  id              Int          @id @default(autoincrement())
  conversationId  String
  wamid           String       @unique   // ID único de WhatsApp, evita duplicados
  direction       String       // 'inbound' | 'outbound'
  type            String       // 'text' | 'interactive' | 'location' | etc.
  content         String
  rawPayload      Json?
  sentAt          DateTime     @default(now())
  conversation    Conversation @relation(fields: [conversationId], references: [id])
}
```

**4. Agregar `conversationId` a Order**

```prisma
model Order {
  // ...campos existentes...
  conversationId  String?       // de qué conversación surgió la orden
  conversation    Conversation? @relation(fields: [conversationId], references: [id])
}
```

---

## 5. Gemini: inyección de contexto dinámico

### El problema del prompt estático

El `promptV2` actual es excelente en estructura pero no conoce al usuario concreto ni su catálogo en tiempo real. Gemini inventa IDs o asume productos.

### La solución: prompt base + contexto inyectado

```typescript
// gemini.service.ts
async sendMessageToGemini(
  contents: Content[],
  context: ConversationContext    // ← nuevo parámetro
): Promise<GeminiResponse> {

  const systemInstruction = buildSystemPrompt(context);
  // ...resto igual
}

// context.builder.ts
interface ConversationContext {
  user: {
    id: number;
    name: string;
    waId: string;
    addresses: Address[];
    creditCards: CreditCard[];
  };
  establishment: {
    id: string;
    name: string;
    address: string;
    openAt: string;
    closeAt: string;
    settings: CompanySettings;
    menuUrl: string;
  };
  products: {
    id: number;
    name: string;
    price: number;
    stock: number;
    category: string;
    description: string;
  }[];
  currentState: StateConversation;
  currentOrder: object | null;    // OBJETO_PEDIDO acumulado
}

function buildSystemPrompt(ctx: ConversationContext): string {
  return `
${promptV2()}   // el prompt base que ya tienes

################################################################
## [CONTEXTO DEL SISTEMA EN TIEMPO REAL]
################################################################

### Usuario actual
- ID: ${ctx.user.id}
- Nombre: ${ctx.user.name}
- Estado de conversación actual: ${ctx.currentState}

### Direcciones guardadas del usuario
${ctx.user.addresses.map(a =>
  `- ID ${a.id}: ${a.address_name} — ${a.street} ${a.number}, ${a.colony}`
).join('\n')}

### Establecimiento
- ID: ${ctx.establishment.id}
- Nombre: ${ctx.establishment.name}
- Horario: ${ctx.establishment.openAt} – ${ctx.establishment.closeAt}
- Menú: ${ctx.establishment.menuUrl}
- Pagos aceptados: ${buildPaymentMethods(ctx.establishment.settings)}

### Catálogo de productos disponibles
${ctx.products.map(p =>
  `- ID ${p.id} | ${p.name} | $${p.price} | Stock: ${p.stock} | Cat: ${p.category}`
).join('\n')}

### Pedido en curso
${ctx.currentOrder ? JSON.stringify(ctx.currentOrder, null, 2) : 'Sin pedido en curso'}
  `;
}
```

---

## 6. Ejecución de backendActions

Gemini devuelve `backendAction` con `functionName` y `args`. El bot service actual no tiene un ejecutor robusto. Se recomienda un dispatcher explícito:

```typescript
// order.handler.ts
const actionHandlers: Record<
  string,
  (args: any, ctx: ConversationContext) => Promise<void>
> = {
  crear_pedido: (args, ctx) => orderService.create(args, ctx),
  actualizar_pedido: (args, ctx) => orderService.update(args),
  crear_direccion: (args, ctx) => addressService.create(args),
  actualizar_direccion: (args, ctx) => addressService.update(args),
  eliminar_direccion: (args, ctx) => addressService.delete(args.addressId),
};

export async function executeBackendAction(
  action: GeminiResponse["backendAction"],
  ctx: ConversationContext,
) {
  if (!action || !action.functionName) return;

  const handler = actionHandlers[action.functionName];
  if (!handler) {
    logger.warn(`[ActionHandler] Función desconocida: ${action.functionName}`);
    return;
  }

  try {
    await handler(action.args, ctx);
    logger.info(`[ActionHandler] Ejecutada: ${action.functionName}`);
  } catch (error) {
    logger.error(`[ActionHandler] Error en ${action.functionName}: ${error}`);
    throw error; // BullMQ reintenta el job
  }
}
```

---

## 7. Redis: qué guardar dónde

| Dato                                     | Dónde                                         | TTL             |
| ---------------------------------------- | --------------------------------------------- | --------------- |
| Buffer de mensajes agrupados             | Redis `buffer:{waId}`                         | 60s             |
| Jobs de BullMQ                           | Redis (automático)                            | Hasta procesado |
| Rate limit por usuario                   | Redis `ratelimit:{waId}`                      | 60s             |
| Sesión activa (contexto cargado)         | Redis `session:{waId}`                        | 5–10 min        |
| Historial de conversación                | PostgreSQL `Message`                          | Permanente      |
| Estado de conversación                   | PostgreSQL `Conversation.state`               | Permanente      |
| OBJETO_PEDIDO temporal                   | PostgreSQL `Conversation.currentOrder` (JSON) | Hasta confirmar |
| Historial para Gemini (últimos N turnos) | Redis cache + carga desde Postgres            | 10 min          |

---

## 8. Hoja de ruta por fases

### Fase 1 — Estabilidad (1–2 semanas)

- [ ] Migrar `setTimeout` a BullMQ con `delay` y `jobId` por usuario
- [ ] Separar el worker de Express en dos servicios en Render
- [ ] Agregar `waId` y `lastActiveAt` al modelo `User`
- [ ] Hacer `upsert` de usuario al recibir cualquier mensaje
- [ ] Guardar cada mensaje en tabla `Message` (con `wamid` para no duplicar)

### Fase 2 — Persistencia de conversación (2–3 semanas)

- [ ] Crear tabla `Conversation` con `state` y `currentOrder` JSON
- [ ] Mover `StateConversation` de `User` a `Conversation`
- [ ] Cargar historial desde Postgres en lugar de solo Redis
- [ ] Cachear en Redis la sesión activa (10 min TTL)
- [ ] Inyectar contexto dinámico en cada llamada a Gemini (usuario, catálogo, establecimiento)

### Fase 3 — Motor de ventas (3–4 semanas)

- [ ] Implementar `executeBackendAction` como dispatcher tipado
- [ ] `OrderService.create()` con validación de stock antes de confirmar
- [ ] Cola dedicada para órdenes (`order-queue`) separada de mensajes
- [ ] Notificaciones proactivas: confirmación de pedido, cambio de estado de entrega
- [ ] Rate limiting por usuario en Gemini (máx 10 req/min)

### Fase 4 — Escala y observabilidad (continuo)

- [ ] Bull Board para monitorear colas en producción
- [ ] Dead Letter Queue con alertas cuando un job falla 3 veces
- [ ] Métricas: tiempo promedio de conversación hasta orden, tasa de abandono por estado
- [ ] Multi-establecimiento: un bot que sirve a varios negocios según `displayPhoneNumber`
- [ ] Admin REST API para que el negocio gestione catálogo, órdenes y usuarios

---

## 9. Buenas prácticas del prompt (promptV2)

El prompt actual es sólido. Puntos a mantener y mejorar:

**Mantener:**

- La DIRECTIVA CRÍTICA de botones (20 chars, sin duplicados) — correctísima, WhatsApp rechaza sin piedad.
- La REGLA MAESTRA de pre-vuelo antes de `backendAction` — evita llamadas incompletas.
- La abstracción de IDs internos (el usuario nunca ve un número de base de datos).
- La separación entre `newStateConversation`, `order` y `backendAction` en la respuesta JSON.

**Mejorar:**

- Agregar `conversationId` a la respuesta de Gemini para que el backend actualice el registro correcto.
- El campo `order` en la respuesta debe mapearse a `Conversation.currentOrder` en Postgres, no mantenerse solo en el historial de Redis.
- Agregar instrucción explícita de manejo de timeout: si el usuario no responde en X tiempo, guardar el estado y retomarlo cuando vuelva.
- Separar el prompt en dos archivos: `PROMPT_BASE.md` (instrucciones fijas) + `CONTEXT.md` (generado dinámicamente por request) para facilitar versionado y debugging.

---

## 10. Checklist antes de ir a producción con 300k usuarios

- [ ] BullMQ con jobs persistentes en Redis (no timers en memoria)
- [ ] Worker separado del servidor HTTP
- [ ] `upsert` de usuario en cada mensaje (idempotente)
- [ ] `wamid` único en tabla `Message` (evita procesar duplicados de WhatsApp)
- [ ] Rate limiting por usuario antes de llamar a Gemini
- [ ] Retry con backoff exponencial en el worker
- [ ] Dead Letter Queue configurada y monitoreada
- [ ] Variables de entorno separadas por ambiente (Render env groups)
- [ ] Health check endpoint para Render (`GET /health` → 200)
- [ ] Logs con nivel mínimo `info` en producción, `debug` solo en desarrollo
