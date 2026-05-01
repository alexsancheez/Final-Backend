import request from "supertest";
import app from "../src/app.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";
import { registerAndLogin, setupCompany } from "./helpers.js";

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("Clients", () => {
  let token;
  const clientData = {
    name: "Cliente Test",
    cif: "A12345678",
    email: "cliente@test.com",
    phone: "666666666",
    address: {
      street: "Calle Test",
      number: "1",
      postal: "28001",
      city: "Madrid",
      province: "Madrid",
    },
  };

  beforeEach(async () => {
    token = await registerAndLogin("client@test.com");
    await setupCompany(token);
  });

  describe("POST /api/client", () => {
    it("deberia crear un cliente", async () => {
      const res = await request(app)
        .post("/api/client")
        .set("Authorization", "Bearer " + token)
        .send(clientData)
        .expect(201);

      expect(res.body.name).toBe(clientData.name);
      expect(res.body.cif).toBe(clientData.cif);
    });

    it("deberia rechazar CIF duplicado en la misma empresa", async () => {
      await request(app)
        .post("/api/client")
        .set("Authorization", "Bearer " + token)
        .send(clientData);

      await request(app)
        .post("/api/client")
        .set("Authorization", "Bearer " + token)
        .send(clientData)
        .expect(409);
    });
  });

  describe("GET /api/client", () => {
    it("deberia listar clientes con paginacion", async () => {
      await request(app)
        .post("/api/client")
        .set("Authorization", "Bearer " + token)
        .send(clientData);

      const res = await request(app)
        .get("/api/client")
        .set("Authorization", "Bearer " + token)
        .expect(200);

      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("totalItems");
      expect(res.body).toHaveProperty("totalPages");
      expect(res.body).toHaveProperty("currentPage");
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("GET /api/client/:id", () => {
    it("deberia obtener un cliente", async () => {
      const createRes = await request(app)
        .post("/api/client")
        .set("Authorization", "Bearer " + token)
        .send(clientData);

      const res = await request(app)
        .get("/api/client/" + createRes.body._id)
        .set("Authorization", "Bearer " + token)
        .expect(200);

      expect(res.body.name).toBe(clientData.name);
    });
  });

  describe("PUT /api/client/:id", () => {
    it("deberia actualizar un cliente", async () => {
      const createRes = await request(app)
        .post("/api/client")
        .set("Authorization", "Bearer " + token)
        .send(clientData);

      const res = await request(app)
        .put("/api/client/" + createRes.body._id)
        .set("Authorization", "Bearer " + token)
        .send({ name: "Nombre Actualizado" })
        .expect(200);

      expect(res.body.name).toBe("Nombre Actualizado");
    });
  });

  describe("DELETE /api/client/:id", () => {
    it("deberia archivar un cliente con soft delete", async () => {
      const createRes = await request(app)
        .post("/api/client")
        .set("Authorization", "Bearer " + token)
        .send(clientData);

      await request(app)
        .delete("/api/client/" + createRes.body._id + "?soft=true")
        .set("Authorization", "Bearer " + token)
        .expect(200);

      const archivedRes = await request(app)
        .get("/api/client/archived")
        .set("Authorization", "Bearer " + token)
        .expect(200);

      expect(archivedRes.body.length).toBe(1);
    });
  });

  describe("PATCH /api/client/:id/restore", () => {
    it("deberia restaurar un cliente archivado", async () => {
      const createRes = await request(app)
        .post("/api/client")
        .set("Authorization", "Bearer " + token)
        .send(clientData);

      await request(app)
        .delete("/api/client/" + createRes.body._id + "?soft=true")
        .set("Authorization", "Bearer " + token);

      await request(app)
        .patch("/api/client/" + createRes.body._id + "/restore")
        .set("Authorization", "Bearer " + token)
        .expect(200);

      const listRes = await request(app)
        .get("/api/client")
        .set("Authorization", "Bearer " + token);

      expect(listRes.body.data.length).toBe(1);
    });
  });
});
