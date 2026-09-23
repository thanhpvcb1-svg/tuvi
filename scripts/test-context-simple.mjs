/**
 * Simple Test for Context Expander
 * Run: node --loader ts-node/esm scripts/test-context-simple.mjs
 */

// Test Tam Hợp logic
const TAM_HOP_GROUPS = {
  "Thân": ["Thân", "Tý", "Thìn"],
  "Tý": ["Thân", "Tý", "Thìn"],
  "Thìn": ["Thân", "Tý", "Thìn"],
  "Dần": ["Dần", "Ngọ", "Tuất"],
  "Ngọ": ["Dần", "Ngọ", "Tuất"],
  "Tuất": ["Dần", "Ngọ", "Tuất"],
  "Tỵ": ["Tỵ", "Dậu", "Sửu"],
  "Dậu": ["Tỵ", "Dậu", "Sửu"],
  "Sửu": ["Tỵ", "Dậu", "Sửu"],
  "Hợi": ["Hợi", "Mão", "Mùi"],
  "Mão": ["Hợi", "Mão", "Mùi"],
  "Mùi": ["Hợi", "Mão", "Mùi"],
};

const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

function getTamHopBranches(branch) {
  const group = TAM_HOP_GROUPS[branch];
  if (!group) return [];
  return group.filter(b => b !== branch);
}

function getOppositeBranch(branch) {
  const index = BRANCHES.indexOf(branch);
  if (index < 0) return "";
  return BRANCHES[(index + 6) % 12];
}

function getGiapCungBranches(branch) {
  const index = BRANCHES.indexOf(branch);
  if (index < 0) return ["", ""];
  return [
    BRANCHES[(index - 1 + 12) % 12],
    BRANCHES[(index + 1) % 12]
  ];
}

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║           TEST: Context Expander Logic                     ║");
console.log("╚════════════════════════════════════════════════════════════╝");

console.log("\n=== TAM HỢP ===");
for (const branch of ["Tý", "Dần", "Tỵ", "Hợi"]) {
  const tamHop = getTamHopBranches(branch);
  console.log(`${branch}: Tam hợp với ${tamHop.join(", ")}`);
}

console.log("\n=== XUNG CHIẾU (ĐỐI CUNG) ===");
for (const branch of BRANCHES.slice(0, 6)) {
  const opposite = getOppositeBranch(branch);
  console.log(`${branch} ↔ ${opposite}`);
}

console.log("\n=== GIÁP CUNG ===");
for (const branch of ["Tý", "Dần", "Ngọ", "Tuất"]) {
  const [prev, next] = getGiapCungBranches(branch);
  console.log(`${branch}: [${prev}] ← → [${next}]`);
}

console.log("\n=== VERIFICATION ===");

// Verify Tam Hợp
let tamHopOk = true;
for (const [branch, group] of Object.entries(TAM_HOP_GROUPS)) {
  if (group.length !== 3) {
    console.log(`ERROR: ${branch} has ${group.length} members`);
    tamHopOk = false;
  }
}
console.log(`Tam Hợp groups: ${tamHopOk ? "✓ OK" : "✗ FAILED"}`);

// Verify Xung Chiếu
let xungOk = true;
for (const branch of BRANCHES) {
  const opposite = getOppositeBranch(branch);
  const backToOriginal = getOppositeBranch(opposite);
  if (backToOriginal !== branch) {
    console.log(`ERROR: ${branch} -> ${opposite} -> ${backToOriginal}`);
    xungOk = false;
  }
}
console.log(`Xung Chiếu pairs: ${xungOk ? "✓ OK" : "✗ FAILED"}`);

// Verify Giáp Cung
let giapOk = true;
for (const branch of BRANCHES) {
  const [prev, next] = getGiapCungBranches(branch);
  const prevIndex = BRANCHES.indexOf(prev);
  const nextIndex = BRANCHES.indexOf(next);
  const branchIndex = BRANCHES.indexOf(branch);
  
  if ((prevIndex + 1) % 12 !== branchIndex || (branchIndex + 1) % 12 !== nextIndex) {
    console.log(`ERROR: ${prev} <- ${branch} -> ${next}`);
    giapOk = false;
  }
}
console.log(`Giáp Cung pairs: ${giapOk ? "✓ OK" : "✗ FAILED"}`);

console.log("\n=== TEST COMPLETED ===");
