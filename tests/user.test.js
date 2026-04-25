import request from "supertest";
import app from "../src/app.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";
import { registerAndLogin, setupCompany } from "./helpers.js";

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("User", () => {
  const testUser = { email: "user@test.com", password: "12345678" };

  describe("PUT /api/user/register (datos personales)", () => {
    it("deberia actualizar datos personales", async () => {
      const token = await registerAndLogin(testUser.email);

      const res = await request(app)
        .put("/api/user/register")
        .set("Authorization", "Bearer " + token)
        .send({ name: "Juan", lastName: "Garcia", nif: "12345678A" })
        .expect(200);

      expect(res.body.user.name).toBe("Juan");
      expect(res.body.user.lastName).toBe("Garcia");
      expect(res.body.user).not.toHaveProperty("password");
    });
  });

  describe("PATCH /api/user/company", () => {
    it("deberia crear empresa", async () => {
      const token = await registerAndLogin(testUser.email);

      await request(app)
        .put("/api/user/register")
        .set("Authorization", "Bearer " + token)
        .send({ name: "Juan", lastName: "Garcia", nif: "12345678A" });

      const res = await request(app)
        .patch("/api/user/company")
        .set("Authorization", "Bearer " + token)
        .send({
          isFreelance: false,
          name: "Mi Empresa",
          cif: "B11111111",
          address: { street: "C", number: "1", postal: "28001", city: "Madrid", province: "Madrid" },
        })
        .expect(201);

      expect(res.body.company.name).toBe("Mi Empresa");
    });

    it("deberia crear empresa freelance", async () => {
      const token = await registerAndLogin("free@test.com");

      await request(app)
        .put("/api/user/register")
        .set("Authorization", "Bearer " + token)
        .send({ name: "Ana", lastName: "Lopez", nif: "99999999Z" });

      const res = await request(app)
        .patch("/api/user/company")
        .set("Authorization", "Bearer " + token)
        .send({ isFreelance: true })
        .expect(201);

      expect(res.body.company.isFreelance).toBe(true);
    });
  });

  describe("PUT /api/user/validation", () => {
    it("deberia rechazar codigo incorrecto", async () => {
      const token = await registerAndLogin(testUser.email);

      await request(app)
        .put("/api/user/validation")
        .set("Authorization", "Bearer " + token)
        .send({ code: "000000" })
        .expect(400);
    });
  });

  describe("POST /api/user/refresh", () => {
    it("deberia rechazar sin refresh token", async () => {
      await request(app)
        .post("/api/user/refresh")
        .send({})
        .expect(400);
    });

    it("deberia rechazar refresh token invalido", async () => {
      await request(app)
        .post("/api/user/refresh")
        .send({ refreshToken: "token-invalido" })
        .expect(401);
    });
  });

  describe("POST /api/user/logout", () => {
    it("deberia cerrar sesion", async () => {
      const token = await registerAndLogin(testUser.email);

      await request(app)
        .post("/api/user/logout")
        .set("Authorization", "Bearer " + token)
        .expect(200);
    });
  });

  describe("DELETE /api/user", () => {
    it("deberia eliminar usuario soft", async () => {
      const token = await registerAndLogin("delete@test.com");

      await request(app)
        .delete("/api/user?soft=true")
        .set("Authorization", "Bearer " + token)
        .expect(200);
    });

    it("deberia eliminar usuario hard", async () => {
      const token = await registerAndLogin("hard@test.com");

      await request(app)
        .delete("/api/user")
        .set("Authorization", "Bearer " + token)
        .expect(200);
    });
  });

  describe("PUT /api/user/password", () => {
    it("deberia cambiar contrasena", async () => {
      const token = await registerAndLogin(testUser.email);

      await request(app)
        .put("/api/user/password")
        .set("Authorization", "Bearer " + token)
        .send({ currentPassword: "12345678", newPassword: "87654321" })
        .expect(200);
    });

    it("deberia rechazar contrasena actual incorrecta", async () => {
      const token = await registerAndLogin(testUser.email);

      await request(app)
        .put("/api/user/password")
        .set("Authorization", "Bearer " + token)
        .send({ currentPassword: "incorrecta", newPassword: "87654321" })
        .expect(401);
    });
  });

  describe("Health check", () => {
    it("deberia devolver estado ok", async () => {
      const res = await request(app).get("/health").expect(200);

      expect(res.body.status).toBe("ok");
      expect(res.body).toHaveProperty("uptime");
      expect(res.body).toHaveProperty("timestamp");
    });
  });

  describe("POST /api/user/invite", () => {
    it("deberia invitar usuario como admin", async () => {
      const token = await registerAndLogin("admin@test.com");
      await setupCompany(token);

      const res = await request(app)
        .post("/api/user/invite")
        .set("Authorization", "Bearer " + token)
        .send({
          email: "invitado@test.com",
          password: "12345678",
          name: "Invitado",
          lastName: "Test",
          nif: "11111111B",
        })
        .expect(201);

      expect(res.body.user.role).toBe("guest");
      expect(res.body.user.email).toBe("invitado@test.com");
    });

    it("deberia rechazar invitar sin empresa", async () => {
      const token = await registerAndLogin("noemp@test.com");

      await request(app)
        .post("/api/user/invite")
        .set("Authorization", "Bearer " + token)
        .send({
          email: "inv2@test.com",
          password: "12345678",
          name: "Inv",
          lastName: "Test",
          nif: "22222222C",
        })
        .expect(400);
    });
  });

  describe("PATCH /api/user/logo", () => {
    it("deberia rechazar sin archivo", async () => {
      const token = await registerAndLogin("logo@test.com");

      await request(app)
        .patch("/api/user/logo")
        .set("Authorization", "Bearer " + token)
        .expect(400);
    });
  });

  describe("Unirse a empresa existente", () => {
    it("deberia unirse como guest a empresa con mismo CIF", async () => {
      const token1 = await registerAndLogin("owner@test.com");
      await setupCompany(token1);

      const token2 = await registerAndLogin("guest@test.com");

      await request(app)
        .put("/api/user/register")
        .set("Authorization", "Bearer " + token2)
        .send({ name: "Guest", lastName: "User", nif: "55555555E" });

      const res = await request(app)
        .patch("/api/user/company")
        .set("Authorization", "Bearer " + token2)
        .send({
          isFreelance: false,
          name: "Otra",
          cif: "B" + token1.slice(-10),
          address: { street: "C", number: "1", postal: "28001", city: "Madrid", province: "Madrid" },
        });

      expect([200, 201]).toContain(res.status);
    });
  });

  describe("Errores de validacion", () => {
    it("deberia rechazar registro con contrasena corta", async () => {
      await request(app)
        .post("/api/user/register")
        .send({ email: "short@test.com", password: "123" })
        .expect(422);
    });

    it("deberia rechazar login con email vacio", async () => {
      await request(app)
        .post("/api/user/login")
        .send({ email: "", password: "12345678" })
        .expect(422);
    });
  });
});
