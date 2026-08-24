import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" }); // Cargamos variables de entorno si existen
config({ path: ".env" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL || "",
  },
});
