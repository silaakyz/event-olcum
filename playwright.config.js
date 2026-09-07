/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: 'tests/e2e',
  timeout: 30000,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3100',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
};

module.exports = config;
