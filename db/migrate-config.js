// node-pg-migrate configuration
// Usage: set DATABASE_URL env var to your Neon connection string
module.exports = {
  schema: process.env.PGSCHEMA || 'public',
  dir: 'migrations',
  direction: 'up',
  migrationsTable: 'pgmigrations',
  tsconfig: null,
};

