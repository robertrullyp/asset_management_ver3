import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
