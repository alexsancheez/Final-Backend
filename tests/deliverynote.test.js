import request from "supertest";
import app from "../src/app.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";
import { registerAndLogin, setupCompany } from "./helpers.js";
import DeliveryNote from "../src/models/DeliveryNote.js";

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("DeliveryNotes", () => {
  let token;
  let clientId;
  let projectId;

  beforeEach(async () => {
    token = await registerAndLogin("dn@test.com");
    await setupCompany(token);

    const clientRes = await request(app)
      .post("/api/client")
      .set("Authorization", "Bearer " + token)
      .send({
        name: "Cliente DN",
        cif: "A22222222",
        address: { street: "C", number: "1", postal: "28001", city: "Madrid", province: "Madrid" },
      });
    clientId = clientRes.body._id;

    const projectRes = await request(app)
      .post("/api/project")
      .set("Authorization", "Bearer " + token)
      .send({
        name: "Proyecto DN",
        projectCode: "PDN-" + Date.now(),
        client: clientId,
        address: { street: "C", number: "1", postal: "28001", city: "Madrid", province: "Madrid" },
      });
    projectId = projectRes.body._id;
  });

  const getNoteData = () => ({
    project: projectId,
    client: clientId,
    format: "hours",
    description: "Trabajo realizado",
    workDate: "2025-06-15",
    hours: 8,
    workers: [{ name: "Juan", hours: 8 }],
  });

  describe("POST /api/deliverynote", () => {
    it("deberia crear un albaran", async () => {
      const res = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", "Bearer " + token)
        .send(getNoteData())
        .expect(201);

      expect(res.body.format).toBe("hours");
      expect(res.body.hours).toBe(8);
    });
  });

  describe("GET /api/deliverynote", () => {
    it("deberia listar albaranes", async () => {
      await request(app)
        .post("/api/deliverynote")
        .set("Authorization", "Bearer " + token)
        .send(getNoteData());

      const res = await request(app)
        .get("/api/deliverynote")
        .set("Authorization", "Bearer " + token)
        .expect(200);

      expect(res.body.data.length).toBe(1);
    });
  });

  describe("GET /api/deliverynote/:id", () => {
    it("deberia obtener un albaran con populate", async () => {
      const createRes = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", "Bearer " + token)
        .send(getNoteData());

      const res = await request(app)
        .get("/api/deliverynote/" + createRes.body._id)
        .set("Authorization", "Bearer " + token)
        .expect(200);

      expect(res.body.format).toBe("hours");
    });
  });

  describe("PATCH /api/deliverynote/:id/sign", () => {
    it("devuelve 409 si el albaran ya estaba firmado", async () => {
      const createRes = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", "Bearer " + token)
        .send(getNoteData());

      await DeliveryNote.findByIdAndUpdate(createRes.body._id, { signed: true });

      await request(app)
        .patch("/api/deliverynote/" + createRes.body._id + "/sign")
        .set("Authorization", "Bearer " + token)
        .attach("signature", Buffer.from("fake"), "test.jpg")
        .expect(409);
    });
  });

  describe("DELETE /api/deliverynote/:id", () => {
    it("devuelve 200 si el albaran no esta firmado", async () => {
      const createRes = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", "Bearer " + token)
        .send(getNoteData());

      await request(app)
        .delete("/api/deliverynote/" + createRes.body._id)
        .set("Authorization", "Bearer " + token)
        .expect(200);
    });

    it("devuelve 409 si el albaran ya estaba firmado", async () => {
      const createRes = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", "Bearer " + token)
        .send(getNoteData());

      await DeliveryNote.findByIdAndUpdate(createRes.body._id, { signed: true });

      await request(app)
        .delete("/api/deliverynote/" + createRes.body._id)
        .set("Authorization", "Bearer " + token)
        .expect(409);
    });

    it("devuelve 404 si el albaran pertenece a otra compania", async () => {
      const createRes = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", "Bearer " + token)
        .send(getNoteData());

      const token2 = await registerAndLogin("other@test.com");
      await setupCompany(token2);

      await request(app)
        .delete("/api/deliverynote/" + createRes.body._id)
        .set("Authorization", "Bearer " + token2)
        .expect(404);
    });
  });

  describe("POST material deliverynote", () => {
    it("deberia crear un albaran de material", async () => {
      const res = await request(app)
        .post("/api/deliverynote")
        .set("Authorization", "Bearer " + token)
        .send({
          project: projectId,
          client: clientId,
          format: "material",
          description: "Entrega de material",
          workDate: "2025-06-15",
          material: "Cemento",
          quantity: 100,
          unit: "kg",
        })
        .expect(201);

      expect(res.body.format).toBe("material");
      expect(res.body.material).toBe("Cemento");
    });
  });
});
