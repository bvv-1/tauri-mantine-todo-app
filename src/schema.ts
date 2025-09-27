import { z } from "zod";

export const todoSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Todo title cannot be empty"),
  description: z.string().nullable().optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  due_date: z.string().nullable(), // Storing as Date object in form
  completed: z.boolean().default(false),
});

export type TodoSchema = z.infer<typeof todoSchema>;
