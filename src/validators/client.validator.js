import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1).transform((val) => val.trim()),
  cif: z.string().min(1).transform((val) => val.trim()),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().min(1),
    number: z.string().min(1),
    postal: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
  }),
});

export const updateClientSchema = createClientSchema.partial();
