import { Router } from "express";
import { createClient, updateClient, getClients, getClient, deleteClient, getArchivedClients, restoreClient } from "../controllers/client.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import { createClientSchema, updateClientSchema } from "../validators/client.validator.js";

const router = Router();

/**
 * @swagger
 * /api/client:
 *   post:
 *     tags: [Clients]
 *     summary: Crear cliente
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Client' }
 *     responses:
 *       201: { description: Cliente creado }
 *       409: { description: CIF duplicado }
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *       - { in: query, name: name, schema: { type: string } }
 *       - { in: query, name: sort, schema: { type: string } }
 *     responses:
 *       200: { description: Lista de clientes paginada }
 */
router.post("/", authenticate, validate(createClientSchema), createClient);

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes archivados
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Clientes archivados }
 */
router.get("/archived", authenticate, getArchivedClients);
router.get("/", authenticate, getClients);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Obtener un cliente
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cliente encontrado }
 *       404: { description: Cliente no encontrado }
 *   put:
 *     tags: [Clients]
 *     summary: Actualizar un cliente
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cliente actualizado }
 *   delete:
 *     tags: [Clients]
 *     summary: Eliminar o archivar un cliente
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: soft, schema: { type: string } }
 *     responses:
 *       200: { description: Cliente eliminado/archivado }
 */
router.get("/:id", authenticate, getClient);
router.put("/:id", authenticate, validate(updateClientSchema), updateClient);
router.delete("/:id", authenticate, deleteClient);

/**
 * @swagger
 * /api/client/{id}/restore:
 *   patch:
 *     tags: [Clients]
 *     summary: Restaurar un cliente archivado
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cliente restaurado }
 */
router.patch("/:id/restore", authenticate, restoreClient);

export default router;
