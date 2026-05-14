# EXAMEN — Alex

## Reto
F12 — Corregir semántica HTTP 400→409 en albarán firmado + tests del contrato

## Tarea técnica
### Qué problema detecté
Detecté que en los controladores de albaranes (`signDeliveryNote` y `deleteDeliveryNote`) se estaba devolviendo un error `400 Bad Request` cuando se intentaba interactuar con un albarán que ya estaba firmado. Además, la consulta de listado de albaranes no estaba optimizada y hacía full-collection scan.

### Cómo lo arreglé
Cambié la instanciación del error de `AppError.badRequest(...)` a `AppError.conflict(...)` en ambas funciones de `src/controllers/deliverynote.controller.js`. Además, añadí un índice compuesto en el modelo de Mongoose (`deliveryNoteSchema.index({ company: 1, deleted: 1, workDate: -1 });`) y escribí los 4 tests de integración que documentan el nuevo contrato y la protección multi-tenant.

### Por qué mi solución es correcta
Mi solución es correcta porque un albarán ya firmado no representa una petición malformada por parte del cliente, sino un conflicto con el estado actual del negocio en el servidor (regla de no poder eliminar o refirmar algo ya finalizado), lo que corresponde exactamente a la semántica del código 409. El índice compuesto mejora radicalmente el rendimiento al evitar el full-collection scan.

## Respuestas socráticas
1. Un 400 indica que la petición está mal construida o faltan datos obligatorios. Un 409 indica que la petición está perfectamente construida, pero entra en conflicto con el estado actual del servidor (ej. código duplicado o albarán ya cerrado). Usar 409 transmite al cliente que no puede reintentar la operación hasta que el estado del recurso cambie.
2. Reemplazar 400 por 409 no afecta a Slack, porque el middleware solo captura errores `statusCode >= 500`. Los errores 500 son fallos críticos e inesperados del servidor que requieren atención inmediata de un desarrollador. Los 4XX son errores del cliente (mal uso, validación, conflictos lógicos) y no deben saturar el canal de alertas técnicas.
3. El índice compuesto permite a MongoDB resolver la consulta en una sola pasada de índice porque primero filtra por empresa, luego por estado de borrado, y finalmente recorre las fechas. El `-1` significa orden descendente (los más recientes primero). El orden importa porque la base de datos filtra secuencialmente, emulando la estructura jerárquica de la propia consulta (de lo más específico/discriminatorio al orden final).
4. El usuario sí recibirá el evento `deliverynote:new` dos veces, uno en cada pestaña, porque cada pestaña abre su propia conexión de Socket.IO independiente. Esto es técnicamente correcto a nivel de red, ya que ambas vistas necesitan actualizarse. Para evitar problemas de duplicados visuales, habitualmente se confía en el Frontend, utilizando gestores de estado (Redux, Zustand) o React Query que descartan los objetos con el mismo `_id`.
5. El middleware limpia las peticiones de forma recursiva revisando únicamente `req.body` (a diferencia de express-mongo-sanitize que también limpia query y params). Si un atacante envía `{ "company": { "$gt": "" } }` en el body, el middleware elimina las claves con prefijo `$`. Aunque en `GET /api/deliverynote` el valor de `company` se saca de forma segura del usuario autenticado (`user.company`), en otras consultas (como POST o PUT) que dependan del body, si el middleware no existiera, Mongoose ejecutaría literalmente esa inyección, lo que podría comprometer la integridad de la base de datos.

## Proceso
Tiempo total invertido: 1 hora
Herramientas usadas: VS Code, Node.js, MongoDB Memory Server, IA (Antigravity).
Prompts a IA:
- "hay que subirlo a una rama del proyecti a github" (Para crear rama y hacer push)

Commits descriptivos y git push realizados correctamente.
