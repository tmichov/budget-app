import { config } from 'dotenv';
import postgres from 'postgres';
import bcrypt from 'bcrypt';

config({ path: '.env' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    // Check if demo user already exists
    const existingUser = await sql`
      SELECT * FROM "User" WHERE email = 'demo@example.com'
    `;

    if (existingUser.length > 0) {
      console.log('Demo user already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Create demo user
    const result = await sql`
      INSERT INTO "User" (id, email, name, password, "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, 'demo@example.com', 'Demo User', ${hashedPassword}, NOW(), NOW())
      RETURNING id, email, name
    `;

    console.log('Demo user created:', result[0]);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
