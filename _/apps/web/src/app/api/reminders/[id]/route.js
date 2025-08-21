import sql from "@/app/api/utils/sql";
import { requireRole } from "@/app/api/utils/auth-middleware";
import { z } from "zod";
import { scheduleReminder, reminderQueue } from "@/jobs/reminderQueue";

export async function GET(request, { params }) {
  const session = await requireRole(["sales", "admin"]);
  if (session instanceof Response) return session;
  const { id } = params;
  const result = await sql(`SELECT id, title, description, remind_at FROM reminders WHERE id = $1`, [id]);
  if (result.length === 0) {
    return Response.json({ error: "Reminder not found" }, { status: 404 });
  }
  return Response.json({ reminder: result[0] });
}

export async function PUT(request, { params }) {
  const session = await requireRole(["sales", "admin"]);
  if (session instanceof Response) return session;
  const { id } = params;

  const bodySchema = z.object({
    title: z.string().optional(),
    description: z.string().optional().nullable(),
    remind_at: z.string().optional(),
  });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const fields = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = $${idx++}`);
    values.push(value);
  }
  values.push(id);

  const result = await sql(
    `UPDATE reminders SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, title, description, remind_at`,
    values
  );

  if (result.length === 0) {
    return Response.json({ error: "Reminder not found" }, { status: 404 });
  }
  const reminder = result[0];
  if (data.remind_at) {
    if (reminderQueue) {
      await scheduleReminder(reminder);
    } else {
      console.warn("Reminder queue not initialized; skipping scheduling");
    }
  }
  return Response.json({ reminder });
}

export async function DELETE(request, { params }) {
  const session = await requireRole(["sales", "admin"]);
  if (session instanceof Response) return session;
  const { id } = params;
  const result = await sql(`DELETE FROM reminders WHERE id = $1 RETURNING id`, [id]);
  if (result.length === 0) {
    return Response.json({ error: "Reminder not found" }, { status: 404 });
  }
  return Response.json({ message: "Reminder deleted" });
}
