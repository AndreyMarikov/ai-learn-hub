import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const geminiRouter = Router();

const SYSTEM_PROMPT = `You are a calm, warm, and intelligent passive learning companion. Your purpose is to help users set up personalized passive learning streams — small snippets of knowledge delivered throughout their day, like a gentle trickle of insight.

IMPORTANT — FIRST RESPONSE ONLY:
At the very start of your FIRST response (before any other text), output a short title for this learning session on its own line, in this exact format:
TOPIC_TITLE:2-4 word title here

The title should be descriptive but concise — e.g. "Learning Japanese", "Quantum Physics Basics", "Rome & Ancient History", "Stoic Philosophy", "Machine Learning Fundamentals". After this line, continue with your normal greeting.

When someone starts a new learning topic, your role is to have a natural, welcoming conversation to understand their preferences. Gather this information through friendly dialogue (not a form or checklist):
- What they want to learn (confirm their specific interest)
- Their current knowledge level (new to it / some experience / fairly experienced)
- Whether they prefer casual exploration or more focused study
- Their approach to learning (hands-on practical examples, or deeper theoretical understanding)
- Their specific goals with this topic
- How often they'd like to receive learning snippets (several times daily / once daily / a few times a week)
- Whether there are times they don't want to be disturbed (quiet hours)

Ask naturally, one or two questions at a time. Be conversational and warm. Adapt based on their answers — if someone says "I'm a complete beginner at Japanese," you don't need to ask their skill level again.

When you have enough information (you don't need to ask every single question if context makes some answers obvious), warmly summarize their learning configuration in a few sentences, then end your message with this EXACT phrase on its own line:
Your learning flow is ready. If you want to change anything later, just tell me.

On the very next line, output their profile in this EXACT format (no code blocks, no backticks, just the raw line):
LEARNING_PROFILE:{"topic":"...","skillLevel":"beginner|intermediate|advanced","intensity":"casual|serious","learningStyle":"practical|theoretical","notificationFrequency":"several times daily|once daily|a few times a week","quietHours":"none|evenings|mornings|custom","goals":"..."}

After setup is complete, continue as a knowledgeable, friendly companion. Answer questions about their topic, share interesting insights, help them understand concepts. If they ask to change preferences, update them and re-emit the LEARNING_PROFILE line at the end of your response.

Keep responses concise and clear. Never use emojis. Sound like a brilliant, warm friend — not a teacher or a corporate app.`;

geminiRouter.post("/gemini/chat", async (req, res) => {
  try {
    const { messages } = req.body as {
      messages: Array<{ role: string; content: string }>;
    };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "messages array required" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : ("user" as "model" | "user"),
      parts: [{ text: m.content }],
    }));

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: {
        maxOutputTokens: 8192,
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate response" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

geminiRouter.post("/gemini/snippets", async (req, res) => {
  try {
    const { profile, count = 20 } = req.body as {
      profile: {
        topic: string;
        skillLevel: string;
        learningStyle: string;
        intensity: string;
        goals: string;
        notificationFrequency: string;
      };
      count?: number;
    };

    if (!profile?.topic) {
      res.status(400).json({ error: "profile with topic required" });
      return;
    }

    const prompt = `Generate exactly ${count} push notification micro-facts about "${profile.topic}" for a learning app.

Context:
- Skill level: ${profile.skillLevel}
- Style: ${profile.learningStyle} (${profile.intensity})
- Goals: ${profile.goals}

Requirements:
- Each fact is ONE short sentence, max 15 words
- Sound like a surprising fun fact, never a boring textbook
- Weave in 1-2 relevant emojis naturally within the text
- Vary types: surprising facts, counterintuitive truths, quick tips, historical moments, "did you know" hooks
- Calibrate to ${profile.skillLevel} — neither too basic nor too advanced
- Never repeat similar content

Also pick ONE emoji that best represents this topic overall (e.g. ⚛️ for quantum physics, 🗾 for Japanese, etc.)

Return ONLY valid JSON in this exact format, no markdown, no explanation:
{"emoji":"⚛️","snippets":["Fact one here 🔬","Fact two here ⚡"]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 4096 },
    });

    const text = response.text ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Failed to parse snippets" });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      emoji?: string;
      snippets?: string[];
    };
    res.json({
      snippets: parsed.snippets ?? [],
      topicEmoji: parsed.emoji ?? "📚",
    });
  } catch (error) {
    req.log?.error({ error }, "Gemini snippets error");
    res.status(500).json({ error: "Failed to generate snippets" });
  }
});

geminiRouter.post("/gemini/topic-image", async (req, res) => {
  try {
    const { topic } = req.body as { topic: string };
    if (!topic) {
      res.status(400).json({ error: "topic required" });
      return;
    }

    const prompt = `Create a vivid, colorful illustration for a mobile learning app about "${topic}". The image should be: modern, minimal, visually striking, icon-like. Bold colors, no text, no letters, no words. Square composition. Think app icon meets editorial illustration.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["IMAGE"],
      } as Record<string, unknown>,
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (p: Record<string, unknown>) => p.inlineData != null,
    ) as { inlineData: { data: string; mimeType: string } } | undefined;

    if (!imagePart?.inlineData?.data) {
      res.status(404).json({ error: "No image generated" });
      return;
    }

    res.json({
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType ?? "image/png",
    });
  } catch (error) {
    req.log?.error({ error }, "Gemini image error");
    res.status(500).json({ error: "Failed to generate image" });
  }
});

export default geminiRouter;
