import readline from "node:readline";
import { hashPassword } from "../src/server/security/password";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (!process.stdin.isTTY) {
  console.error("Este script debe ser ejecutado en un entorno TTY interactivo para ocultar la contraseña.");
  process.exit(1);
}

// Function to safely ask for password without echoing to console
function askPassword(query: string): Promise<string> {
  return new Promise((resolve) => {
    let password = "";
    process.stdout.write(query);

    const onData = (char: Buffer) => {
      const charStr = char.toString('utf8');
      
      if (charStr === "\n" || charStr === "\r" || charStr === "\u0004") {
        process.stdin.removeListener("data", onData);
        process.stdin.setRawMode(false);
        process.stdout.write("\n");
        resolve(password);
        return;
      }

      if (charStr === "\u0003") { // Ctrl+C
        process.stdin.removeListener("data", onData);
        process.stdin.setRawMode(false);
        process.stdout.write("\n");
        process.exit(1);
      }
      
      // Handle backspace
      if (charStr === "\b" || charStr === "\x7f") {
        if (password.length > 0) {
          password = password.slice(0, -1);
        }
      } else {
        password += charStr;
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

async function main() {
  console.log("Generador de Hash Argon2id para Admin (Local)");
  console.log("-----------------------------------------------");
  
  const p1 = await askPassword("Introduce la contraseña: ");
  const p2 = await askPassword("Confirma la contraseña: ");

  if (p1 !== p2) {
    console.error("Las contraseñas no coinciden. Abortando.");
    process.exit(1);
  }

  try {
    const hashed = await hashPassword(p1);
    console.log("\n=== HASH GENERADO EXITOSAMENTE ===");
    console.log(hashed);
    console.log("====================================\n");
    console.log("Copia el hash de arriba y colócalo en BOOTSTRAP_ADMIN_PASSWORD_HASH de tu .env local.");
  } catch (error: any) {
    console.error("\nError al generar el hash:", error.message);
  } finally {
    rl.close();
  }
}

main().catch(() => process.exit(1));
