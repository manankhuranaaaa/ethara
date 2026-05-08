// Use getters so values are read from process.env at call-time, not at require-time.
// This ensures dotenv has already loaded by the time these are accessed.
module.exports = {
  get accessSecret() {
    return process.env.JWT_ACCESS_SECRET;
  },
  get refreshSecret() {
    return process.env.JWT_REFRESH_SECRET;
  },
  get accessExpiresIn() {
    return process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES || '15m';
  },
  get refreshExpiresIn() {
    return process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRES || '7d';
  },
  get refreshCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  },
};
