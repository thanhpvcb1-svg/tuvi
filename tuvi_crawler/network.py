"""Network module - Network interception và analysis."""
import json
import re
from typing import Any, Dict, List, Callable, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime

@dataclass
class RequestInfo:
    """Thông tin một request."""
    id: int
    method: str
    url: str
    resource_type: str
    headers: Dict[str, str]
    post_data: Optional[str] = None
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

@dataclass
class ResponseInfo:
    """Thông tin một response."""
    request_id: int
    status: int
    url: str
    content_type: str
    headers: Dict[str, str]
    body: Any = None
    body_size: int = 0
    saved_file: str = ""
    is_json: bool = False
    is_chart_candidate: bool = False
    chart_score: int = 0
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

@dataclass
class RedirectInfo:
    """Thông tin redirect."""
    from_url: str
    to_url: str
    status: int
    timestamp: str = ""

@dataclass
class CookieInfo:
    """Thông tin cookie."""
    name: str
    value: str
    domain: str
    path: str = "/"
    secure: bool = False
    http_only: bool = False

@dataclass
class NetworkCapture:
    """Tổng hợp network capture."""
    requests: List[RequestInfo] = field(default_factory=list)
    responses: List[ResponseInfo] = field(default_factory=list)
    redirects: List[RedirectInfo] = field(default_factory=list)
    cookies: List[CookieInfo] = field(default_factory=list)
    failed_requests: List[Dict] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            'requests': [asdict(r) for r in self.requests],
            'responses': [{k: v for k, v in asdict(r).items() if k != 'body'} for r in self.responses],
            'redirects': [asdict(r) for r in self.redirects],
            'cookies': [asdict(c) for c in self.cookies],
            'failed_requests': self.failed_requests,
            'summary': {
                'total_requests': len(self.requests),
                'total_responses': len(self.responses),
                'redirects': len(self.redirects),
                'json_responses': sum(1 for r in self.responses if r.is_json),
                'chart_candidates': sum(1 for r in self.responses if r.is_chart_candidate)
            }
        }


