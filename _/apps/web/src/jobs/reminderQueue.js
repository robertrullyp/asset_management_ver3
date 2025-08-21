import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const reminderQueue = new Queue("reminders", { connection });

export async function scheduleReminder(reminder) {
  const delay = new Date(reminder.remind_at).getTime() - Date.now();
  await reminderQueue.add(
    "send-reminder",
    { reminderId: reminder.id },
    { delay: Math.max(delay, 0) }
  );
}

async function scheduleDailyProcessing() {
  await reminderQueue.add(
    "process-reminders",
    {},
    { repeat: { cron: "0 0 * * *" }, jobId: "process-reminders" }
  );
}

scheduleDailyProcessing().catch((err) => {
  console.error("Failed to schedule daily reminder processing", err);
});
