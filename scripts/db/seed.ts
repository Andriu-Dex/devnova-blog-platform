import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { 
  roles, userStatuses, contactMessageStatuses, socialPlatforms, 
  auditActionTypes, siteSections 
} from "../../src/server/db/schema";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });
config({ path: ".env" });

const migrationUrl = process.env.DATABASE_MIGRATION_URL;
if (!migrationUrl) {
  console.error("Missing DATABASE_MIGRATION_URL");
  process.exit(1);
}

const conn = postgres(migrationUrl, { max: 1 });
const db = drizzle(conn);

async function seed() {
  console.log("Ejecutando seed estructural...");

  // 1. Roles
  await db.insert(roles).values([
    { code: "AUTHOR", name: "Autor" },
    { code: "ADMIN", name: "Administrador" },
  ]).onConflictDoUpdate({
    target: roles.code,
    set: { name: sql`EXCLUDED.name` },
  });
  console.log("roles: OK");

  // 2. User Statuses
  await db.insert(userStatuses).values([
    { code: "ACTIVE", name: "Activo" },
    { code: "BLOCKED", name: "Bloqueado" },
  ]).onConflictDoUpdate({
    target: userStatuses.code,
    set: { name: sql`EXCLUDED.name` },
  });
  console.log("user statuses: OK");

  // 3. Contact Message Statuses
  await db.insert(contactMessageStatuses).values([
    { code: "NEW", name: "Nuevo" },
    { code: "READ", name: "Leído" },
    { code: "ARCHIVED", name: "Archivado" },
  ]).onConflictDoUpdate({
    target: contactMessageStatuses.code,
    set: { name: sql`EXCLUDED.name` },
  });
  console.log("contact message statuses: OK");

  // 4. Social Platforms
  await db.insert(socialPlatforms).values([
    { code: "GITHUB", name: "GitHub" },
    { code: "LINKEDIN", name: "LinkedIn" },
    { code: "INSTAGRAM", name: "Instagram" },
    { code: "FACEBOOK", name: "Facebook" },
    { code: "YOUTUBE", name: "YouTube" },
  ]).onConflictDoUpdate({
    target: socialPlatforms.code,
    set: { name: sql`EXCLUDED.name` },
  });
  console.log("social platforms: OK");

  // 5. Audit Action Types
  await db.insert(auditActionTypes).values([
    { code: "LOGIN", name: "Inicio de sesión" },
    { code: "LOGIN_FAILED", name: "Inicio de sesión fallido" },
    { code: "CREATE", name: "Creación" },
    { code: "EDIT", name: "Edición" },
    { code: "PUBLISH", name: "Publicación" },
    { code: "UNPUBLISH", name: "Despublicación" },
    { code: "RESTORE", name: "Restauración" },
    { code: "BLOCK", name: "Bloqueo" },
    { code: "UNBLOCK", name: "Desbloqueo" },
    { code: "DELETE", name: "Eliminación" },
    { code: "RECOVER", name: "Recuperación" },
    { code: "PASSWORD_CHANGE", name: "Cambio de contraseña" },
    { code: "STATUS_CHANGE", name: "Cambio de estado" },
  ]).onConflictDoUpdate({
    target: auditActionTypes.code,
    set: { name: sql`EXCLUDED.name` },
  });
  console.log("audit action types: OK");

  // 6. Site Sections (Manual UPSERT due to lower() unique index)
  const sections = [
    { sectionKey: "HOME", displayName: "Inicio" },
    { sectionKey: "MISSION", displayName: "Misión" },
    { sectionKey: "VISION", displayName: "Visión" },
    { sectionKey: "ABOUT", displayName: "Nosotros" },
    { sectionKey: "CONTACT", displayName: "Contacto" },
  ];

  for (const section of sections) {
    const existing = await db.select().from(siteSections).where(sql`lower(${siteSections.sectionKey}) = lower(${section.sectionKey})`);
    if (existing.length > 0) {
      await db.update(siteSections).set({ displayName: section.displayName }).where(sql`lower(${siteSections.sectionKey}) = lower(${section.sectionKey})`);
    } else {
      await db.insert(siteSections).values(section);
    }
  }
  console.log("site sections: OK");
}

seed()
  .then(() => {
    console.log("Seed ejecutado exitosamente.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error durante el seed:", err);
    process.exit(1);
  });
