import { Worker } from "bullmq";
import Redis from "ioredis";
import sql from "../app/api/utils/sql.js";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const reminderWorker = new Worker(
  "reminders",
  async (job) => {
    if (job.name === "send-reminder") {
      const { reminderId } = job.data;
      const result = await sql`SELECT id, title, remind_at FROM reminders WHERE id = ${reminderId}`;
      if (result.length) {
        const reminder = result[0];
        console.log(`Reminder due: ${reminder.title} at ${reminder.remind_at}`);
      }
    }
    if (job.name === "process-reminders") {
      const reminders = await sql`SELECT id, title, remind_at FROM reminders WHERE remind_at <= NOW()`;
      reminders.forEach((r) =>
        console.log(`Processing reminder: ${r.title} - ${r.remind_at}`),
      );
    }
  },
  { connection }
);

reminderWorker.on("failed", (job, err) => {
  console.error(`Reminder job ${job.id} failed`, err);
});
