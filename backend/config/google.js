import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify a Google ID token and return the user payload.
 * @param {string} idToken — the ID token from the frontend
 * @returns {object} { email, name, picture, googleId }
 */
const verifyGoogleToken = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    googleId: payload.sub,
  };
};

export { googleClient, verifyGoogleToken };
