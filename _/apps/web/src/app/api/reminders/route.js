import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";
import { z } from "zod";
import { scheduleReminder } from "@/jobs/reminderQueue";

// List reminders or create new reminder
export async function GET(request) {
  const session = await requireRole(["sales", "admin"]);
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const upcoming = url.searchParams.get("upcoming");

  let query = "SELECT id, title, description, remind_at FROM reminders";
  if (upcoming) {
    query += " WHERE remind_at >= NOW() ORDER BY remind_at ASC";
  } else {
    query += " ORDER BY remind_at DESC";
  }

  const reminders = await sql(query);
  return Response.json({ reminders });
}

export async function POST(request) {
  const session = await requireRole(["sales", "admin"]);
  if (session instanceof Response) return session;

  const bodySchema = z.object({
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    remind_at: z.string(),
  });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const result = await sql(
    `INSERT INTO reminders (title, description, remind_at)
     VALUES ($1,$2,$3)
     RETURNING id, title, description, remind_at`,
    [data.title, data.description || null, data.remind_at]
  );

  const reminder = result[0];
  await scheduleReminder(reminder);

  return Response.json({ reminder }, { status: 201 });
}
