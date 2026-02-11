import cron from "node-cron";
import { FriendshipRepository } from "../../../DB/repository";

const friendshipRepo: FriendshipRepository = new FriendshipRepository();
export const cleanFriendShipCron = () => {
  // Schedule the cron job to run at midnight every day
  cron.schedule("0 0 * * *", async () => {
    try {
      const now = new Date();

      const result = await friendshipRepo.deleteManyDocuments({
        status: "rejected",
        updatedAt: { $lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
      });

      if (result.deletedCount && result.deletedCount > 0) {
        console.log(
          `[CRON] Deleted ${result.deletedCount} expired rejected friendships`,
        );
      }
    } catch (error) {
      console.error("[CRON] Friendship cleanup failed:", error);
    }
  });
};
