/*
  Warnings:

  - You are about to drop the column `failedLoginAttempts` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isEmailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lockUntil` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `refreshTokens` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tokenVersion` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `otps` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "otps" DROP CONSTRAINT "otps_userId_fkey";

-- DropIndex
DROP INDEX "users_googleId_key";

-- AlterTable
ALTER TABLE "org_invitations" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '7 days';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "failedLoginAttempts",
DROP COLUMN "googleId",
DROP COLUMN "isEmailVerified",
DROP COLUMN "lockUntil",
DROP COLUMN "name",
DROP COLUMN "password",
DROP COLUMN "provider",
DROP COLUMN "refreshTokens",
DROP COLUMN "role",
DROP COLUMN "tokenVersion",
ADD COLUMN     "displayName" VARCHAR(100),
ADD COLUMN     "isBot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locale" TEXT DEFAULT 'en',
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC';

-- DropTable
DROP TABLE "otps";

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "type" "OtpType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_verifications_userId_idx" ON "otp_verifications"("userId");

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
