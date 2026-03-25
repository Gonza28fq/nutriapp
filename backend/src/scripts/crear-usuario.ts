import dotenv from "dotenv";
dotenv.config();

import { testConnection } from "../config/database";
import { AuthService } from "../services/auth.service";

async function main() {
  await testConnection();

  // Cambia estos valores antes de correr el script
  const nombre   = "Melina";
  const email    = "melina@tudominio.com";
  const password = "CambiarEsto123!";

  try {
    const id = await AuthService.crearUsuarioInicial(nombre, email, password);
    console.log(`✅ Usuario creado correctamente con ID: ${id}`);
    console.log(`   Email: ${email}`);
    console.log(`   Contrasena: ${password}`);
    console.log(`\n⚠️  Acordate de cambiar la contrasena despues del primer login.`);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      console.log("⚠️  Ya existe un usuario con ese email.");
    } else {
      console.error("❌ Error:", error);
    }
  }

  process.exit(0);
}

main();