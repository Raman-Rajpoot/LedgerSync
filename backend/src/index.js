import express from "express"
import clientRouter from './routes/client.route.js';
import authRouter from './routes/auth.route.js';
import orgRouter from './routes/organization.route.js';
import invoiceRouter from './routes/invoice.route.js';
import templateRouter from './routes/template.route.js';
import escalationRouter from './routes/escalationRule.route.js';
import cors from 'cors';
import { startReminderScheduler } from "./scheduler/scheduler.js";
import dotenv from 'dotenv';
import { authenticateTenant } from './middleware/auth.middleware.js';
import dashboardRoutes from "./routes/dashboard.route.js";
import reportRoutes from "./routes/report.route.js";
import settingsRoutes from "./routes/settings.route.js";
import integrationRoutes from "./routes/integration.route.js";
import activityRoutes from "./routes/activity.route.js";
import profileRoutes from "./routes/profile.route.js";
import paymentRoutes from "./routes/payment.route.js";

import reminderRoutes from "./routes/reminder.route.js";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: '*' }));
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LedgerSync Backend is running!' });
});
app.use(
  "/v1/api/settings",
  settingsRoutes
);
app.use(
  "/v1/api/profile",
  profileRoutes
);
app.use(
  "/v1/api/integration",
  integrationRoutes
);
app.use("/v1/api/auth", authRouter);
app.use("/v1/api/client", authenticateTenant, clientRouter);
app.use("/v1/api/organization", authenticateTenant, orgRouter);
app.use("/v1/api/invoice", authenticateTenant, invoiceRouter);
app.use("/v1/api/template", authenticateTenant, templateRouter);
app.use("/v1/api/escalation", authenticateTenant, escalationRouter);
app.use("/v1/api/dashboard",dashboardRoutes);
app.use(
  "/v1/api/report",
  authenticateTenant,
  reportRoutes
);
app.use(
  "/v1/api/activity",
  activityRoutes
);

app.use(
  "/v1/api/reminders",
  reminderRoutes
);


app.use(
  "/v1/api/payment",

  paymentRoutes
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  startReminderScheduler();
});



export default app;