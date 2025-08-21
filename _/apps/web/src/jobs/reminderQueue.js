import { Queue } from "bullmq";
import Redis from "ioredis";

export let reminderQueue;

async function initQueue() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn(
      "REDIS_URL not set; skipping reminder queue initialization",
    );
    return;
  }

  try {
    const connection = new Redis(url);
    await connection.ping();
    reminderQueue = new Queue("reminders", { connection });
  } catch (err) {
    console.warn(
      "Failed to connect to Redis, skipping reminder queue initialization",
      err,
    );
  }
}

await initQueue();

export async function scheduleReminder(reminder) {
  if (!reminderQueue) {
    console.warn("Reminder queue not initialized; skipping scheduling");
    return;
  }
  const delay = new Date(reminder.remind_at).getTime() - Date.now();
  await reminderQueue.add(
    "send-reminder",
    { reminderId: reminder.id },
    { delay: Math.max(delay, 0) },
  );
}

async function scheduleDailyProcessing() {
  if (!reminderQueue) return;
  await reminderQueue.add(
    "process-reminders",
    {},
    { repeat: { cron: "0 0 * * *" }, jobId: "process-reminders" },
  );
}

if (reminderQueue) {
  scheduleDailyProcessing().catch((err) => {
    console.error("Failed to schedule daily reminder processing", err);
  });
}
