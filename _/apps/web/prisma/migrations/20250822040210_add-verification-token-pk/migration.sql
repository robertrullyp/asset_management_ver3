-- DropIndex
DROP INDEX "public"."auth_verification_token_identifier_token_key";

-- AlterTable
ALTER TABLE "public"."auth_verification_token" ADD COLUMN "id" SERIAL NOT NULL,
ADD CONSTRAINT "auth_verification_token_pkey" PRIMARY KEY ("id");
