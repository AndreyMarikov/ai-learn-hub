import { db, pushSubscriptions } from "@workspace/db";
import { lte } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";
import { logger } from "./lib/logger";

function frequencyToMs(frequency: string): number {
  const f = (frequency ?? "").toLowerCase();
  if (f.includes("several")) return 4 * 3600 * 1000;
  if (f.includes("once") || f.includes("daily")) return 24 * 3600 * 1000;
  return 2 * 24 * 3600 * 1000;
}

function isInQuietHours(quietHours: string): boolean {
  const hour = new Date().getHours();
  if (quietHours === "evenings") return hour >= 21 || hour < 8;
  if (quietHours === "mornings") return hour >= 6 && hour < 9;
  return false;
}

async function generateSnippet(profile: {
  topic: string;
  skillLevel: string;
  learningStyle: string;
  intensity: string;
  goals: string;
}): Promise<string> {
  const prompt = `Generate ONE learning snippet about "${profile.topic}" for a push notification in a mobile learning app.

Learner profile:
- Skill level: ${profile.skillLevel}
- Style: ${profile.learningStyle} (${profile.intensity})
- Goals: ${profile.goals}

Requirements:
- TEACH something genuinely useful: a key concept, formula, technique, rule, or practical tip
- Sound like a knowledgeable friend texting you, not a textbook
- SHORT: 1 sentence preferred, 2 short sentences max
- Include 1-2 relevant emojis naturally woven in
- Calibrate to ${profile.skillLevel} level
- Make it fresh and specific — not generic

Return ONLY the snippet text, nothing else, no quotes, no JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 256 },
  });

  return (response.text ?? "").trim();
}

async function sendExpoPush(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
): Promise<void> {
  const payload = {
    to: pushToken,
    title,
    body,
    sound: "default",
    data,
  };

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expo push failed: ${res.status} ${text}`);
  }
}

async function runSchedulerTick(): Promise<void> {
  const now = new Date();

  const due = await db
    .select()
    .from(pushSubscriptions)
    .where(lte(pushSubscriptions.nextSendAt, now));

  if (due.length === 0) return;

  logger.info({ count: due.length }, "Scheduler: processing due subscriptions");

  await Promise.allSettled(
    due.map(async (sub) => {
      try {
        if (isInQuietHours(sub.quietHours)) {
          const nextSendAt = new Date(Date.now() + 30 * 60 * 1000);
          await db
            .update(pushSubscriptions)
            .set({ nextSendAt })
            .where(lte(pushSubscriptions.nextSendAt, now));
          return;
        }

        let profile: {
          topic: string;
          skillLevel: string;
          learningStyle: string;
          intensity: string;
          goals: string;
          notificationFrequency: string;
        };
        try {
          profile = JSON.parse(sub.profileJson) as typeof profile;
        } catch {
          return;
        }

        const snippet = await generateSnippet(profile);
        if (!snippet) return;

        const title = `${sub.topicEmoji} ${sub.topicTitle}`;
        await sendExpoPush(sub.pushToken, title, snippet, {
          topicId: sub.topicId,
          snippet,
        });

        const intervalMs = frequencyToMs(profile.notificationFrequency);
        const nextSendAt = new Date(Date.now() + intervalMs);

        await db
          .update(pushSubscriptions)
          .set({ nextSendAt })
          .where(lte(pushSubscriptions.nextSendAt, now));

        logger.info(
          { topicId: sub.topicId, userId: sub.userId },
          "Scheduler: push sent",
        );
      } catch (err) {
        logger.error(
          { err, topicId: sub.topicId },
          "Scheduler: failed to process subscription",
        );
      }
    }),
  );
}

export function startScheduler(): void {
  logger.info("Scheduler: starting");
  setInterval(() => {
    runSchedulerTick().catch((err) =>
      logger.error({ err }, "Scheduler: tick error"),
    );
  }, 60_000);
  runSchedulerTick().catch((err) =>
    logger.error({ err }, "Scheduler: initial tick error"),
  );
}
