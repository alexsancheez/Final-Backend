import request from "supertest";
import app from "../src/app.js";

export const registerAndLogin = async (email = "test@test.com", password = "12345678") => {
  await request(app).post("/api/user/register").send({ email, password });

  const loginRes = await request(app)
    .post("/api/user/login")
    .send({ email, password });

  return loginRes.body.accessToken;
};

export const setupCompany = async (token) => {
  await request(app)
    .put("/api/user/register")
    .set("Authorization", "Bearer " + token)
    .send({ name: "Test", lastName: "User", nif: "12345678A" });

  const res = await request(app)
    .patch("/api/user/company")
    .set("Authorization", "Bearer " + token)
    .send({
      isFreelance: false,
      name: "Test Company",
      cif: "B" + Date.now(),
      address: {
        street: "Test Street",
        number: "1",
        postal: "28001",
        city: "Madrid",
        province: "Madrid",
      },
    });

  return res.body.company;
};
