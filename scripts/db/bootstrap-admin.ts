import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { 
  roles, userStatuses, users, userCredentials, auditEvents, auditUserEvents, auditActionTypes 
} from "../../src/server/db/schema";
import { sql, eq } from "drizzle-orm";

config({ path: ".env.local" });
config({ path: ".env" });

const migrationUrl = process.env.DATABASE_MIGRATION_URL;
const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim();
const displayName = process.env.BOOTSTRAP_ADMIN_DISPLAY_NAME?.trim();
const passwordHash = process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH;

if (!migrationUrl) {
  console.error("Missing DATABASE_MIGRATION_URL");
  process.exit(1);
}
if (!username || username.length === 0 || username.length > 80) {
  console.error("Invalid BOOTSTRAP_ADMIN_USERNAME (must be 1-80 chars)");
  process.exit(1);
}
if (!displayName || displayName.length === 0 || displayName.length > 120) {
  console.error("Invalid BOOTSTRAP_ADMIN_DISPLAY_NAME (must be 1-120 chars)");
  process.exit(1);
}
if (!passwordHash || !passwordHash.startsWith("$argon2id$")) {
  console.error("Invalid BOOTSTRAP_ADMIN_PASSWORD_HASH (must be a valid Argon2id hash)");
  process.exit(1);
}

const conn = postgres(migrationUrl, { max: 1 });
const db = drizzle(conn);

async function bootstrap() {
  console.log("Iniciando bootstrap del primer ADMIN...");

  await db.transaction(async (tx) => {
    // 1. Obtener catálogos
    const adminRole = await tx.select().from(roles).where(eq(roles.code, "ADMIN")).limit(1);
    const activeStatus = await tx.select().from(userStatuses).where(eq(userStatuses.code, "ACTIVE")).limit(1);
    const createAction = await tx.select().from(auditActionTypes).where(eq(auditActionTypes.code, "CREATE")).limit(1);

    if (adminRole.length === 0 || activeStatus.length === 0 || createAction.length === 0) {
      throw new Error("Faltan catálogos estructurales. Ejecuta npm run db:seed primero.");
    }

    // 2. Buscar si ya existe el admin u otro admin
    // Utilizando ilike para busqueda case-insensitive, o sql`lower(username) = lower(${username})`
    const existingUsersWithUsername = await tx.select()
      .from(users)
      .where(sql`lower(${users.username}) = lower(${username})`);

    if (existingUsersWithUsername.length > 0) {
      const u = existingUsersWithUsername[0];
      if (u.roleId !== adminRole[0].id) {
        throw new Error("El username ya existe pero NO es ADMIN. Abortando.");
      }
      // Check if credentials exist for this admin
      const creds = await tx.select().from(userCredentials).where(eq(userCredentials.userId, u.id));
      if (creds.length > 0) {
        console.log("Bootstrap ya realizado (Admin y credenciales existen). Saliendo idempotentemente.");
        return;
      } else {
        throw new Error("Estado parcial inconsistente: ADMIN existe sin credenciales.");
      }
    }

    // Buscar si ya existe cualquier otro admin (evitar segundo bootstrap)
    const existingAdmins = await tx.select().from(users).where(eq(users.roleId, adminRole[0].id));
    if (existingAdmins.length > 0) {
      throw new Error("Ya existe un administrador en el sistema. El bootstrap es solo para el primer administrador.");
    }

    // 3. Crear el primer ADMIN
    console.log("Creando usuario ADMIN...");
    const [newUser] = await tx.insert(users).values({
      username: username as string,
      displayName: displayName as string,
      roleId: adminRole[0].id,
      statusId: activeStatus[0].id,
    }).returning();

    // 4. Crear credenciales
    console.log("Insertando credenciales...");
    await tx.insert(userCredentials).values({
      userId: newUser.id,
      passwordHash: passwordHash as string,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    });

    // 5. Auditoría
    console.log("Registrando auditoría inicial...");
    const [auditEvent] = await tx.insert(auditEvents).values({
      actionTypeId: createAction[0].id,
    }).returning();

    await tx.insert(auditUserEvents).values({
      auditEventId: auditEvent.id,
      targetUserId: newUser.id,
      previousStatusId: null,
      newStatusId: activeStatus[0].id,
    });

    console.log("Bootstrap completado exitosamente dentro de transacción atómica.");
  });
}

bootstrap()
  .then(() => {
    console.log("Proceso finalizado.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error durante el bootstrap:", err.message);
    process.exit(1);
  });
