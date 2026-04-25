import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1).transform((val) => val.trim()),
  projectCode: z.string().min(1).transform((val) => val.trim()),
  client: z.string().min(1),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  address: z.object({
    street: z.string().min(1),
    number: z.string().min(1),
    postal: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
  }),
});

export const updateProjectSchema = createProjectSchema.partial();
