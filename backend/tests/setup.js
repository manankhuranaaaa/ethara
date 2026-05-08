require('dotenv').config({ path: '.env.example' });
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_32_chars_minimum_ok';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32_chars_minimum_ok';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
