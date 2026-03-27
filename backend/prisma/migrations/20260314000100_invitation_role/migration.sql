-- Add invitation role so accepted memberships can preserve invited org role.
ALTER TABLE "org_invitations"
ADD COLUMN "role" "OrgMemberRole" NOT NULL DEFAULT 'member';
