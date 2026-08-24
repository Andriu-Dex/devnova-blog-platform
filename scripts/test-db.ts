import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";
import { users, userCredentials } from "../src/server/db/schema";

const queryClient = postgres(process.env.DATABASE_URL as string);
const db = drizzle(queryClient);

async function run() {
  console.log("Querying users...");
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers);

  const creds = await db.select().from(userCredentials);
  console.log("Creds:", creds);
  
  process.exit(0);
}

run();
