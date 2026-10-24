import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const businessesTable = pgTable("businesses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clerkUserId: text("clerk_user_id"),
  name: text("name").notNull(),
  type: text("type").notNull(),
  categories: text("categories")
    .array()
    .notNull()
    .default([]),
  address: text("address").notNull(),
  neighborhood: text("neighborhood").notNull().default("Astoria"),
  wasteMaterial: text("waste_material").notNull(),
  wasteQuantity: text("waste_quantity").notNull(),
  wantedMaterial: text("wanted_material").notNull(),
  wantedQuantity: text("wanted_quantity").notNull().default(""),
  pickupWindow: text("pickup_window").notNull(),
  initials: text("initials").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({
  createdAt: true,
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;

export const matchRequestsTable = pgTable("match_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  businessId: integer("business_id").notNull(),
  partnerId: integer("partner_id").notNull(),
  status: text("status").notNull().default("requested"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertMatchRequestSchema = createInsertSchema(
  matchRequestsTable,
).omit({
  createdAt: true,
});

export type InsertMatchRequest = z.infer<typeof insertMatchRequestSchema>;
export type MatchRequest = typeof matchRequestsTable.$inferSelect;
