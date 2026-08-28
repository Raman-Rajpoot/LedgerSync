import cron from "node-cron";
import { processReminders } from "../services/processReminder.service.js";

export const startReminderScheduler = () => {

    cron.schedule("0 * * * *", async () => {

        console.log("Checking reminders...");

        await processReminders();

    });

};