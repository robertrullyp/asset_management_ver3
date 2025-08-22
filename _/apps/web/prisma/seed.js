import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing records to allow reseeding without unique constraint errors
  await prisma.$transaction([
    prisma.user.deleteMany(),
    prisma.unitConsumable.deleteMany(),
    prisma.serviceLog.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.companyContact.deleteMany(),
    prisma.consumableItem.deleteMany(),
    prisma.company.deleteMany(),
  ]);

  // Seed test user accounts
  const testAccounts = [
    { name: 'Admin User', email: 'admin@test.com', role: 'admin' },
    { name: 'Supervisor User', email: 'supervisor@test.com', role: 'supervisor' },
    { name: 'Teknisi User', email: 'teknisi@test.com', role: 'teknisi' },
    { name: 'Sales User', email: 'sales@test.com', role: 'sales' },
  ];

  await prisma.user.createMany({
    data: testAccounts.map((account) => ({
      ...account,
      isActive: true,
      phoneVerified: true,
    })),
    skipDuplicates: true,
  });

  for (const account of testAccounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        role: account.role,
        isActive: true,
        phoneVerified: true,
      },
      create: {
        name: account.name,
        email: account.email,
        role: account.role,
        isActive: true,
        phoneVerified: true,
      },
    });
  }

  const acme = await prisma.company.create({
    data: {
      name: 'Acme Corp',
      address: '123 Industrial Way',
      phone: '555-1234',
      contacts: {
        create: {
          name: 'John Doe',
          email: 'john@acme.com',
          phone: '555-1000',
          isPrimary: true,
        },
      },
      units: {
        create: {
          unitName: 'Generator A',
          model: 'GenX',
          serialNumber: 'A123',
          accessToken: 'token-a',
          serviceLogs: {
            create: [
              { hourMeter: 100, notes: 'Initial log' },
              { hourMeter: 200, notes: 'Second log' },
            ],
          },
        },
      },
    },
  });

  const beta = await prisma.company.create({
    data: {
      name: 'Beta Industries',
      contacts: {
        create: [
          {
            name: 'Jane Smith',
            email: 'jane@beta.com',
            phone: '555-2000',
            isPrimary: true,
          },
          {
            name: 'Bob Brown',
            email: 'bob@beta.com',
            phone: '555-2001',
          },
        ],
      },
      units: {
        create: {
          unitName: 'Pump B',
          model: 'PumpMaster',
          serialNumber: 'B456',
          accessToken: 'token-b',
          serviceLogs: {
            create: { hourMeter: 50, notes: 'Setup' },
          },
        },
      },
    },
  });

  console.log('Seeded companies:', acme.name, 'and', beta.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
