#!/usr/bin/env python3
"""
Crawl 20 lá số ngẫu nhiên từ tuvi.cohoc.net

Usage:
    python crawl_random_20.py
    python crawl_random_20.py --headed
    python crawl_random_20.py --count 10
"""
import asyncio
import argparse
import json
import random
import sys
from pathlib import Path
from datetime import datetime

from crawler import TuViCrawler

# Range lid hợp lệ (dựa trên discovered_lids.json)
MIN_LID = 100
MAX_LID = 520000

def load_crawled_lids() -> set:
    """Load danh sách lid đã crawl."""
    progress_file = Path(__file__).parent / "crawl_progress.json"
    if progress_file.exists():
        data = json.loads(progress_file.read_text(encoding="utf-8"))
        return set(data.get("crawled", []))
    return set()

def save_crawled_lids(crawled: set):
    """Lưu danh sách lid đã crawl."""
    progress_file = Path(__file__).parent / "crawl_progress.json"
    data = {"crawled": list(crawled), "lastIndex": len(crawled)}
    progress_file.write_text(json.dumps(data, indent=2), encoding="utf-8")

def generate_random_lids(count: int, exclude: set) -> list:
    """Generate random lid chưa crawl."""
    lids = []
    attempts = 0
    max_attempts = count * 10
    
    while len(lids) < count and attempts < max_attempts:
        lid = str(random.randint(MIN_LID, MAX_LID))
        if lid not in exclude and lid not in lids:
            lids.append(lid)
        attempts += 1
    
    return lids

def build_url(lid: str) -> str:
    """Build URL từ lid."""
    return f"https://tuvi.cohoc.net/la-so-tu-vi-lid-{lid}.html"

async def crawl_one(lid: str, headed: bool, wait: int) -> bool:
    """Crawl một lá số, return True nếu thành công."""
    url = build_url(lid)
    try:
        crawler = TuViCrawler(url=url, headed=headed, debug=False, wait=wait)
        await crawler.run()
        return True
    except Exception as e:
        print(f"[ERROR] Failed to crawl {lid}: {e}")
        return False

async def main(count: int, headed: bool, wait: int, delay: int):
    """Main function."""
    print(f"\n{'='*60}")
    print(f"CRAWL {count} RANDOM CHARTS FROM TUVICOHOC")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Mode: {'Headed' if headed else 'Headless'}")
    print(f"Wait: {wait}s | Delay between: {delay}s")
    print(f"{'='*60}\n")
    
    # Load đã crawl
    crawled = load_crawled_lids()
    print(f"[INFO] Already crawled: {len(crawled)} charts")
    
    # Generate random lids
    lids = generate_random_lids(count, crawled)
    print(f"[INFO] Generated {len(lids)} random lids to crawl")
    print(f"[INFO] LIDs: {lids}\n")
    
    # Crawl từng lid
    success = 0
    failed = 0
    
    for i, lid in enumerate(lids, 1):
        print(f"\n[{i}/{len(lids)}] Crawling lid={lid}...")
        
        if await crawl_one(lid, headed, wait):
            success += 1
            crawled.add(lid)
            save_crawled_lids(crawled)
        else:
            failed += 1
        
        # Delay giữa các request
        if i < len(lids):
            print(f"[DELAY] Waiting {delay}s before next...")
            await asyncio.sleep(delay)
    
    # Summary
    print(f"\n{'='*60}")
    print("CRAWL SUMMARY")
    print(f"{'='*60}")
    print(f"Total: {len(lids)}")
    print(f"Success: {success}")
    print(f"Failed: {failed}")
    print(f"Total crawled: {len(crawled)}")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Crawl random charts from tuvicohoc')
    parser.add_argument('--count', type=int, default=20, help='Số lá số cần crawl (default: 20)')
    parser.add_argument('--headed', action='store_true', help='Chạy browser có giao diện')
    parser.add_argument('--wait', type=int, default=8, help='Thời gian chờ mỗi page (default: 8s)')
    parser.add_argument('--delay', type=int, default=3, help='Delay giữa các request (default: 3s)')
    
    args = parser.parse_args()
    
    try:
        asyncio.run(main(args.count, args.headed, args.wait, args.delay))
    except KeyboardInterrupt:
        print("\n[INTERRUPTED] Stopped by user")
        sys.exit(1)
