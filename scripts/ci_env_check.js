const required = ['NODE_ENV', 'PORT', 'AUDIT_TRAIL_MAX', 'TELEMETRY_MAX_PENDING', 'TEST_BASE_URL'];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
} else {
  console.log('All required environment variables present');
  process.exit(0);
}
