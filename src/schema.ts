import { z } from "zod";

export const todoSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Todo title cannot be empty"),
  description: z.string().nullable().optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  due_date: z.date().nullable().optional(),
  completed: z.boolean().default(false),
  section_id: z.number(),
});

export type TodoSchema = z.infer<typeof todoSchema>;
