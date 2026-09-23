"""Parser module - Phân tích HTML và JavaScript."""
import re
from typing import List, Dict, Any
from bs4 import BeautifulSoup

# Keywords để phát hiện API calls trong JS
API_PATTERNS = [
    r'fetch\s*\(\s*[\'"`]([^\'"`]+)[\'"`]',
    r'\$\.ajax\s*\(\s*\{[^}]*url\s*:\s*[\'"`]([^\'"`]+)[\'"`]',
    r'\$\.get\s*\(\s*[\'"`]([^\'"`]+)[\'"`]',
    r'\$\.post\s*\(\s*[\'"`]([^\'"`]+)[\'"`]',
    r'\$\.getJSON\s*\(\s*[\'"`]([^\'"`]+)[\'"`]',
    r'XMLHttpRequest[^;]*open\s*\(\s*[\'"`]\w+[\'"`]\s*,\s*[\'"`]([^\'"`]+)[\'"`]',
    r'axios\.[a-z]+\s*\(\s*[\'"`]([^\'"`]+)[\'"`]',
]

# Keywords liên quan đến tử vi
TUVI_KEYWORDS = [
    'lid', 'chart', 'laso', 'laSo', 'tuvi', 'core', 'api', 'ajax',
    'token', 'nonce', 'session', 'data', 'cung', 'sao', 'menh'
]

class HTMLParser:
    """Phân tích HTML page."""
    
    def __init__(self, html: str):
        self.soup = BeautifulSoup(html, 'lxml')
        self.html = html
    
    def get_title(self) -> str:
        title = self.soup.find('title')
        return title.get_text(strip=True) if title else ""
    
    def get_text(self) -> str:
        # Loại bỏ script và style
        for tag in self.soup(['script', 'style', 'noscript']):
            tag.decompose()
        return self.soup.get_text(separator='\n', strip=True)
    
    def get_scripts(self) -> List[Dict[str, Any]]:
        """Lấy tất cả script tags."""
        scripts = []
        for i, script in enumerate(self.soup.find_all('script')):
            src = script.get('src', '')
            content = script.string or ''
            scripts.append({
                'index': i,
                'src': src,
                'inline': bool(content),
                'content': content[:5000] if content else '',  # Giới hạn size
                'type': script.get('type', 'text/javascript')
            })
        return scripts
    
    def extract_inline_data(self) -> Dict[str, Any]:
        """Tìm dữ liệu inline trong HTML (JSON embedded, data attributes)."""
        data = {
            'json_ld': [],
            'data_attributes': [],
            'inline_json': []
        }
        
        # JSON-LD
        for script in self.soup.find_all('script', type='application/ld+json'):
            if script.string:
                data['json_ld'].append(script.string)
        
        # Data attributes
        for elem in self.soup.find_all(attrs={'data-chart': True}):
            data['data_attributes'].append({
                'tag': elem.name,
                'data-chart': elem.get('data-chart')
            })
        
        # Tìm JSON patterns trong inline scripts
        for script in self.soup.find_all('script'):
            if script.string:
                # Tìm var xxx = {...} hoặc const xxx = {...}
                json_patterns = re.findall(
                    r'(?:var|let|const)\s+(\w+)\s*=\s*(\{[^;]{50,}\})\s*;',
                    script.string, re.DOTALL
                )
                for name, json_str in json_patterns:
                    data['inline_json'].append({'name': name, 'preview': json_str[:500]})
        
        return data


class JSAnalyzer:
    """Phân tích JavaScript để tìm API endpoints."""
    
    def __init__(self, chart_id: str = ""):
        self.chart_id = chart_id
    
    def analyze_script(self, content: str, source: str = "") -> Dict[str, Any]:
        """Phân tích một script để tìm API calls."""
        result = {
            'source': source,
            'api_endpoints': [],
            'keywords_found': [],
            'suspicious_patterns': []
        }
        
        if not content:
            return result
        
        # Tìm API endpoints
        for pattern in API_PATTERNS:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if match and len(match) > 3:
                    result['api_endpoints'].append({
                        'url': match,
                        'pattern': pattern[:30]
                    })
        
        # Tìm keywords
        for kw in TUVI_KEYWORDS:
            if kw.lower() in content.lower():
                result['keywords_found'].append(kw)
        
        # Tìm chart_id cụ thể
        if self.chart_id and self.chart_id in content:
            result['keywords_found'].append(f'lid:{self.chart_id}')
            # Tìm context xung quanh
            idx = content.find(self.chart_id)
            context = content[max(0, idx-100):idx+100+len(self.chart_id)]
            result['suspicious_patterns'].append({
                'type': 'chart_id_reference',
                'context': context
            })
        
        # Tìm URL patterns đáng nghi
        url_patterns = re.findall(r'[\'"`](/[^\'"`\s]{5,})[\'"`]', content)
        for url in url_patterns:
            if any(kw in url.lower() for kw in ['api', 'ajax', 'core', 'data', 'chart', 'laso']):
                result['suspicious_patterns'].append({
                    'type': 'suspicious_url',
                    'url': url
                })
        
        return result
    
    def analyze_all(self, scripts: List[Dict]) -> List[Dict]:
        """Phân tích tất cả scripts."""
        results = []
        for script in scripts:
            content = script.get('content', '')
            src = script.get('src', '')
            if content or src:
                analysis = self.analyze_script(content, src or f"inline_{script['index']}")
                if analysis['api_endpoints'] or analysis['keywords_found']:
                    results.append(analysis)
        return results
