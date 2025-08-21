-- CreateTable
CREATE TABLE "public"."auth_users" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_accounts" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "password" TEXT,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_sessions" (
    "id" UUID NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_email_key" ON "public"."auth_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_provider_providerAccountId_key" ON "public"."auth_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_sessionToken_key" ON "public"."auth_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_token_token_key" ON "public"."auth_verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_token_identifier_token_key" ON "public"."auth_verification_token"("identifier", "token");

-- AddForeignKey
ALTER TABLE "public"."auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

