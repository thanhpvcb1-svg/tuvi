/**
 * Simple test for CoHoc module
 * Run: npx ts-node scripts/test-cohoc.ts
 */

// Test calendar conversion
import { solarToLunar, getHourBranch, getCohocGio } from "../src/lib/cohoc/calendar";
import { COHOC_HOUR_MAPPING } from "../src/lib/cohoc/constants";

console.log("=== CoHoc Module Tests ===\n");

// Test 1: Hour mapping
console.log("1. Hour Mapping Tests:");
const hourTests = [
  { hour: 23, expectedBranch: "Tý", expectedGio: 1 },
  { hour: 0, expectedBranch: "Tý", expectedGio: 1 },
  { hour: 1, expectedBranch: "Sửu", expectedGio: 2 },
  { hour: 5, expectedBranch: "Mão", expectedGio: 4 },
  { hour: 11, expectedBranch: "Ngọ", expectedGio: 7 },
  { hour: 17, expectedBranch: "Dậu", expectedGio: 10 },
  { hour: 22, expectedBranch: "Hợi", expectedGio: 12 },
];

let passed = 0;
let failed = 0;

for (const test of hourTests) {
  const branch = getHourBranch(test.hour);
  const gio = getCohocGio(test.hour);
  
  const branchOk = branch === test.expectedBranch;
  const gioOk = gio === test.expectedGio;
  
  if (branchOk && gioOk) {
    console.log(`   ✓ Hour ${test.hour}: ${branch} (gio=${gio})`);
    passed++;
  } else {
    console.log(`   ✗ Hour ${test.hour}: got ${branch} (gio=${gio}), expected ${test.expectedBranch} (gio=${test.expectedGio})`);
    failed++;
  }
}

// Test 2: Solar to Lunar conversion
console.log("\n2. Solar to Lunar Conversion:");
try {
  const lunar = solarToLunar("1998-10-26", 23);
  console.log(`   Input: 1998-10-26 23:00 (Solar)`);
  console.log(`   Output: ${lunar.year}-${lunar.month}-${lunar.day} ${lunar.hourBranch} (Lunar)`);
  console.log(`   Leap month: ${lunar.isLeapMonth}`);
  passed++;
} catch (error) {
  console.log(`   ✗ Conversion failed: ${error}`);
  failed++;
}

// Test 3: All 12 hours
console.log("\n3. All 12 Hour Branches:");
for (let i = 0; i < 24; i += 2) {
  const branch = getHourBranch(i);
  const gio = getCohocGio(i);
  console.log(`   ${String(i).padStart(2, "0")}:00 → ${branch} (gio=${gio})`);
}

// Summary
console.log("\n=== Summary ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
