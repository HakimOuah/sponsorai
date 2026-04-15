import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.upsert({
    where: { email: "agent@sponsorai.com" },
    update: {},
    create: {
      email: "agent@sponsorai.com",
      name: "Agent SponsorAI",
      password: hashedPassword,
    },
  });

  console.log("Seed completed. User created:", user.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
