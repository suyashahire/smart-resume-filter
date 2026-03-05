// MongoDB initialization script
// Creates an app-specific user with readWrite access to the hireq database only.
// This runs automatically on first container start via MONGO_INITDB_DATABASE.

db = db.getSiblingDB('hireq');

db.createUser({
  user: 'hireq_app',
  pwd: _getEnv('MONGO_APP_PASSWORD') || 'changeme_app',
  roles: [
    { role: 'readWrite', db: 'hireq' }
  ]
});
