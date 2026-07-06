require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ACCOUNTS = [
  { role: 'ADMIN',    emailEnv: 'ADMIN_EMAIL',    passwordEnv: 'ADMIN_PASSWORD',    email: 'admin@pfe.local',    password: 'Admin1234!' },
  { role: 'OPERATOR', emailEnv: 'OPERATOR_EMAIL', passwordEnv: 'OPERATOR_PASSWORD', email: 'operator@pfe.local', password: 'Operator1234!' },
  { role: 'VIEWER',   emailEnv: 'VIEWER_EMAIL',   passwordEnv: 'VIEWER_PASSWORD',   email: 'viewer@pfe.local',   password: 'Viewer1234!' },
];

async function main() {
  for (const { role, emailEnv, passwordEnv, email: defaultEmail, password: defaultPassword } of ACCOUNTS) {
    const email    = process.env[emailEnv]    || defaultEmail;
    const password = process.env[passwordEnv] || defaultPassword;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`[seed] ${role} already exists: ${email}`);
      continue;
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email, password: hashed, role } });
    console.log(`[seed] ${role} created → email: ${email}  password: ${password}`);
  }
}

main()
  .catch((err) => { console.error('[seed] Error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
