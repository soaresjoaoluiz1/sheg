import { processStaleReminders } from "@/lib/reminders";
import { dispatchPending } from "@/lib/whatsapp";
import { db } from "@/lib/db";

const INTERVAL_MS = 60_000;

async function tick() {
  try {
    const reminders = await processStaleReminders();
    const dispatch = await dispatchPending(50);
    if (reminders.enqueued > 0 || dispatch.processed > 0) {
      console.log(
        `[reminders] reminders=${reminders.enqueued}/${reminders.scanned} dispatched=${dispatch.ok}/${dispatch.processed} (failed ${dispatch.failed})`,
      );
    }
  } catch (err) {
    console.error("[reminders] tick error:", err);
  }
}

console.log("[reminders] worker started, tick every", INTERVAL_MS, "ms");
void tick();
const handle = setInterval(tick, INTERVAL_MS);

async function shutdown(signal: string) {
  console.log(`[reminders] received ${signal}, shutting down`);
  clearInterval(handle);
  await db.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
