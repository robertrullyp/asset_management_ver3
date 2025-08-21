# Runbook

## Backup Procedures
- Use `pg_dump $DATABASE_URL > backups/$(date +%F).sql` to back up the PostgreSQL database.
- For Redis, run `redis-cli --rdb` or enable snapshotting to capture the current dataset.
- Store backups in off-site storage such as S3 with appropriate retention policies.

## Restore Procedures
- Restore PostgreSQL with `psql $DATABASE_URL < path/to/backup.sql`.
- Restore Redis by loading the RDB snapshot or piping commands with `redis-cli --pipe < dump.rdb`.
- After restoration, run smoke tests and verify application functionality.

## Scaling Procedures
- **Web app:** Build production assets with `bun run build` and deploy multiple instances behind a load balancer. Scale background workers by running additional `bun run reminder-worker` processes.
- **Mobile app:** Produce release builds using Expo or EAS and ensure API URLs point to the load-balanced backend.
- **Database:** Increase PostgreSQL instance size or enable read replicas as load grows. Monitor Redis memory usage and adjust resources accordingly.
