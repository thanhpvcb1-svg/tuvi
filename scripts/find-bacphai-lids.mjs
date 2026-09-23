/**
 * Tìm LID có trang Bắc Phái hợp lệ
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function findValidBacPhaiLid() {
  const discoveredFile = path.join(__dirname, "../tuvi_crawler/discovered_lids.json");
  const lids = JSON.parse(fs.readFileSync(discoveredFile, "utf-8"));
  
  console.log(`Total discovered LIDs: ${lids.length}`);
  console.log("Searching for valid Bắc Phái pages...\n");
  
  const validLids = [];
  
  for (let i = 0; i < Math.min(50, lids.length); i++) {
    const lid = lids[i];
    
    // Thử fetch trang gốc
    const baseUrl = `https://tuvi.cohoc.net/la-so-tu-vi-lid-${lid}.html`;
    
    try {
      const response = await fetch(baseUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      
      if (!response.ok) {
        console.log(`[${i+1}] LID ${lid}: HTTP ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      
      // Tìm link Bắc Phái có lid
      const bacPhaiMatch = html.match(/href=['"]([^'"]*bac-phai[^'"]*-lid-\d+\.html)['"]/i);
      
      if (bacPhaiMatch) {
        console.log(`[${i+1}] LID ${lid}: ✓ Found Bắc Phái link`);
        console.log(`    ${bacPhaiMatch[1]}`);
        validLids.push({ lid, bacPhaiUrl: bacPhaiMatch[1] });
        
        if (validLids.length >= 5) break;
      } else {
        console.log(`[${i+1}] LID ${lid}: ✗ No Bắc Phái link`);
      }
      
      // Delay
      await new Promise(r => setTimeout(r, 500));
      
    } catch (e) {
      console.log(`[${i+1}] LID ${lid}: Error - ${e.message}`);
    }
  }
  
  console.log(`\n=== VALID LIDS WITH BẮC PHÁI ===`);
  validLids.forEach(v => {
    console.log(`LID: ${v.lid}`);
    console.log(`URL: https://tuvi.cohoc.net/${v.bacPhaiUrl}`);
    console.log("");
  });
}

findValidBacPhaiLid().catch(console.error);
