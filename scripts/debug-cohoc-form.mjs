/**
 * Debug form submit to tuvi.cohoc.net
 */

async function debugFormSubmit() {
  const formData = new URLSearchParams();
  formData.append("nam", "1988");
  formData.append("thang", "9");
  formData.append("ngay", "7");
  formData.append("gio", "ti");
  formData.append("gioitinh", "1");
  formData.append("lich", "1");
  formData.append("submit", "Lập lá số");
  
  console.log("Submitting form...");
  console.log("Form data:", formData.toString());
  
  const response = await fetch("https://tuvi.cohoc.net/lap-la-so-tu-vi.html", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Origin": "https://tuvi.cohoc.net",
      "Referer": "https://tuvi.cohoc.net/lap-la-so-tu-vi.html",
    },
    body: formData.toString(),
    redirect: "manual", // Don't follow redirects automatically
  });
  
  console.log("\nResponse status:", response.status);
  console.log("Response URL:", response.url);
  console.log("Location header:", response.headers.get("location"));
  console.log("Content-Type:", response.headers.get("content-type"));
  
  const html = await response.text();
  console.log("\nHTML length:", html.length);
  console.log("First 500 chars:", html.substring(0, 500));
  
  // Check for redirect in HTML
  const metaRefresh = html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["']([^"']+)["']/i);
  if (metaRefresh) {
    console.log("\nMeta refresh found:", metaRefresh[1]);
  }
  
  // Check for lid in HTML
  const lidMatch = html.match(/-lid-(\d+)\.html/);
  if (lidMatch) {
    console.log("\nLID found in HTML:", lidMatch[1]);
  }
  
  // Check for chart content
  console.log("\nHas CUNG MỆNH:", html.includes("CUNG MỆNH"));
  console.log("Has Tử Vi:", html.includes("Tử Vi"));
}

debugFormSubmit().catch(console.error);
