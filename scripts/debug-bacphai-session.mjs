/**
 * Debug: Xem cách lấy trang Bắc Phái đúng cách
 */

async function debug() {
  const formData = new URLSearchParams();
  formData.append("nam", "1988");
  formData.append("thang", "9");
  formData.append("ngay", "7");
  formData.append("gio", "ti");
  formData.append("gioitinh", "1");
  formData.append("lich", "1");
  formData.append("submit", "Lập lá số");
  
  console.log("=== STEP 1: Submit form ===\n");
  
  const response1 = await fetch("https://tuvi.cohoc.net/lap-la-so-tu-vi.html", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: formData.toString(),
  });
  
  // Lấy cookies
  const cookies = response1.headers.get("set-cookie");
  console.log("Cookies:", cookies);
  console.log("Status:", response1.status);
  
  const html1 = await response1.text();
  console.log("HTML length:", html1.length);
  
  // Tìm tất cả links có chứa lid hoặc bac-phai
  const allLinks = html1.match(/href=['"][^'"]+['"]/gi) || [];
  const relevantLinks = allLinks.filter(l => 
    l.includes("lid-") || 
    l.includes("bac-phai")
  );
  console.log("\nRelevant links:");
  relevantLinks.forEach(l => console.log("  ", l));
  
  // Tìm link có lid
  const lidLinkMatch = html1.match(/href=['"]([^'"]*-lid-\d+\.html)['"]/i);
  if (lidLinkMatch) {
    console.log("\n=== FOUND LID LINK ===");
    console.log(lidLinkMatch[1]);
  }
  
  // Thử fetch trang bac-phai với cookie
  console.log("\n=== STEP 2: Fetch Bắc Phái với cookie ===\n");
  
  const response2 = await fetch("https://tuvi.cohoc.net/la-so-tu-vi-bac-phai.html", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Cookie": cookies || "",
      "Referer": "https://tuvi.cohoc.net/lap-la-so-tu-vi.html",
    },
  });
  
  const html2 = await response2.text();
  console.log("HTML length:", html2.length);
  
  // Tìm lid trong trang này
  const lidMatch2 = html2.match(/-lid-(\d+)\.html/);
  console.log("LID in bac-phai page:", lidMatch2 ? lidMatch2[1] : "NOT FOUND");
  
  // Tìm nội dung luận giải
  const hasLuanGiai = html2.includes("Cung Mệnh") && html2.length > 100000;
  console.log("Has luận giải content:", hasLuanGiai);
  
  // Thử tìm link bac-phai có lid trong trang đầu
  console.log("\n=== STEP 3: Tìm pattern khác ===\n");
  
  // Tìm trong JavaScript
  const jsMatches = html1.match(/['"]([^'"]*bac-phai[^'"]*lid[^'"]*)['"]/gi);
  console.log("JS patterns with bac-phai + lid:", jsMatches?.length || 0);
  if (jsMatches) {
    jsMatches.slice(0, 5).forEach(m => console.log("  ", m));
  }
  
  // Tìm form action
  const formActions = html1.match(/<form[^>]*action=['"]([^'"]+)['"]/gi);
  console.log("\nForm actions:", formActions?.length || 0);
  if (formActions) {
    formActions.forEach(f => console.log("  ", f));
  }
  
  // Tìm data attributes
  const dataAttrs = html1.match(/data-[^=]+=['"][^'"]+['"]/gi);
  const relevantData = dataAttrs?.filter(d => 
    d.includes("lid") || d.includes("url") || d.includes("link")
  );
  console.log("\nRelevant data attributes:", relevantData?.length || 0);
  if (relevantData) {
    relevantData.slice(0, 10).forEach(d => console.log("  ", d));
  }
}

debug().catch(console.error);
