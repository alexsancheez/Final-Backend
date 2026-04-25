import AppError from "../src/utils/AppError.js";

describe("AppError", () => {
  it("deberia crear error con statusCode", () => {
    const error = new AppError("test", 400);
    expect(error.message).toBe("test");
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it("deberia crear badRequest", () => {
    const error = AppError.badRequest("malo");
    expect(error.statusCode).toBe(400);
  });

  it("deberia crear unauthorized", () => {
    const error = AppError.unauthorized();
    expect(error.statusCode).toBe(401);
  });

  it("deberia crear forbidden", () => {
    const error = AppError.forbidden();
    expect(error.statusCode).toBe(403);
  });

  it("deberia crear notFound", () => {
    const error = AppError.notFound();
    expect(error.statusCode).toBe(404);
  });

  it("deberia crear conflict", () => {
    const error = AppError.conflict();
    expect(error.statusCode).toBe(409);
  });

  it("deberia crear tooManyRequests", () => {
    const error = AppError.tooManyRequests();
    expect(error.statusCode).toBe(429);
  });
});
