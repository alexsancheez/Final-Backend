import { Router } from "express";
import { createDeliveryNote, getDeliveryNotes, getDeliveryNote, downloadPdf, signDeliveryNote, deleteDeliveryNote } from "../controllers/deliverynote.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import upload from "../middleware/upload.js";
import { createDeliveryNoteSchema } from "../validators/deliverynote.validator.js";

const router = Router();

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     tags: [DeliveryNotes]
 *     summary: Crear un albaran
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DeliveryNote' }
 *     responses:
 *       201: { description: Albaran creado }
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Listar albaranes
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *       - { in: query, name: project, schema: { type: string } }
 *       - { in: query, name: client, schema: { type: string } }
 *       - { in: query, name: format, schema: { type: string } }
 *       - { in: query, name: signed, schema: { type: string } }
 *       - { in: query, name: from, schema: { type: string } }
 *       - { in: query, name: to, schema: { type: string } }
 *       - { in: query, name: sort, schema: { type: string } }
 *     responses:
 *       200: { description: Lista de albaranes paginada }
 */
router.post("/", authenticate, validate(createDeliveryNoteSchema), createDeliveryNote);
router.get("/", authenticate, getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Descargar albaran en PDF
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: PDF del albaran, content: { application/pdf: {} } }
 */
router.get("/pdf/:id", authenticate, downloadPdf);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Obtener un albaran
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Albaran con datos populados }
 *   delete:
 *     tags: [DeliveryNotes]
 *     summary: Eliminar un albaran (solo si no esta firmado)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Albaran eliminado }
 *       400: { description: No se puede eliminar un albaran firmado }
 */
router.get("/:id", authenticate, getDeliveryNote);
router.delete("/:id", authenticate, deleteDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags: [DeliveryNotes]
 *     summary: Firmar un albaran
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature: { type: string, format: binary }
 *     responses:
 *       200: { description: Albaran firmado }
 *       400: { description: Ya esta firmado }
 */
router.patch("/:id/sign", authenticate, upload.single("signature"), signDeliveryNote);

export default router;
