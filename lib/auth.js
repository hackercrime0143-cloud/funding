import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fastpay-super-secret-key-12345';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function setCookieHeader(token) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  return `session=${token}; HttpOnly; Path=/; Expires=${expires}`;
}

export function getSessionFromCookies(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session=([^;]+)/);
  if (!match) return null;
  return verifyToken(match[1]);
}
