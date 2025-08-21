# asset_management_ver3

## Database Setup

This project uses [Prisma](https://www.prisma.io/) for managing PostgreSQL migrations and seeding.

### Migrations

```
bun run prisma:migrate
```

### Seeding

```
bun run prisma:seed
```

The seed script populates sample companies, contacts, units and service logs.
