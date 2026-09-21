#!/usr/bin/env node

const { ConvexClient } = require("convex/browser");
const { ConvexHttpClient } = require("convex/browser");

async function seedData() {
  // Get academy ID from environment or command line
  const academyId = process.argv[2];

  if (!academyId) {
    console.error("Usage: node seed-data.js <academyId>");
    console.error(
      "\nExample: node seed-data.js v_1234abcd5678efgh90ijklmnopqrst"
    );
    process.exit(1);
  }

  try {
    console.log("🌱 Starting seed data generation...");
    console.log(`Using academy ID: ${academyId}`);

    // Note: This requires the Convex deployment URL to be set
    // You can run this from the Convex dashboard or set up proper auth
    console.log(
      "\n📝 To seed data, you have two options:\n"
    );
    console.log("Option 1: Use the UI");
    console.log(
      "  1. Open http://localhost:8081/seed in your browser"
    );
    console.log("  2. Sign in with your account");
    console.log("  3. Click 'Create Sample Data'\n");

    console.log("Option 2: Use More menu");
    console.log(
      "  1. Navigate to the More tab in the app"
    );
    console.log("  2. Scroll to Tools section");
    console.log(
      "  3. Tap 'Seed Sample Data'"
    );
    console.log("  4. Click 'Create Sample Data'\n");

    console.log("Sample data will include:");
    console.log("  • 4 courses (Math, English, Physics, Chemistry)");
    console.log("  • 12 batches (3 per course)");
    console.log("  • 5 teachers");
    console.log("  • 12 students distributed across batches");
    console.log(
      "  • Fees with mixed payment statuses (paid, partial, due, overdue)"
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

seedData();
