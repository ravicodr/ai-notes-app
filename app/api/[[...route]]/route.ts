import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import prisma from "@/lib/prisma";
import geminiModel from "@/lib/openai";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

type Variables = {
  userId: string;
};

const app = new Hono<{ Variables: Variables }>().basePath("/api");

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const authMiddleware = async (c: any, next: any) => {
  const token = await getToken({
    req: c.req.raw,
    secret: process.env.NEXTAUTH_SECRET || "",
  });

  if (!token || !token.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", token.id as string);
  await next();
};

// ─── Register ─────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

app.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0].message }, 400);
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return c.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      201
    );
  } catch {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── Apply Auth to Notes Routes ───────────────────────────────────────────────
app.use("/notes", authMiddleware);
app.use("/notes/*", authMiddleware);

// ─── GET /api/notes ───────────────────────────────────────────────────────────
app.get("/notes", async (c) => {
  try {
    const userId = c.get("userId");
    const q = c.req.query("q");

    const notes = await prisma.note.findMany({
      where: {
        userId,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return c.json({ notes });
  } catch {
    return c.json({ error: "Failed to fetch notes" }, 500);
  }
});

// ─── POST /api/notes ──────────────────────────────────────────────────────────
app.post("/notes", async (c) => {
  try {
    const userId = c.get("userId");
    const { title, content } = await c.req.json();

    if (!title || !content) {
      return c.json({ error: "Title and content are required" }, 400);
    }

    const note = await prisma.note.create({
      data: { title, content, userId },
    });

    return c.json({ note }, 201);
  } catch {
    return c.json({ error: "Failed to create note" }, 500);
  }
});

// ─── GET /api/notes/:id ───────────────────────────────────────────────────────
app.get("/notes/:id", async (c) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) return c.json({ error: "Note not found" }, 404);

    return c.json({ note });
  } catch {
    return c.json({ error: "Failed to fetch note" }, 500);
  }
});

// ─── PUT /api/notes/:id ───────────────────────────────────────────────────────
app.put("/notes/:id", async (c) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = await c.req.json();

    const existing = await prisma.note.findFirst({ where: { id, userId } });
    if (!existing) return c.json({ error: "Note not found" }, 404);

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.summary !== undefined && { summary: body.summary }),
        ...(body.tags !== undefined && { tags: body.tags }),
      },
    });

    return c.json({ note });
  } catch {
    return c.json({ error: "Failed to update note" }, 500);
  }
});

// ─── DELETE /api/notes/:id ────────────────────────────────────────────────────
app.delete("/notes/:id", async (c) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const existing = await prisma.note.findFirst({ where: { id, userId } });
    if (!existing) return c.json({ error: "Note not found" }, 404);

    await prisma.note.delete({ where: { id } });
    return c.json({ success: true });
  } catch {
    return c.json({ error: "Failed to delete note" }, 500);
  }
});

// ─── POST /api/notes/:id/ai/summary ──────────────────────────────────────────
app.post("/notes/:id/ai/summary", async (c) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) return c.json({ error: "Note not found" }, 404);

    if (note.content.trim().length < 50) {
      return c.json(
        { error: "Note content is too short to summarize (min 50 chars)" },
        400
      );
    }

    const result = await geminiModel.generateContent(
      `You are a helpful assistant that creates concise summaries. Summarize the given note in 2-3 clear sentences, capturing the key points.\n\nTitle: ${note.title}\n\nContent: ${note.content}`
    );

    const summary = result.response.text().trim();
    await prisma.note.update({ where: { id }, data: { summary } });

    return c.json({ summary });
  } catch (err: any) {
    if (err?.status === 429) {
      return c.json({ error: "AI rate limit reached. Try again later." }, 429);
    }
    return c.json({ error: "AI summary generation failed" }, 500);
  }
});

// ─── POST /api/notes/:id/ai/improve ──────────────────────────────────────────
app.post("/notes/:id/ai/improve", async (c) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) return c.json({ error: "Note not found" }, 404);

    const result = await geminiModel.generateContent(
      `You are a professional writing assistant. Improve the grammar, clarity, and structure of the given text while preserving its original meaning, tone, and intent. Return only the improved text without any explanation.\n\n${note.content}`
    );

    const improvedContent = result.response.text().trim() || note.content;
    await prisma.note.update({
      where: { id },
      data: { content: improvedContent },
    });

    return c.json({ content: improvedContent });
  } catch (err: any) {
    if (err?.status === 429) {
      return c.json({ error: "AI rate limit reached. Try again later." }, 429);
    }
    return c.json({ error: "AI improvement failed" }, 500);
  }
});

// ─── POST /api/notes/:id/ai/tags ──────────────────────────────────────────────
app.post("/notes/:id/ai/tags", async (c) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) return c.json({ error: "Note not found" }, 404);

    const result = await geminiModel.generateContent(
      `Generate 3-5 relevant, concise tags for the given note. Return ONLY a JSON array of lowercase strings, example: ["productivity", "meeting", "goals"]. No explanation, just the JSON array.\n\nTitle: ${note.title}\n\nContent: ${note.content}`
    );

    const rawContent = result.response.text().trim();
    let tags: string[] = [];

    try {
      const match = rawContent.match(/\[[\s\S]*?\]/);
      tags = match ? JSON.parse(match[0]) : [];
    } catch {
      tags = rawContent
        .replace(/[\[\]"]/g, "")
        .split(",")
        .map((t: string) => t.trim().toLowerCase())
        .filter((t: string) => t.length > 0);
    }

    tags = tags.slice(0, 5);
    await prisma.note.update({ where: { id }, data: { tags } });

    return c.json({ tags });
  } catch (err: any) {
    if (err?.status === 429) {
      return c.json({ error: "AI rate limit reached. Try again later." }, 429);
    }
    return c.json({ error: "AI tag generation failed" }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
