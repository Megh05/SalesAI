
import { storage } from "./storage";
import { db } from "./db";
import { userSettings } from "@shared/schema";
import { eq, isNotNull } from "drizzle-orm";

async function migrateSettings() {
  console.log("Migrating settings...");
  
  // Get all settings with the old field
  const allSettings = await db.select().from(userSettings).where(isNotNull(userSettings.userId));
  
  for (const setting of allSettings) {
    const oldData = setting as any;
    if (oldData.openrouterApiKey && !oldData.openRouterApiKey) {
      await db.update(userSettings)
        .set({ openRouterApiKey: oldData.openrouterApiKey })
        .where(eq(userSettings.userId, setting.userId));
      console.log(`Migrated API key for user ${setting.userId}`);
    }
  }
  
  console.log("Migration complete");
  process.exit(0);
}

migrateSettings().catch(console.error);
