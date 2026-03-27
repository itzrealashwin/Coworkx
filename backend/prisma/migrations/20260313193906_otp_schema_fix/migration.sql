/*
  Warnings:

  - You are about to drop the column `createdAt` on the `otp_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `otp_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `isUsed` on the `otp_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `otp` on the `otp_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `otp_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `otp_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `otp_verifications` table. All the data in the column will be lost.
  - Added the required column `expires_at` to the `otp_verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `otp_hash` to the `otp_verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `otp_verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `otp_verifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "otp_verifications" DROP CONSTRAINT "otp_verifications_userId_fkey";

-- DropIndex
DROP INDEX "otp_verifications_userId_idx";

-- AlterTable
ALTER TABLE "org_invitations" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '7 days';

-- AlterTable
ALTER TABLE "otp_verifications" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "isUsed",
DROP COLUMN "otp",
DROP COLUMN "type",
DROP COLUMN "userId",
DROP COLUMN "verifiedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "otp_hash" TEXT NOT NULL,
ADD COLUMN     "purpose" "OtpType" NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "idx_otp_user_id" ON "otp_verifications"("user_id");

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
