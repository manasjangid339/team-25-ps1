import { z } from "zod";

/** Shared Zod schemas. Add your own schemas for your problem statement here. */

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .describe("Date in YYYY-MM-DD format");

export const chatMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().min(1).max(4000),
});

export const agentRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(30),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Example: schema for the starter "tasks" REST API
export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  due_date: isoDate.optional(),
});

export const orderIdSchema = z
  .number()
  .int()
  .positive()
  .describe("Order ID, for example 1003");

export const productIdSchema = z
  .string()
  .regex(/^P\d{3}$/, "Product ID must be P followed by 3 digits (e.g. P101)")
  .describe("Product ID like P101");
