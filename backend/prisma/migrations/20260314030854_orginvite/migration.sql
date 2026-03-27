-- AlterTable
ALTER TABLE "org_invitations" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '7 days';
