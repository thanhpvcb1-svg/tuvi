#!/usr/bin/env python3
"""
TuVi Crawler - Crawl dữ liệu lá số từ tuvi.cohoc.net

Usage:
    python crawler.py URL
    python crawler.py URL --headed
    python crawler.py URL --debug
    python crawler.py URL --wait 20
"""
import asyncio
import argparse
import json
import re
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional

from playwright.async_api import async_playwright, Page, BrowserContext

from storage import Storage
from network import NetworkInterceptor
from parser import HTMLParser, JSAnalyzer
from normalizer import is_chart_candidate, normalize_chart, analyze_json_structure


def extract_lid(url: str) -> Optional[str]:
    """Extract lid từ URL."""
    # Pattern: -lid-472159.html
    match = re.search(r'-lid-(\d+)\.html', url)
    if match:
        return match.group(1)
    # Fallback: tìm số cuối cùng
    match = re.search(r'(\d{5,})', url)
    return match.group(1) if match else None


class TuViCrawler:
    """Main crawler class."""
    
    def __init__(self, url: str, headed: bool = False, debug: bool = False, wait: int = 10):
        self.source_url = url
        self.headed = headed
        self.debug = debug
        self.wait = wait
        
        self.chart_id = extract_lid(url)
        if not self.chart_id:
            raise ValueError(f"Cannot extract lid from URL: {url}")
        
        self.storage = Storage(self.chart_id)
        self.interceptor = NetworkInterceptor(self.chart_id, debug)
        self.js_analyzer = JSAnalyzer(self.chart_id)
        
        self.final_url = ""
        self.page_title = ""
        self.status = 0
        self.chart_candidates = []
        self.api_candidates = []
    
    def log(self, tag: str, msg: str):
        if self.debug:
            print(f"[{tag}] {msg}")
    
    async def run(self):
        """Main crawl process."""
        print(f"\n{'='*60}")
        print(f"TuVi Crawler - Chart ID: {self.chart_id}")
        print(f"URL: {self.source_url}")
        print(f"Mode: {'Headed' if self.headed else 'Headless'} | Debug: {self.debug}")
        print(f"{'='*60}\n")
        
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(
                headless=not self.headed,
                args=['--disable-blink-features=AutomationControlled']
            )
            
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                locale='vi-VN'
            )
            
            page = await context.new_page()
            
            # Setup network interception
            page.on("request", self.interceptor.on_request)
            page.on("response", self.interceptor.on_response)
            page.on("requestfailed", self.interceptor.on_request_failed)
            
            try:
                # Navigate
                print(f"[PAGE] Navigating to {self.source_url}")
                response = await page.goto(self.source_url, wait_until='networkidle', timeout=60000)
                
                self.status = response.status if response else 0
                self.final_url = page.url
                
                # Check redirect
                if self.final_url != self.source_url:
                    self.interceptor.add_redirect(self.source_url, self.final_url, self.status)
                    print(f"[REDIRECT] {self.source_url} -> {self.final_url}")
                
                # Check for anti-bot
                if '404' in self.final_url or 'robot' in self.final_url.lower():
                    print(f"\n[WARNING] Possible anti-bot redirect detected!")
                    print(f"[WARNING] Final URL: {self.final_url}")
                
                # Wait for dynamic content
                print(f"[PAGE] Waiting {self.wait}s for dynamic content...")
                await asyncio.sleep(self.wait)
                
                # If headed mode, wait for user
                if self.headed:
                    input("\n[MANUAL] Press ENTER after page is fully loaded...")
                
                # Get page content
                html = await page.content()
                self.page_title = await page.title()
                
                # Parse HTML
                parser = HTMLParser(html)
                
                # Get cookies
                cookies = await context.cookies()
                self.interceptor.add_cookies(cookies)
                
                # Get storage
                local_storage = await page.evaluate("() => Object.assign({}, localStorage)")
                session_storage = await page.evaluate("() => Object.assign({}, sessionStorage)")
                
                # Analyze scripts
                scripts = parser.get_scripts()
                js_analysis = self.js_analyzer.analyze_all(scripts)
                
                # Find chart candidates
                self.chart_candidates = self.interceptor.find_chart_data(is_chart_candidate)
                self.api_candidates = self.interceptor.get_api_candidates()
                
                # Save everything
                await self._save_results(
                    html=html,
                    parser=parser,
                    cookies=cookies,
                    local_storage=local_storage,
                    session_storage=session_storage,
                    scripts=scripts,
                    js_analysis=js_analysis
                )
                
                # Print summary
                self._print_summary()
                
            except Exception as e:
                print(f"\n[ERROR] {e}")
                import traceback
                traceback.print_exc()
            finally:
                await browser.close()
    
    async def _save_results(self, html: str, parser: HTMLParser, cookies: list,
                           local_storage: dict, session_storage: dict,
                           scripts: list, js_analysis: list):
        """Lưu tất cả kết quả."""
        print(f"\n[SAVE] Saving results to output/{self.chart_id}/")
        
        # 1. HTML
        self.storage.save_text("page.html", html)
        
        # 2. Text
        self.storage.save_text("page.txt", parser.get_text())
        
        # 3. Cookies
        self.storage.save_json("cookies.json", cookies)
        
        # 4. Storage
        self.storage.save_json("localStorage.json", local_storage)
        self.storage.save_json("sessionStorage.json", session_storage)
        
        # 5. Network
        network_data = self.interceptor.capture.to_dict()
        self.storage.save_json("network.json", network_data)
        
        # 6. Save all responses
        for resp in self.interceptor.capture.responses:
            if resp.body:
                filename = self.storage.save_response(resp.url, resp.body, resp.content_type)
                resp.saved_file = filename
        
        # 7. Chart candidates
        candidates_data = []
        for resp in self.chart_candidates:
            candidates_data.append({
                'url': resp.url,
                'score': resp.chart_score,
                'content_type': resp.content_type,
                'saved_file': resp.saved_file,
                'structure': analyze_json_structure(resp.body) if resp.body else None
            })
        self.storage.save_json("chart_candidates.json", candidates_data)
        
        # 8. Normalized chart (if found)
        if self.chart_candidates:
            best = self.chart_candidates[0]
            if best.body:
                normalized = normalize_chart(best.body, self.chart_id, "tuvi.cohoc.net")
                self.storage.save_json("normalized_chart.json", normalized)
                # Also save raw
                self.storage.save_json("raw_chart.json", best.body)
        
        # 9. Scripts analysis
        self.storage.save_json("scripts_analysis.json", {
            'scripts': scripts,
            'analysis': js_analysis,
            'inline_data': parser.extract_inline_data()
        })
        
        # 10. Tokens detected
        tokens = self.interceptor.detect_tokens()
        if tokens:
            self.storage.save_json("tokens.json", tokens)
        
        # 11. Metadata
        self.storage.create_metadata(
            source_url=self.source_url,
            final_url=self.final_url,
            title=self.page_title,
            status=self.status,
            chart_candidates=len(self.chart_candidates),
            api_candidates=self.api_candidates
        )
    
    def _print_summary(self):
        """In summary."""
        print(f"\n{'='*60}")
        print("CRAWL SUMMARY")
        print(f"{'='*60}")
        print(f"Chart ID: {self.chart_id}")
        print(f"Final URL: {self.final_url}")
        print(f"Status: {self.status}")
        print(f"Title: {self.page_title}")
        print(f"\nNetwork:")
        print(f"  - Total requests: {len(self.interceptor.capture.requests)}")
        print(f"  - Total responses: {len(self.interceptor.capture.responses)}")
        print(f"  - JSON responses: {len(self.interceptor.get_json_responses())}")
        print(f"  - Redirects: {len(self.interceptor.capture.redirects)}")
        print(f"  - Cookies: {len(self.interceptor.capture.cookies)}")
        
        print(f"\nChart Candidates: {len(self.chart_candidates)}")
        for i, c in enumerate(self.chart_candidates[:5]):
            print(f"  {i+1}. Score={c.chart_score} | {c.url[:80]}")
        
        print(f"\nAPI Candidates: {len(self.api_candidates)}")
        for i, a in enumerate(self.api_candidates[:10]):
            print(f"  {i+1}. [{a['method']}] {a['url'][:80]}")
        
        # Redirects
        if self.interceptor.capture.redirects:
            print(f"\nRedirects:")
            for r in self.interceptor.capture.redirects:
                print(f"  {r.from_url[:50]} -> {r.to_url[:50]}")
        
        # Tokens
        tokens = self.interceptor.detect_tokens()
        if tokens:
            print(f"\nTokens Detected:")
            for t in tokens[:5]:
                print(f"  [{t['type']}] {t['value'][:30]}...")
        
        print(f"\nOutput saved to: output/{self.chart_id}/")
        print(f"{'='*60}\n")
        
        # Recommendations
        if not self.chart_candidates:
            print("\n[ANALYSIS] No chart data found in JSON responses.")
            print("Possible reasons:")
            print("  1. Data is rendered server-side (check page.html)")
            print("  2. Data is in JavaScript variables (check scripts_analysis.json)")
            print("  3. Anti-bot protection blocked the request")
            print("  4. Data requires authentication")
            print("\nNext steps:")
            print("  1. Run with --headed to observe browser behavior")
            print("  2. Check network.json for suspicious requests")
            print("  3. Analyze page.html for inline data")
            print("  4. Check localStorage.json and sessionStorage.json")


def main():
    parser = argparse.ArgumentParser(description='TuVi Crawler - Crawl lá số tử vi')
    parser.add_argument('url', help='URL của lá số cần crawl')
    parser.add_argument('--headed', action='store_true', help='Chạy browser có giao diện')
    parser.add_argument('--debug', action='store_true', help='Bật debug mode')
    parser.add_argument('--wait', type=int, default=10, help='Thời gian chờ (giây)')
    
    args = parser.parse_args()
    
    try:
        crawler = TuViCrawler(
            url=args.url,
            headed=args.headed,
            debug=args.debug,
            wait=args.wait
        )
        asyncio.run(crawler.run())
    except KeyboardInterrupt:
        print("\n[INTERRUPTED] Crawler stopped by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[FATAL] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