class NetworkInterceptor:
    """Quản lý network interception cho Playwright."""
    
    # Keywords ưu tiên trong URL
    PRIORITY_KEYWORDS = ['api', 'ajax', 'core', 'chart', 'tuvi', 'la-so', 'laso', 'data', 'json']
    
    def __init__(self, chart_id: str = "", debug: bool = False):
        self.chart_id = chart_id
        self.debug = debug
        self.capture = NetworkCapture()
        self._request_counter = 0
        self._request_map: Dict[str, int] = {}  # url -> request_id
    
    def _log(self, tag: str, message: str):
        if self.debug:
            print(f"[{tag}] {message}")
    
    def _is_priority_url(self, url: str) -> bool:
        url_lower = url.lower()
        return any(kw in url_lower for kw in self.PRIORITY_KEYWORDS)
    
    def _get_request_id(self, url: str) -> int:
        if url not in self._request_map:
            self._request_counter += 1
            self._request_map[url] = self._request_counter
        return self._request_map[url]
    
    async def on_request(self, request):
        """Handler cho request event."""
        self._request_counter += 1
        req_id = self._request_counter
        self._request_map[request.url] = req_id
        
        headers = dict(request.headers) if request.headers else {}
        post_data = None
        try:
            post_data = request.post_data
        except:
            pass
        
        req_info = RequestInfo(
            id=req_id,
            method=request.method,
            url=request.url,
            resource_type=request.resource_type,
            headers=headers,
            post_data=post_data
        )
        self.capture.requests.append(req_info)
        
        # Log
        priority = "⭐" if self._is_priority_url(request.url) else ""
        self._log("REQUEST", f"{priority} {request.method} {request.url[:100]} [{request.resource_type}]")
        if post_data:
            self._log("POST-DATA", post_data[:200])
    
    async def on_response(self, response):
        """Handler cho response event."""
        url = response.url
        req_id = self._request_map.get(url, 0)
        
        headers = dict(response.headers) if response.headers else {}
        content_type = headers.get('content-type', '')
        
        # Lấy body
        body = None
        body_size = 0
        is_json = False
        
        try:
            body_bytes = await response.body()
            body_size = len(body_bytes)
            
            if 'json' in content_type or 'javascript' in content_type:
                try:
                    body_text = body_bytes.decode('utf-8')
                    # Thử parse JSON
                    if body_text.strip().startswith(('{', '[')):
                        body = json.loads(body_text)
                        is_json = True
                    else:
                        body = body_text
                except:
                    body = body_bytes
            elif 'text' in content_type or 'html' in content_type:
                try:
                    body = body_bytes.decode('utf-8')
                except:
                    body = body_bytes
            else:
                body = body_bytes
        except Exception as e:
            self._log("RESPONSE-ERROR", f"Cannot get body: {e}")
        
        resp_info = ResponseInfo(
            request_id=req_id,
            status=response.status,
            url=url,
            content_type=content_type,
            headers=headers,
            body=body,
            body_size=body_size,
            is_json=is_json
        )
        self.capture.responses.append(resp_info)
        
        # Log
        json_tag = "📦JSON" if is_json else ""
        priority = "⭐" if self._is_priority_url(url) else ""
        self._log("RESPONSE", f"{priority}{json_tag} {response.status} {url[:100]} [{content_type[:30]}] {body_size}B")
    
    async def on_request_failed(self, request):
        """Handler cho request failed."""
        self.capture.failed_requests.append({
            'url': request.url,
            'method': request.method,
            'failure': str(request.failure) if hasattr(request, 'failure') else 'unknown',
            'timestamp': datetime.now().isoformat()
        })
        self._log("FAILED", f"{request.method} {request.url}")
    
    def add_redirect(self, from_url: str, to_url: str, status: int = 302):
        """Ghi nhận redirect."""
        redirect = RedirectInfo(from_url=from_url, to_url=to_url, status=status)
        self.capture.redirects.append(redirect)
        self._log("REDIRECT", f"{from_url} -> {to_url}")
    
    def add_cookies(self, cookies: List[Dict]):
        """Thêm cookies từ browser."""
        for c in cookies:
            cookie = CookieInfo(
                name=c.get('name', ''),
                value=c.get('value', ''),
                domain=c.get('domain', ''),
                path=c.get('path', '/'),
                secure=c.get('secure', False),
                http_only=c.get('httpOnly', False)
            )
            self.capture.cookies.append(cookie)
            self._log("COOKIE", f"{cookie.name}={cookie.value[:50]}... [{cookie.domain}]")
    
    def get_json_responses(self) -> List[ResponseInfo]:
        """Lấy tất cả JSON responses."""
        return [r for r in self.capture.responses if r.is_json]
    
    def get_priority_responses(self) -> List[ResponseInfo]:
        """Lấy responses từ priority URLs."""
        return [r for r in self.capture.responses if self._is_priority_url(r.url)]
    
    def find_chart_data(self, score_func: Callable) -> List[ResponseInfo]:
        """Tìm responses có thể chứa chart data."""
        candidates = []
        for resp in self.capture.responses:
            if resp.body and resp.is_json:
                is_candidate, score = score_func(resp.body)
                if is_candidate:
                    resp.is_chart_candidate = True
                    resp.chart_score = score
                    candidates.append(resp)
        return sorted(candidates, key=lambda x: x.chart_score, reverse=True)
    
    def get_api_candidates(self) -> List[Dict]:
        """Lấy danh sách API candidates."""
        candidates = []
        for req in self.capture.requests:
            if self._is_priority_url(req.url) or req.resource_type in ['xhr', 'fetch']:
                candidates.append({
                    'method': req.method,
                    'url': req.url,
                    'type': req.resource_type,
                    'has_post_data': bool(req.post_data)
                })
        return candidates
    
    def detect_tokens(self) -> List[Dict]:
        """Phát hiện tokens trong requests/responses."""
        tokens = []
        token_patterns = [
            (r'token["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_-]{20,})', 'token'),
            (r'nonce["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_-]{10,})', 'nonce'),
            (r'session["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_-]{20,})', 'session'),
            (r'csrf["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_-]{20,})', 'csrf'),
        ]
        
        # Tìm trong responses
        for resp in self.capture.responses:
            if isinstance(resp.body, str):
                for pattern, token_type in token_patterns:
                    matches = re.findall(pattern, resp.body, re.IGNORECASE)
                    for match in matches:
                        tokens.append({
                            'type': token_type,
                            'value': match[:50],
                            'source': resp.url[:100]
                        })
        
        return tokens
