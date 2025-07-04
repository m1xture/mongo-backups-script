import "dotenv/config";
import backupsManager from "./backupsManager.js";
import { CronJob } from "cron";

new CronJob(
  "20 * * * * *",
  () => {
    backupsManager.backup();
  },
  null,
  true,
);
