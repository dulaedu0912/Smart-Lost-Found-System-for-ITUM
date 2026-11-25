import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  ["student-id-card", "Student ID card"],
  ["scientific-calculator", "Scientific calculator"],
  ["water-bottle", "Water bottle"],
  ["earphones", "Earphones"],
  ["umbrella", "Umbrella"],
  ["usb-drive", "USB drive"],
  ["spectacles", "Spectacles"],
];

const zones = [
  ["division-it", "Division of IT", null],
  ["main-library", "Main Library", null],
  ["lecture-hall-complex", "Lecture Hall Complex", null],
  ["laboratories", "Laboratories", null],
  ["canteen", "Canteen", null],
  ["sports-complex", "Sports Complex", null],
];

try {
  for (const [id, name] of categories) {
    const existing = await prisma.categories.findUnique({ where: { name } });
    if (existing) continue;
    await prisma.categories.create({ data: { id, name } });
  }
  for (const [id, name, parentId] of zones) {
    const existing = await prisma.zones.findUnique({ where: { name } });
    if (existing) continue;
    await prisma.zones.create({ data: { id, name, parentId } });
  }
  console.log(`Seeded ${categories.length} categories and ${zones.length} campus zones.`);
} finally {
  await prisma.$disconnect();
}
