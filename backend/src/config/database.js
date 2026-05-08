// Parse DATABASE_URL if provided, otherwise fall back to individual DB_* vars
const parseDbUrl = (url) => {
  if (!url) return null;
  const parsed = new URL(url);
  return {
    username: parsed.username || 'postgres',
    password: parsed.password || null,
    database: parsed.pathname.replace(/^\//, ''),
    host: parsed.hostname || 'localhost',
    port: parseInt(parsed.port) || 5432,
  };
};

const fromUrl = parseDbUrl(process.env.DATABASE_URL);

module.exports = {
  development: {
    username: fromUrl?.username || process.env.DB_USER || 'postgres',
    password: fromUrl?.password || process.env.DB_PASSWORD || null,
    database: fromUrl?.database || process.env.DB_NAME || 'project_management',
    host: fromUrl?.host || process.env.DB_HOST || 'localhost',
    port: fromUrl?.port || parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
  },
  test: {
    username: fromUrl?.username || process.env.DB_USER || 'postgres',
    password: fromUrl?.password || process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME_TEST || 'project_management_test',
    host: fromUrl?.host || process.env.DB_HOST || 'localhost',
    port: fromUrl?.port || parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    username: fromUrl?.username || process.env.DB_USER,
    password: fromUrl?.password || process.env.DB_PASSWORD,
    database: fromUrl?.database || process.env.DB_NAME,
    host: fromUrl?.host || process.env.DB_HOST,
    port: fromUrl?.port || parseInt(process.env.DB_PORT),
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
