"""Storage module - Quản lý lưu trữ dữ liệu crawl."""
import json
import hashlib
import os
from pathlib import Path
from datetime import datetime
from typing import Any

class Storage:
    """Quản lý lưu trữ output của crawler."""
    
    def __init__(self, chart_id: str, base_dir: str = "output"):
        self.chart_id = chart_id
        self.base_path = Path(base_dir) / chart_id
        self.responses_path = self.base_path / "responses"
        self._ensure_dirs()
        self._response_counter = 0
    
    def _ensure_dirs(self):
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.responses_path.mkdir(exist_ok=True)
    
    def _hash_url(self, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()[:12]
    
    def save_json(self, filename: str, data: Any):
        path = self.base_path / filename
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def save_text(self, filename: str, content: str):
        path = self.base_path / filename
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def save_binary(self, filename: str, content: bytes):
        path = self.base_path / filename
        with open(path, 'wb') as f:
            f.write(content)
    
    def save_response(self, url: str, content: Any, content_type: str = "") -> str:
        """Lưu response body, trả về filename."""
        self._response_counter += 1
        url_hash = self._hash_url(url)
        
        # Xác định extension
        ext = ".bin"
        if "json" in content_type:
            ext = ".json"
        elif "javascript" in content_type:
            ext = ".js"
        elif "html" in content_type:
            ext = ".html"
        elif "css" in content_type:
            ext = ".css"
        elif "text" in content_type:
            ext = ".txt"
        
        filename = f"response_{self._response_counter:03d}_{url_hash}{ext}"
        path = self.responses_path / filename
        
        if isinstance(content, (dict, list)):
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(content, f, ensure_ascii=False, indent=2)
        elif isinstance(content, str):
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
        elif isinstance(content, bytes):
            with open(path, 'wb') as f:
                f.write(content)
        
        return filename
    
    def create_metadata(self, source_url: str, final_url: str, title: str, 
                       status: int, chart_candidates: int, api_candidates: list) -> dict:
        metadata = {
            "source_url": source_url,
            "final_url": final_url,
            "chart_id": self.chart_id,
            "crawl_time": datetime.now().isoformat(),
            "page_title": title,
            "status": status,
            "chart_candidates": chart_candidates,
            "api_candidates": api_candidates
        }
        self.save_json("metadata.json", metadata)
        return metadata
