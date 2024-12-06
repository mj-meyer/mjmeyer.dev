import generateOgImage from '../src/utils/generateOgImage';
import { SITE } from '../src/config';

async function testOgImage() {
  try {
    // Test with different titles to see various layouts
    const testCases = [
      "This is a test title",
      "A very long title that might wrap to multiple lines and need special handling in the layout and maybe could extend even more i want it to cut off so we can see what happens with this text",
      "Short title",
      "Building Is Where the Magic Happens"
    ];

    for (const testCase of testCases) {
      console.log(`Generating OG image for: "${testCase}"`);
      await generateOgImage(testCase, testCase);
    }

    console.log("✅ Test OG images generated successfully!");
    console.log("📁 Check the public/assets directory for the output files.");
  } catch (error) {
    console.error("❌ Error generating OG images:", error);
    process.exit(1);
  }
}

testOgImage(); 
