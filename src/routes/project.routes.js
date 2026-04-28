import { Router } from "express";
import { createProject, updateProject, getProjects, getProject, deleteProject, getArchivedProjects, restoreProject } from "../controllers/project.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import { createProjectSchema, updateProjectSchema } from "../validators/project.validator.js";

const router = Router();

/**
 * @swagger
 * /api/project:
 *   post:
 *     tags: [Projects]
 *     summary: Crear proyecto
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Project' }
 *     responses:
 *       201: { description: Proyecto creado }
 *       409: { description: Codigo de proyecto duplicado }
 *   get:
 *     tags: [Projects]
 *     summary: Listar proyectos
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *       - { in: query, name: client, schema: { type: string } }
 *       - { in: query, name: name, schema: { type: string } }
 *       - { in: query, name: active, schema: { type: string } }
 *       - { in: query, name: sort, schema: { type: string } }
 *     responses:
 *       200: { description: Lista de proyectos paginada }
 */
router.post("/", authenticate, validate(createProjectSchema), createProject);

/**
 * @swagger
 * /api/project/archived:
 *   get:
 *     tags: [Projects]
 *     summary: Listar proyectos archivados
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Proyectos archivados }
 */
router.get("/archived", authenticate, getArchivedProjects);
router.get("/", authenticate, getProjects);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Obtener un proyecto
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Proyecto encontrado }
 *       404: { description: Proyecto no encontrado }
 *   put:
 *     tags: [Projects]
 *     summary: Actualizar un proyecto
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Proyecto actualizado }
 *   delete:
 *     tags: [Projects]
 *     summary: Eliminar o archivar un proyecto
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: soft, schema: { type: string } }
 *     responses:
 *       200: { description: Proyecto eliminado/archivado }
 */
router.get("/:id", authenticate, getProject);
router.put("/:id", authenticate, validate(updateProjectSchema), updateProject);
router.delete("/:id", authenticate, deleteProject);

/**
 * @swagger
 * /api/project/{id}/restore:
 *   patch:
 *     tags: [Projects]
 *     summary: Restaurar un proyecto archivado
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Proyecto restaurado }
 */
router.patch("/:id/restore", authenticate, restoreProject);

export default router;
