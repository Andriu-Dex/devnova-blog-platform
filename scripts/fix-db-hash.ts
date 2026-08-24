import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";
import { userCredentials } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

const queryClient = postgres(process.env.DATABASE_URL as string);
const db = drizzle(queryClient);

async function run() {
  const hash = process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH;
  if (!hash) {
    console.error("No hash found in .env");
    process.exit(1);
  }
  console.log("Updating password hash to:", hash);
  await db.update(userCredentials)
    .set({ passwordHash: hash })
    .where(eq(userCredentials.userId, "6b37ee5c-b77c-4cd2-810c-09c107f87646"));
  console.log("Done!");
  process.exit(0);
}

run();
