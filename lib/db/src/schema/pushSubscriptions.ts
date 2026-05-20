import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    pushToken: text("push_token").notNull(),
    topicId: text("topic_id").notNull(),
    topicTitle: text("topic_title").notNull(),
    topicEmoji: text("topic_emoji").notNull().default("📚"),
    profileJson: text("profile_json").notNull(),
    quietHours: text("quiet_hours").notNull().default("none"),
    frequencySeconds: integer("frequency_seconds").notNull().default(14400),
    nextSendAt: timestamp("next_send_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("uq_user_topic_push").on(t.userId, t.topicId)],
);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
