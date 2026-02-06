/**
 * Version Bump Script
 *
 * Usage:
 *   node scripts/bumpVersion.js patch   - Bump patch version (1.0.0 -> 1.0.1)
 *   node scripts/bumpVersion.js minor   - Bump minor version (1.0.0 -> 1.1.0)
 *   node scripts/bumpVersion.js major   - Bump major version (1.0.0 -> 2.0.0)
 *   node scripts/bumpVersion.js         - Just increment build number
 *
 * This script updates src/config/version.js with the new version
 */

const fs = require("fs");
const path = require("path");

const versionFilePath = path.join(__dirname, "..", "src", "config", "version.js");

// Read the current version file
let content = fs.readFileSync(versionFilePath, "utf8");

// Extract current version
const versionMatch = content.match(/APP_VERSION = "(\d+)\.(\d+)\.(\d+)"/);
const buildMatch = content.match(/BUILD_NUMBER = (\d+)/);

if (!versionMatch || !buildMatch) {
  console.error("❌ Could not parse version file");
  process.exit(1);
}

let major = parseInt(versionMatch[1]);
let minor = parseInt(versionMatch[2]);
let patch = parseInt(versionMatch[3]);
let buildNumber = parseInt(buildMatch[1]);

const bumpType = process.argv[2] || "build";

// Bump version based on type
switch (bumpType) {
  case "major":
    major++;
    minor = 0;
    patch = 0;
    buildNumber++;
    break;
  case "minor":
    minor++;
    patch = 0;
    buildNumber++;
    break;
  case "patch":
    patch++;
    buildNumber++;
    break;
  case "build":
  default:
    buildNumber++;
    break;
}

const newVersion = `${major}.${minor}.${patch}`;
const today = new Date().toISOString().split("T")[0];

console.log(`\n📦 Version Bump: ${versionMatch[0].split('"')[1]} -> ${newVersion}`);
console.log(`📦 Build Number: ${buildMatch[1]} -> ${buildNumber}`);
console.log(`📅 Date: ${today}\n`);

// Update version in content
content = content.replace(/APP_VERSION = "[\d.]+"/,`APP_VERSION = "${newVersion}"`);
content = content.replace(/BUILD_DATE = "[\d-]+"/,`BUILD_DATE = "${today}"`);
content = content.replace(/BUILD_NUMBER = \d+/,`BUILD_NUMBER = ${buildNumber}`);

// Write updated content
fs.writeFileSync(versionFilePath, content);

console.log(`✅ Updated ${versionFilePath}`);
console.log(`\n🚀 New version: v${newVersion} (Build ${buildNumber})`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Run: npm run build`);
console.log(`   2. Deploy the build folder`);
console.log(`   3. Users will automatically get the new version!\n`);
