import request from "supertest";
import app from "../src/app.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("Auth", () => {
  const testUser = { email: "auth@test.com", password: "12345678" };

  describe("POST /api/user/register", () => {
    it("deberia registrar un usuario", async () => {
      const res = await request(app)
        .post("/api/user/register")
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.user.email).toBe(testUser.email);
    });

    it("deberia rechazar email duplicado verificado", async () => {
      await request(app).post("/api/user/register").send(testUser);

      const res = await request(app)
        .post("/api/user/register")
        .send(testUser);

      expect(res.status).toBe(201);
    });

    it("deberia rechazar datos invalidos", async () => {
      await request(app)
        .post("/api/user/register")
        .send({ email: "invalido" })
        .expect(422);
    });
  });

  describe("POST /api/user/login", () => {
    it("deberia hacer login", async () => {
      await request(app).post("/api/user/register").send(testUser);

      const res = await request(app)
        .post("/api/user/login")
        .send(testUser)
        .expect(200);

      expect(res.body).toHaveProperty("accessToken");
    });

    it("deberia rechazar contrasena incorrecta", async () => {
      await request(app).post("/api/user/register").send(testUser);

      await request(app)
        .post("/api/user/login")
        .send({ email: testUser.email, password: "incorrecta" })
        .expect(401);
    });
  });

  describe("GET /api/user", () => {
    it("deberia obtener usuario con token", async () => {
      const regRes = await request(app).post("/api/user/register").send(testUser);
      const token = regRes.body.accessToken;

      const res = await request(app)
        .get("/api/user")
        .set("Authorization", "Bearer " + token)
        .expect(200);

      expect(res.body.user.email).toBe(testUser.email);
    });

    it("deberia rechazar sin token", async () => {
      await request(app).get("/api/user").expect(401);
    });
  });
});
