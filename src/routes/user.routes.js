import { Router } from "express";
import { register, validateEmail, login, updatePersonalData, updateCompany, uploadLogo, getUser, refreshSession, logout, deleteUser, inviteUser, changePassword } from "../controllers/user.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import authorize from "../middleware/role.middleware.js";
import upload from "../middleware/upload.js";
import { registerSchema, validationSchema, loginSchema, personalDataSchema, companySchema, inviteSchema, changePasswordSchema } from "../validators/user.validator.js";

const router = Router();

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     tags: [Users]
 *     summary: Registro de usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: Usuario registrado }
 *       409: { description: Email ya registrado }
 *       422: { description: Datos invalidos }
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     tags: [Users]
 *     summary: Validar email con codigo
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, minLength: 6, maxLength: 6 }
 *     responses:
 *       200: { description: Email verificado }
 *       400: { description: Codigo invalido }
 */
router.put("/validation", authenticate, validate(validationSchema), validateEmail);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags: [Users]
 *     summary: Login de usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login correcto, devuelve tokens }
 *       401: { description: Credenciales invalidas }
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     tags: [Users]
 *     summary: Actualizar datos personales
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               lastName: { type: string }
 *               nif: { type: string }
 *     responses:
 *       200: { description: Datos actualizados }
 */
router.put("/register", authenticate, validate(personalDataSchema), updatePersonalData);

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     tags: [Users]
 *     summary: Crear o actualizar empresa
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Empresa actualizada }
 *       201: { description: Empresa creada }
 */
router.patch("/company", authenticate, validate(companySchema), updateCompany);

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     tags: [Users]
 *     summary: Subir logo de empresa
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo: { type: string, format: binary }
 *     responses:
 *       200: { description: Logo actualizado }
 */
router.patch("/logo", authenticate, upload.single("logo"), uploadLogo);

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags: [Users]
 *     summary: Obtener usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Datos del usuario }
 *   delete:
 *     tags: [Users]
 *     summary: Eliminar usuario
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema: { type: string }
 *     responses:
 *       200: { description: Usuario eliminado }
 */
router.get("/", authenticate, getUser);
router.post("/refresh", refreshSession);
router.post("/logout", authenticate, logout);
router.delete("/", authenticate, deleteUser);
router.post("/invite", authenticate, authorize("admin"), validate(inviteSchema), inviteUser);
router.put("/password", authenticate, validate(changePasswordSchema), changePassword);

export default router;
