const OEK_CONN_CRED = {
  host: process.env.OEK_HOST || 'localhost',
  port: process.env.OEK_PORT || 5432,
  user: process.env.OEK_USER || 'oek',
  password: process.env.OEK_PASSWORD || 'oek',
  database: process.env.OEK_DB || 'oek',
};

module.exports = {
  OEK_CONN_CRED,
};