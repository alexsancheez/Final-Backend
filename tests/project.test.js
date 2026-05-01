import request from "supertest";
import app from "../src/app.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";
import { registerAndLogin, setupCompany } from "./helpers.js";

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("Projects", () => {
  let token;
  let clientId;

  beforeEach(async () => {
    token = await registerAndLogin("project@test.com");
    await setupCompany(token);

    const clientRes = await request(app)
      .post("/api/client")
      .set("Authorization", "Bearer " + token)
      .send({
        name: "Cliente Proyecto",
        cif: "A11111111",
        address: { street: "C", number: "1", postal: "28001", city: "Madrid", province: "Madrid" },
      });
    clientId = clientRes.body._id;
  });

  const getProjectData = () => ({
    name: "Proyecto Test",
    projectCode: "PRJ-" + Date.now(),
    client: clientId,
    address: { street: "C", number: "1", postal: "28001", city: "Madrid", province: "Madrid" },
  });

  describe("POST /api/project", () => {
    it("deberia crear un proyecto", async () => {
      const res = await request(app)
        .post("/api/project")
        .set("Authorization", "Bearer " + token)
        .send(getProjectData())
        .expect(201);

      expect(res.body.name).toBe("Proyecto Test");
    });
  });

  describe("GET /api/project", () => {
    it("deberia listar proyectos", async () => {
      await request(app)
        .post("/api/project")
        .set("Authorization", "Bearer " + token)
        .send(getProjectData());

      const res = await request(app)
        .get("/api/project")
        .set("Authorization", "Bearer " + token)
        .expect(200);

      expect(res.body.data.length).toBe(1);
    });
  });

  describe("GET /api/project/:id", () => {
    it("deberia obtener un proyecto", async () => {
      const createRes = await request(app)
        .post("/api/project")
        .set("Authorization", "Bearer " + token)
        .send(getProjectData());

      const res = await request(app)
        .get("/api/project/" + createRes.body._id)
        .set("Authorization", "Bearer " + token)
        .expect(200);

      expect(res.body.name).toBe("Proyecto Test");
    });
  });

  describe("DELETE /api/project/:id", () => {
    it("deberia archivar un proyecto", async () => {
      const createRes = await request(app)
        .post("/api/project")
        .set("Authorization", "Bearer " + token)
        .send(getProjectData());

      await request(app)
        .delete("/api/project/" + createRes.body._id + "?soft=true")
        .set("Authorization", "Bearer " + token)
        .expect(200);
    });
  });
});
