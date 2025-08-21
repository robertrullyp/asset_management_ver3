-- DropForeignKey
ALTER TABLE "public"."auth_accounts" DROP CONSTRAINT "auth_accounts_userId_fkey";
ALTER TABLE "public"."auth_sessions" DROP CONSTRAINT "auth_sessions_userId_fkey";

-- AlterTable
ALTER TABLE "public"."auth_accounts" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "public"."auth_sessions" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

-- AddForeignKey
ALTER TABLE "public"."auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
