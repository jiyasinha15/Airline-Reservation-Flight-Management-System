import readline from "node:readline";
import bcrypt from "bcryptjs";
import db from "./db.js";
import dotenv from "dotenv";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function createAdmin() {
  try {
    const name = await ask("Admin name: ");
    const email = (await ask("Admin email: ")).trim().toLowerCase();
    const phone = await ask("Admin phone: ");
    const password = await ask("Create admin password: ");

    if (!name.trim() || !email || !phone.trim() || password.length < 8) {
      throw new Error("Enter all details. Password must be at least 8 characters.");
    }

    const hash = await bcrypt.hash(password, 12);

    await db.execute(
      `INSERT INTO users
       (full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, 'ADMIN')`,
      [name.trim(), email, phone.trim(), hash]
    );

    console.log("Admin account created successfully!");
  } catch (error) {
    console.error("Admin creation failed:", error.message);
  } finally {
    rl.close();
    await db.end();
  }
}

createAdmin();