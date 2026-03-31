# GitHub Integration API and AI Workflow

## Overview
This document describes the GitHub Integration API implemented in the backend and defines an AI-friendly workflow for installation, linking, import, and webhook processing.

Base prefix: `/api`

## Endpoints

### 1) Install Redirect
- Method: `GET`
- Path: `/auth/github/install`
- Auth: Required (`protect`)
- Query:
  - `slug` (optional organization slug)
  - `returnTo` (optional callback hint)
- Behavior:
  - Validates org membership if `slug` is passed.
  - Builds GitHub App installation URL using `GITHUB_APP_INSTALL_URL` or `GITHUB_APP_SLUG`.
  - Redirects with encoded `state` payload.
- Response: HTTP `302` redirect.

### 2) Webhook Receiver
- Method: `POST`
- Path: `/github/webhook`
- Auth: No JWT
- Security:
  - Validates `X-Hub-Signature-256` using `GITHUB_WEBHOOK_SECRET`.
- Headers used:
  - `X-GitHub-Event`
  - `X-Hub-Signature-256`
- Supported events:
  - `installation`
  - `installation_repositories`
  - `issues`
- Response: `200` JSON with `accepted`, `event`, `action`, `processed`.

### 3) List Organization Installations
- Method: `GET`
- Path: `/orgs/:slug/github/installations`
- Auth: Required
- Access: Any active org member
- Response: `installations[]`

### 4) Deactivate Installation
- Method: `DELETE`
- Path: `/orgs/:slug/github/installations/:installationId`
- Auth: Required
- Access: Org `owner` or `admin`
- Behavior:
  - Deactivates installation.
  - Clears token fields.
  - Deactivates linked repos under that installation for org projects.
- Response: message + installation snapshot

### 5) Link GitHub Repo to Project
- Method: `POST`
- Path: `/orgs/:slug/projects/:projectSlug/github/link`
- Auth: Required
- Access: Project manage permission (or org owner/admin)
- Body:
  - `installationId` (UUID)
  - `githubRepoId` (number/string integer)
  - `repoFullName` (`owner/repo`)
  - `defaultBranch` (optional)
- Behavior:
  - Validates installation belongs to org and is active.
  - Creates or re-activates project-repo link.
- Response: `linkedRepo`

### 6) List Linked Project Repos
- Method: `GET`
- Path: `/orgs/:slug/projects/:projectSlug/github/repos`
- Auth: Required
- Access: Project member (or org owner/admin)
- Response: `repos[]`

### 7) Unlink Repo
- Method: `DELETE`
- Path: `/orgs/:slug/projects/:projectSlug/github/repos/:repoId`
- Auth: Required
- Access: Project manage permission (or org owner/admin)
- Behavior: Soft unlink by setting `isActive=false`.
- Response: success message

### 8) Import GitHub Issues
- Method: `POST`
- Path: `/orgs/:slug/projects/:projectSlug/github/repos/:repoId/import`
- Auth: Required
- Access: Project manage permission (or org owner/admin)
- Body:
  - `state` (`open|closed|all`, default `open`)
  - `labels` (optional string array)
  - `since` (optional ISO date)
  - `limit` (1..100, default `50`)
- Behavior:
  - Pulls issues from GitHub repository API.
  - Skips pull requests.
  - Upserts by `githubIssueId`.
  - Maps GitHub state to project status category.
- Response:
  - `importedCount`
  - `updatedCount`
  - `skippedCount`
  - `failedCount`

## AI Workflow

### Phase A: Install
1. User calls `GET /api/auth/github/install`.
2. User installs app in GitHub.
3. GitHub emits `installation` webhook.
4. Backend upserts `GitHubInstallation` (when org login maps to org slug).

### Phase B: Link Repositories
1. User calls `GET /api/orgs/:slug/github/installations`.
2. User selects installation + repo metadata.
3. User calls `POST /api/orgs/:slug/projects/:projectSlug/github/link`.
4. Backend stores `GitHubLinkedRepo`.

### Phase C: Bootstrap Import
1. User triggers `POST /api/orgs/:slug/projects/:projectSlug/github/repos/:repoId/import`.
2. Backend fetches GitHub issues.
3. Backend maps and upserts into CoworkX `issues`:
  - `isImported=true`
  - `githubIssueId/githubIssueNumber/githubIssueUrl/githubSyncedAt`
4. Backend returns import summary counts.

### Phase D: Continuous Sync
1. GitHub sends `issues` webhook events.
2. Backend resolves linked repos by installation + repository id.
3. Backend upserts matching CoworkX issue rows.
4. Backend updates `githubSyncedAt` and mapped status.

### Phase E: Deactivation
1. Admin deactivates installation or unlinks repo.
2. Backend marks records inactive.
3. Import and sync should no longer process inactive links.

## Environment Variables
- `GITHUB_APP_INSTALL_URL` (preferred) OR `GITHUB_APP_SLUG`
- `GITHUB_WEBHOOK_SECRET`

## Implementation Notes
- Webhook signature validation requires raw request body capture (already configured in `App.js`).
- Current import uses stored `GitHubInstallation.accessToken`.
- Installation-to-organization auto-mapping currently uses `organization.slug === github account login (lowercase)`.
  - If your slug differs from GitHub account login, add an explicit install callback mapping step.
