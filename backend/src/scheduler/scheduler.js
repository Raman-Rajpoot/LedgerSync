import cron from "node-cron";
import { processReminders } from "../services/processReminder.service.js";

let isRunning = false;

export async function runReminderJob() {
    if (isRunning) {
        console.log("Previous reminder job is still running.");
        return;
    }

    isRunning = true;

    try {
        console.log("Checking reminders:", new Date().toISOString());
        await processReminders();
    } catch (error) {
        console.error("Reminder job failed:", error);
    } finally {
        isRunning = false;
    }
}

export function startReminderScheduler() {
    cron.schedule("0 9 * * *", runReminderJob, {
        timezone: "Asia/Kolkata",
    });



    cron.schedule("0 12 * * *", runReminderJob, {
        timezone: "Asia/Kolkata",
    });

    cron.schedule("0 17 * * *", runReminderJob, {
        timezone: "Asia/Kolkata",
    });

}