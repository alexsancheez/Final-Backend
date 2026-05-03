# BildyApp API

API REST para gestion de albaranes entre clientes y proveedores.

## Instalacion

```bash
npm install
```

## Configuracion

Copia `.env.example` a `.env` y rellena las variables:

```bash
cp .env.example .env
```

## Desarrollo

```bash
npm run dev
```

## Tests

```bash
npm test
npm run test:coverage
```

## Docker

```bash
docker compose up
```

## Documentacion API

Swagger UI disponible en: `http://localhost:3000/api-docs`

## Endpoints

### Usuarios
- POST /api/user/register
- PUT /api/user/validation
- POST /api/user/login
- PUT /api/user/register (datos personales)
- PATCH /api/user/company
- PATCH /api/user/logo
- GET /api/user
- DELETE /api/user

### Clientes
- POST /api/client
- GET /api/client
- GET /api/client/:id
- PUT /api/client/:id
- DELETE /api/client/:id
- GET /api/client/archived
- PATCH /api/client/:id/restore

### Proyectos
- POST /api/project
- GET /api/project
- GET /api/project/:id
- PUT /api/project/:id
- DELETE /api/project/:id
- GET /api/project/archived
- PATCH /api/project/:id/restore

### Albaranes
- POST /api/deliverynote
- GET /api/deliverynote
- GET /api/deliverynote/:id
- GET /api/deliverynote/pdf/:id
- PATCH /api/deliverynote/:id/sign
- DELETE /api/deliverynote/:id

### Health
- GET /health
