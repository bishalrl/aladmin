import { PrismaClient, AdminRole, ProjectStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  EXTRA_YANTRAS,
  HOME_YANTRAS,
  cycleIndexForDay,
  durationMinutesForDay,
} from "../src/services/YantramedCourseService";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const name = process.env.SEED_ADMIN_NAME ?? "Super Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email,
      name,
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  await prisma.project.upsert({
    where: { slug: "budgeting-sathi" },
    update: {
      name: "Budgeting Sathi",
      status: ProjectStatus.ACTIVE,
      firebaseProjectId: process.env.BUDGETING_SATHI_FIREBASE_PROJECT_ID || null,
      deletedAt: null,
    },
    create: {
      name: "Budgeting Sathi",
      slug: "budgeting-sathi",
      type: "mobile",
      status: ProjectStatus.ACTIVE,
      firebaseProjectId: process.env.BUDGETING_SATHI_FIREBASE_PROJECT_ID || null,
    },
  });

  const yantramed = await prisma.project.upsert({
    where: { slug: "yantramed" },
    update: {
      name: "YantraMed",
      status: ProjectStatus.ACTIVE,
      firebaseProjectId: process.env.YANTRAMED_FIREBASE_PROJECT_ID || null,
      deletedAt: null,
    },
    create: {
      name: "YantraMed",
      slug: "yantramed",
      type: "mobile",
      status: ProjectStatus.ACTIVE,
      firebaseProjectId: process.env.YANTRAMED_FIREBASE_PROJECT_ID || null,
    },
  });

  const allYantras = [...HOME_YANTRAS, ...EXTRA_YANTRAS];
  const yantraByCycle = new Map<number, string>();

  for (const y of allYantras) {
    const row = await prisma.yantramedYantra.upsert({
      where: {
        projectId_slug: { projectId: yantramed.id, slug: y.slug },
      },
      update: {
        name: y.name,
        focus: y.focus,
        sourceText: y.sourceText,
        cycleIndex: y.cycleIndex,
        showOnHome: y.showOnHome,
        inCourse: y.inCourse,
        sortOrder: y.sortOrder,
        isActive: true,
        deletedAt: null,
      },
      create: {
        projectId: yantramed.id,
        name: y.name,
        slug: y.slug,
        focus: y.focus,
        sourceText: y.sourceText,
        cycleIndex: y.cycleIndex,
        showOnHome: y.showOnHome,
        inCourse: y.inCourse,
        sortOrder: y.sortOrder,
      },
    });
    if (y.cycleIndex != null) {
      yantraByCycle.set(y.cycleIndex, row.id);
    }
  }

  for (let day = 1; day <= 30; day++) {
    const cycle = cycleIndexForDay(day);
    const yantraId = yantraByCycle.get(cycle);
    if (!yantraId) {
      throw new Error(`Missing yantra for cycle index ${cycle}`);
    }
    const yantra = allYantras.find((y) => y.cycleIndex === cycle)!;
    const durationMinutes = durationMinutesForDay(day);
    const mantraHint = `${yantra.name} — ${yantra.focus}`;

    await prisma.yantramedCourseDay.upsert({
      where: {
        projectId_dayNumber: { projectId: yantramed.id, dayNumber: day },
      },
      update: {
        yantraId,
        durationMinutes,
        focus: yantra.focus,
        mantraHint,
        allowEarlyComplete: false,
        isActive: true,
        deletedAt: null,
      },
      create: {
        projectId: yantramed.id,
        dayNumber: day,
        yantraId,
        durationMinutes,
        focus: yantra.focus,
        mantraHint,
        allowEarlyComplete: false,
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Super admin: ${email}`);
  console.log("YantraMed: 6 home yantras + Lakshmi/Custom + 30 course days");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
