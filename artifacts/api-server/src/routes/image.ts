import { Router } from "express";
import { generateImage } from "@workspace/integrations-gemini-ai/image";
import { db, dailyImageUsage } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const imageRouter = Router();

const DAILY_IMAGE_LIMIT = 3;

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

imageRouter.post("/gemini/image", async (req, res) => {
  try {
    const { userId, topic, snippetText } = req.body as {
      userId?: string;
      topic?: string;
      snippetText?: string;
    };

    if (!userId || !topic) {
      res.status(400).json({ error: "userId and topic are required" });
      return;
    }

    const today = getTodayUTC();

    const existing = await db
      .select()
      .from(dailyImageUsage)
      .where(
        and(
          eq(dailyImageUsage.userId, userId),
          eq(dailyImageUsage.date, today),
        ),
      )
      .limit(1);

    const currentCount = existing[0]?.count ?? 0;

    if (currentCount >= DAILY_IMAGE_LIMIT) {
      res.json({ imageData: null, mimeType: null, limitReached: true });
      return;
    }

    const snippet = snippetText
      ? ` The notification message is: "${snippetText}"`
      : "";
    const prompt = `Create a clean, visually appealing illustration for a mobile learning notification about "${topic}".${snippet} Style: modern, minimal, flat design with soft colors. No text in the image. Square composition.`;

    const { b64_json, mimeType } = await generateImage(prompt);

    if (existing.length > 0) {
      await db
        .update(dailyImageUsage)
        .set({ count: currentCount + 1 })
        .where(
          and(
            eq(dailyImageUsage.userId, userId),
            eq(dailyImageUsage.date, today),
          ),
        );
    } else {
      await db.insert(dailyImageUsage).values({
        userId,
        date: today,
        count: 1,
      });
    }

    res.json({ imageData: b64_json, mimeType, limitReached: false });
  } catch (error) {
    req.log?.error({ error }, "Image generation error");
    res.status(500).json({ error: "Failed to generate image" });
  }
});

export default imageRouter;
