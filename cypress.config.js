import { defineConfig } from "cypress";

export default defineConfig({
  video: true,
  videoCompression: 32,
  screenshotOnRunFailure: true,
  e2e: {
    baseUrl: "http://127.0.0.1:5173",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: false,
    viewportWidth: 390,
    viewportHeight: 844,
  },
});
