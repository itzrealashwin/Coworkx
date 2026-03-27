const GITHUB_USER_API = 'https://api.github.com/user';
const GITHUB_USER_EMAILS_API = 'https://api.github.com/user/emails';

/**
 * Verify a GitHub OAuth access token and return a normalized user payload.
 * @param {string} accessToken
 * @returns {Promise<{email: string, name: string, avatarUrl: string | null, githubId: string, username: string | null}>}
 */
const verifyGitHubToken = async (accessToken) => {
  const userResponse = await fetch(GITHUB_USER_API, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Coworkx-Auth',
    },
  });

  if (!userResponse.ok) {
    throw new Error('Invalid GitHub access token.');
  }

  const userPayload = await userResponse.json();

  let email = userPayload.email || null;
  if (!email) {
    const emailsResponse = await fetch(GITHUB_USER_EMAILS_API, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Coworkx-Auth',
      },
    });

    if (!emailsResponse.ok) {
      throw new Error('Unable to fetch email from GitHub.');
    }

    const emails = await emailsResponse.json();
    const primaryVerifiedEmail = emails.find((entry) => entry.primary && entry.verified);
    const anyVerifiedEmail = emails.find((entry) => entry.verified);
    email = primaryVerifiedEmail?.email || anyVerifiedEmail?.email || null;
  }

  if (!email) {
    throw new Error('GitHub account email is required.');
  }

  return {
    email,
    name: userPayload.name || userPayload.login || email.split('@')[0],
    avatarUrl: userPayload.avatar_url || null,
    githubId: String(userPayload.id),
    username: userPayload.login || null,
  };
};

export { verifyGitHubToken };