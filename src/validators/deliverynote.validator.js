import { z } from "zod";

const workerSchema = z.object({
  name: z.string().min(1),
  hours: z.number().positive(),
});

export const createDeliveryNoteSchema = z.object({
  project: z.string().min(1),
  client: z.string().min(1),
  format: z.enum(["material", "hours"]),
  description: z.string().optional(),
  workDate: z.string().transform((val) => new Date(val)),
  material: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  hours: z.number().positive().optional(),
  workers: z.array(workerSchema).optional(),
});
