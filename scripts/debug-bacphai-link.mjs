/**
 * Debug: Tìm link Bắc Phái trong HTML sau khi submit form
 */

import * as fs from "fs";

async function debug() {
  const formData = new URLSearchParams();
  formData.append("nam", "1988");
  formData.append("thang", "9");
  formData.append("ngay", "7");
  formData.append("gio", "ti");
  formData.append("gioitinh", "1");
  formData.append("lich", "1");
  formData.append("submit", "Lập lá số");
  
  console.log("Submitting form...");
  
  const response = await fetch("https://tuvi.cohoc.net/lap-la-so-tu-vi.html", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: formData.toString(),
  });
  
  const html = await response.text();
  
  // Save HTML
  fs.writeFileSync("temp_form_result.html", html);
  console.log("Saved to temp_form_result.html");
  console.log("HTML length:", html.length);
  
  // Tìm tất cả links
  console.log("\n=== TÌM LINKS ===\n");
  
  const linkRegex = /href="([^"]+)"/gi;
  const links = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  
  console.log("Total links:", links.length);
  
  // Filter links có chứa "bac" hoặc "phai" hoặc "lid"
  const relevantLinks = links.filter(l => 
    l.toLowerCase().includes("bac") || 
    l.toLowerCase().includes("phai") ||
    l.includes("-lid-")
  );
  
  console.log("\nRelevant links (bac/phai/lid):");
  relevantLinks.forEach(l => console.log("  ", l));
  
  // Tìm text "Bắc Phái" hoặc "Bắc phái"
  console.log("\n=== TÌM TEXT 'BẮC PHÁI' ===\n");
  
  const bacPhaiMatches = html.match(/[Bb]ắc\s*[Pp]hái/g);
  console.log("'Bắc Phái' occurrences:", bacPhaiMatches?.length || 0);
  
  // Tìm context xung quanh "Bắc Phái"
  const bacPhaiIndex = html.indexOf("Bắc");
  if (bacPhaiIndex > -1) {
    console.log("\nContext around 'Bắc':");
    console.log(html.substring(bacPhaiIndex - 100, bacPhaiIndex + 200));
  }
  
  // Tìm các button/link có text liên quan
  console.log("\n=== TÌM BUTTONS/LINKS ===\n");
  
  const buttonPatterns = [
    /<a[^>]*>([^<]*[Bb]ắc[^<]*)<\/a>/gi,
    /<button[^>]*>([^<]*[Bb]ắc[^<]*)<\/button>/gi,
    /<a[^>]*href="([^"]*)"[^>]*>[^<]*luận giải[^<]*<\/a>/gi,
  ];
  
  for (const pattern of buttonPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      console.log(`Pattern ${pattern}:`);
      matches.forEach(m => console.log("  ", m.substring(0, 150)));
    }
  }
  
  // Tìm onclick handlers
  console.log("\n=== TÌM ONCLICK ===\n");
  const onclickMatches = html.match(/onclick="[^"]*"/gi);
  if (onclickMatches) {
    const relevant = onclickMatches.filter(m => 
      m.toLowerCase().includes("bac") || 
      m.toLowerCase().includes("luan")
    );
    console.log("Relevant onclick:", relevant.length);
    relevant.forEach(m => console.log("  ", m));
  }
  
  // Tìm form actions
  console.log("\n=== TÌM FORMS ===\n");
  const formMatches = html.match(/<form[^>]*action="([^"]*)"[^>]*>/gi);
  if (formMatches) {
    formMatches.forEach(m => console.log("  ", m.substring(0, 150)));
  }
}

debug().catch(console.error);
