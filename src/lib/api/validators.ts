import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const brandSchema = z.object({
  name: z.string().min(1).max(200),
  website: z.string().url().optional().or(z.literal("")),
  contact: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const bannerSchema = z.object({
  brandId: z.string().min(1),
  title: z.string().min(1).max(200),
  /** Optional brand destination link */
  clickUrl: z.string().url().optional().or(z.literal("")).nullable(),
  startDate: z.string().datetime().or(z.string().min(1)),
  endDate: z.string().datetime().or(z.string().min(1)),
  priority: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().optional(),
});

export const musicSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().optional(),
  duration: z.coerce.number().int().min(0).optional(),
  /** Course day 1–30 — required on create; optional on PATCH via .partial() */
  dayNumber: z.coerce.number().int().min(1).max(30),
});

export const mantraSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  mantraHint: z.string().max(500).optional(),
  /** One of the 6 course yantras — required on create; optional on PATCH via .partial() */
  yantraId: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().optional(),
  duration: z.coerce.number().int().min(0).optional(),
});

export const deletionRequestSchema = z.object({
  email: z.string().email(),
  reason: z.string().max(2000).optional(),
});

export const deletionReviewSchema = z.object({
  action: z.enum(["approve", "reject", "complete_manual"]),
  adminNotes: z.string().max(2000).optional(),
});

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  projectId: z.string().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
