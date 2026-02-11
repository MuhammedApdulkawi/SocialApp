import cron from "node-cron";
import { BlacklistRepository } from "../../../DB/repository";
import { BlacklistedTokenModel } from "../../../DB/models";

const blackListRepo: BlacklistRepository = new BlacklistRepository(
  BlacklistedTokenModel,
);
export const cleanBlackListCron = () => {
  // Schedule the cron job to run every 12 hours
  cron.schedule("0 */12 * * *", async () => {
    try {
      const now = new Date();

      const result = await blackListRepo.deleteManyDocuments({
        expirationDate: { $lte: now },
      });

      if (result.deletedCount && result.deletedCount > 0) {
        console.log(
          `[CRON] Deleted ${result.deletedCount} expired blacklist tokens`,
        );
      }
    } catch (error) {
      console.error("[CRON] Blacklist cleanup failed:", error);
    }
  });
};
