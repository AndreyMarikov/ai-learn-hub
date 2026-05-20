import { Router } from "express";
import { db, pushSubscriptions } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const notificationsRouter = Router();

function frequencyToSeconds(frequency: string): number {
  const f = (frequency ?? "").toLowerCase();
  if (f.includes("several")) return 4 * 3600;
  if (f.includes("once") || f.includes("daily")) return 24 * 3600;
  return 2 * 24 * 3600;
}

notificationsRouter.post("/notifications/subscribe", async (req, res) => {
  try {
    const { userId, pushToken, topicId, topicTitle, topicEmoji, profile, quietHours } =
      req.body as {
        userId?: string;
        pushToken?: string;
        topicId?: string;
        topicTitle?: string;
        topicEmoji?: string;
        profile?: Record<string, unknown>;
        quietHours?: string;
      };

    if (!userId || !pushToken || !topicId || !topicTitle || !profile) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const frequencySeconds = frequencyToSeconds(
      (profile.notificationFrequency as string) ?? "",
    );

    const nextSendAt = new Date(Date.now() + frequencySeconds * 1000);

    await db
      .insert(pushSubscriptions)
      .values({
        userId,
        pushToken,
        topicId,
        topicTitle,
        topicEmoji: topicEmoji ?? "📚",
        profileJson: JSON.stringify(profile),
        quietHours: quietHours ?? "none",
        frequencySeconds,
        nextSendAt,
      })
      .onConflictDoUpdate({
        target: [pushSubscriptions.userId, pushSubscriptions.topicId],
        set: {
          pushToken,
          topicTitle,
          topicEmoji: topicEmoji ?? "📚",
          profileJson: JSON.stringify(profile),
          quietHours: quietHours ?? "none",
          frequencySeconds,
          nextSendAt,
        },
      });

    res.json({ success: true });
  } catch (error) {
    req.log?.error({ error }, "Notification subscribe error");
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

notificationsRouter.delete("/notifications/unsubscribe", async (req, res) => {
  try {
    const { userId, topicId } = req.body as {
      userId?: string;
      topicId?: string;
    };

    if (!userId || !topicId) {
      res.status(400).json({ error: "userId and topicId required" });
      return;
    }

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.topicId, topicId),
        ),
      );

    res.json({ success: true });
  } catch (error) {
    req.log?.error({ error }, "Notification unsubscribe error");
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

export default notificationsRouter;
