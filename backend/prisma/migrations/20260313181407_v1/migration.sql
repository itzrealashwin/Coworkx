/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrgMemberRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired');

-- CreateEnum
CREATE TYPE "ProjectState" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('task', 'bug', 'sub_task');

-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "StatusCategory" AS ENUM ('todo', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "IssueLinkType" AS ENUM ('blocks', 'blocked_by', 'relates_to', 'duplicates');

-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('planned', 'active', 'completed');

-- CreateEnum
CREATE TYPE "GitHubAccountType" AS ENUM ('Organization', 'User');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OtpType" ADD VALUE 'admin_login';
ALTER TYPE "OtpType" ADD VALUE 'email_verify';

-- AlterTable
ALTER TABLE "otps" ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "username" VARCHAR(50) NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "user_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_oauth_providers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "providerUserId" VARCHAR(255) NOT NULL,
    "providerEmail" VARCHAR(255),
    "providerUsername" VARCHAR(100),
    "providerAvatarUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_oauth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_oauth_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_invitations" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT now() + interval '7 days',
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_members" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgMemberRole" NOT NULL DEFAULT 'member',
    "invitedBy" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "removedBy" TEXT,

    CONSTRAINT "org_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "key" VARCHAR(10) NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "leadId" TEXT,
    "status" "ProjectState" NOT NULL DEFAULT 'active',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "addedBy" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "removedBy" TEXT,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "goal" TEXT,
    "status" "SprintStatus" NOT NULL DEFAULT 'planned',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_statuses" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "category" "StatusCategory" NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sprintId" TEXT,
    "parentId" TEXT,
    "statusId" TEXT NOT NULL,
    "repoId" TEXT,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "type" "IssueType" NOT NULL,
    "priority" "IssuePriority" NOT NULL DEFAULT 'medium',
    "assigneeId" TEXT,
    "reporterId" TEXT NOT NULL,
    "dueDate" DATE,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "githubIssueId" BIGINT,
    "githubIssueNumber" INTEGER,
    "githubIssueUrl" TEXT,
    "githubSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_links" (
    "id" TEXT NOT NULL,
    "sourceIssueId" TEXT NOT NULL,
    "targetIssueId" TEXT NOT NULL,
    "linkType" "IssueLinkType" NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_comments" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "issue_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_history" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "field" VARCHAR(50) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_installations" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "installationId" BIGINT NOT NULL,
    "accountLogin" VARCHAR(100) NOT NULL,
    "accountType" "GitHubAccountType" NOT NULL,
    "accessToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_linked_repos" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "githubRepoId" BIGINT NOT NULL,
    "repoFullName" VARCHAR(255) NOT NULL,
    "defaultBranch" VARCHAR(100) NOT NULL DEFAULT 'main',
    "linkedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "github_linked_repos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "resourceType" VARCHAR(30),
    "resourceId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "url" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_userId_key" ON "user_credentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_providers_provider_providerUserId_key" ON "user_oauth_providers"("provider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_tokens_userId_provider_key" ON "user_oauth_tokens"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refreshTokenHash_key" ON "user_sessions"("refreshTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_org_slug" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_org_owner_id" ON "organizations"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "org_invitations_token_key" ON "org_invitations"("token");

-- CreateIndex
CREATE INDEX "idx_invitations_token" ON "org_invitations"("token");

-- CreateIndex
CREATE INDEX "idx_invitations_org_id" ON "org_invitations"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "org_invitations_orgId_email_key" ON "org_invitations"("orgId", "email");

-- CreateIndex
CREATE INDEX "idx_roles_org_id" ON "roles"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_orgId_name_key" ON "roles"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "org_members_orgId_userId_key" ON "org_members"("orgId", "userId");

-- CreateIndex
CREATE INDEX "idx_projects_org_id" ON "projects"("orgId");

-- CreateIndex
CREATE INDEX "idx_projects_lead_id" ON "projects"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_orgId_key_key" ON "projects"("orgId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "projects_orgId_slug_key" ON "projects"("orgId", "slug");

-- CreateIndex
CREATE INDEX "idx_project_members_project_id" ON "project_members"("projectId");

-- CreateIndex
CREATE INDEX "idx_project_members_user_id" ON "project_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "project_members"("projectId", "userId");

-- CreateIndex
CREATE INDEX "idx_sprints_project_id" ON "sprints"("projectId");

-- CreateIndex
CREATE INDEX "idx_project_statuses_project_id" ON "project_statuses"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_statuses_projectId_name_key" ON "project_statuses"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "issues_githubIssueId_key" ON "issues"("githubIssueId");

-- CreateIndex
CREATE INDEX "idx_issues_project_id" ON "issues"("projectId");

-- CreateIndex
CREATE INDEX "idx_issues_sprint_id" ON "issues"("sprintId");

-- CreateIndex
CREATE INDEX "idx_issues_parent_id" ON "issues"("parentId");

-- CreateIndex
CREATE INDEX "idx_issues_assignee_id" ON "issues"("assigneeId");

-- CreateIndex
CREATE INDEX "idx_issues_status_id" ON "issues"("statusId");

-- CreateIndex
CREATE UNIQUE INDEX "issues_projectId_number_key" ON "issues"("projectId", "number");

-- CreateIndex
CREATE INDEX "idx_issue_links_source" ON "issue_links"("sourceIssueId");

-- CreateIndex
CREATE INDEX "idx_issue_links_target" ON "issue_links"("targetIssueId");

-- CreateIndex
CREATE UNIQUE INDEX "issue_links_sourceIssueId_targetIssueId_linkType_key" ON "issue_links"("sourceIssueId", "targetIssueId", "linkType");

-- CreateIndex
CREATE INDEX "idx_comments_issue_id" ON "issue_comments"("issueId");

-- CreateIndex
CREATE INDEX "idx_comments_parent_id" ON "issue_comments"("parentId");

-- CreateIndex
CREATE INDEX "issue_history_issueId_idx" ON "issue_history"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "github_installations_installationId_key" ON "github_installations"("installationId");

-- CreateIndex
CREATE INDEX "idx_github_installations_org_id" ON "github_installations"("orgId");

-- CreateIndex
CREATE INDEX "idx_github_linked_repos_project_id" ON "github_linked_repos"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "github_linked_repos_projectId_githubRepoId_key" ON "github_linked_repos"("projectId", "githubRepoId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_idx" ON "notifications"("recipientId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_isRead_idx" ON "notifications"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_orgId_idx" ON "notifications"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_orgId_key" ON "notification_preferences"("userId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_oauth_providers" ADD CONSTRAINT "user_oauth_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_oauth_tokens" ADD CONSTRAINT "user_oauth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_invitations" ADD CONSTRAINT "org_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_removedBy_fkey" FOREIGN KEY ("removedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_removedBy_fkey" FOREIGN KEY ("removedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_statuses" ADD CONSTRAINT "project_statuses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "project_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "github_linked_repos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_links" ADD CONSTRAINT "issue_links_sourceIssueId_fkey" FOREIGN KEY ("sourceIssueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_links" ADD CONSTRAINT "issue_links_targetIssueId_fkey" FOREIGN KEY ("targetIssueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_links" ADD CONSTRAINT "issue_links_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_comments" ADD CONSTRAINT "issue_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "issue_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_history" ADD CONSTRAINT "issue_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_linked_repos" ADD CONSTRAINT "github_linked_repos_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_linked_repos" ADD CONSTRAINT "github_linked_repos_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "github_installations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_linked_repos" ADD CONSTRAINT "github_linked_repos_linkedBy_fkey" FOREIGN KEY ("linkedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
