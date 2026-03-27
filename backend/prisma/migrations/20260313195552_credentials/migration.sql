-- AlterTable
ALTER TABLE "org_invitations" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '7 days';

-- AlterTable
ALTER TABLE "user_credentials" ADD COLUMN     "lockUntil" TIMESTAMP(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3);
