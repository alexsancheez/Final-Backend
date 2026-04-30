import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BildyApp API",
      version: "1.0.0",
      description: "API REST para gestion de albaranes",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            email: { type: "string" },
            name: { type: "string" },
            lastName: { type: "string" },
            nif: { type: "string" },
            role: { type: "string", enum: ["admin", "guest"] },
            status: { type: "string", enum: ["pending", "verified"] },
          },
        },
        Company: {
          type: "object",
          properties: {
            name: { type: "string" },
            cif: { type: "string" },
            address: { $ref: "#/components/schemas/Address" },
            logo: { type: "string" },
            isFreelance: { type: "boolean" },
          },
        },
        Address: {
          type: "object",
          properties: {
            street: { type: "string" },
            number: { type: "string" },
            postal: { type: "string" },
            city: { type: "string" },
            province: { type: "string" },
          },
        },
        Client: {
          type: "object",
          properties: {
            name: { type: "string" },
            cif: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            address: { $ref: "#/components/schemas/Address" },
          },
        },
        Project: {
          type: "object",
          properties: {
            name: { type: "string" },
            projectCode: { type: "string" },
            client: { type: "string" },
            address: { $ref: "#/components/schemas/Address" },
            email: { type: "string" },
            notes: { type: "string" },
            active: { type: "boolean" },
          },
        },
        DeliveryNote: {
          type: "object",
          properties: {
            project: { type: "string" },
            client: { type: "string" },
            format: { type: "string", enum: ["material", "hours"] },
            description: { type: "string" },
            workDate: { type: "string", format: "date" },
            material: { type: "string" },
            quantity: { type: "number" },
            unit: { type: "string" },
            hours: { type: "number" },
            workers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  hours: { type: "number" },
                },
              },
            },
            signed: { type: "boolean" },
            signatureUrl: { type: "string" },
            pdfUrl: { type: "string" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: {} },
            totalItems: { type: "integer" },
            totalPages: { type: "integer" },
            currentPage: { type: "integer" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
