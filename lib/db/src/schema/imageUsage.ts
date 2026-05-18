import { integer, pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyImageUsage = pgTable(
  "daily_image_usage",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [unique("uq_user_date").on(t.userId, t.date)],
);

export const insertDailyImageUsageSchema = createInsertSchema(
  dailyImageUsage,
).omit({ id: true });

export type DailyImageUsage = typeof dailyImageUsage.$inferSelect;
export type InsertDailyImageUsage = z.infer<
  typeof insertDailyImageUsageSchema
>;
