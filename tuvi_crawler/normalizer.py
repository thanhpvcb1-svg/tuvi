"""Normalizer module - Chuẩn hóa dữ liệu lá số tử vi."""
import re
from typing import Any, Dict, List, Optional

# Keywords để scoring chart candidates
PALACE_KEYWORDS = [
    'Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc',
    'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ',
    'menh', 'phuMau', 'phucDuc', 'dienTrach', 'quanLoc', 'noBoc',
    'thienDi', 'tatAch', 'taiBach', 'tuTuc', 'phuThe', 'huynhDe'
]

STAR_KEYWORDS = [
    'Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh',
    'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương',
    'Thất Sát', 'Phá Quân', 'Văn Xương', 'Văn Khúc', 'Tả Phụ', 'Hữu Bật',
    'Thiên Khôi', 'Thiên Việt', 'Lộc Tồn', 'Kình Dương', 'Đà La', 'Hỏa Tinh',
    'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Thiên Mã'
]

PALACE_MAP = {
    'Mệnh': 'menh', 'menh': 'menh',
    'Phụ Mẫu': 'phu_mau', 'phuMau': 'phu_mau',
    'Phúc Đức': 'phuc_duc', 'phucDuc': 'phuc_duc',
    'Điền Trạch': 'dien_trach', 'dienTrach': 'dien_trach',
    'Quan Lộc': 'quan_loc', 'quanLoc': 'quan_loc',
    'Nô Bộc': 'no_boc', 'noBoc': 'no_boc',
    'Thiên Di': 'thien_di', 'thienDi': 'thien_di',
    'Tật Ách': 'tat_ach', 'tatAch': 'tat_ach',
    'Tài Bạch': 'tai_bach', 'taiBach': 'tai_bach',
    'Tử Tức': 'tu_tuc', 'tuTuc': 'tu_tuc',
    'Phu Thê': 'phu_the', 'phuThe': 'phu_the',
    'Huynh Đệ': 'huynh_de', 'huynhDe': 'huynh_de',
    'Thân': 'than'
}


def score_chart_candidate(data: Any) -> int:
    """Tính điểm cho một response dựa trên keywords tử vi."""
    if data is None:
        return 0
    
    text = str(data)
    score = 0
    
    for kw in PALACE_KEYWORDS:
        if kw in text:
            score += 2
    
    for kw in STAR_KEYWORDS:
        if kw in text:
            score += 1
    
    return score


def is_chart_candidate(data: Any, threshold: int = 5) -> tuple[bool, int]:
    """Kiểm tra xem data có phải là chart candidate không."""
    score = score_chart_candidate(data)
    return score >= threshold, score


def extract_birth_info(data: Dict) -> Dict[str, Any]:
    """Trích xuất thông tin sinh từ data."""
    birth = {
        'gender': None,
        'year': None,
        'month': None,
        'day': None,
        'hour': None,
        'calendar': None
    }
    
    # Tìm các field phổ biến
    field_maps = {
        'gender': ['gender', 'gioiTinh', 'gioi_tinh', 'sex', 'nam_nu'],
        'year': ['year', 'nam', 'namSinh', 'nam_sinh', 'birthYear'],
        'month': ['month', 'thang', 'thangSinh', 'thang_sinh', 'birthMonth'],
        'day': ['day', 'ngay', 'ngaySinh', 'ngay_sinh', 'birthDay'],
        'hour': ['hour', 'gio', 'gioSinh', 'gio_sinh', 'birthHour'],
        'calendar': ['calendar', 'lich', 'loaiLich', 'calendarType']
    }
    
    def search_nested(obj: Any, keys: List[str]) -> Any:
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k.lower() in [key.lower() for key in keys]:
                    return v
                result = search_nested(v, keys)
                if result is not None:
                    return result
        elif isinstance(obj, list):
            for item in obj:
                result = search_nested(item, keys)
                if result is not None:
                    return result
        return None
    
    for field, keys in field_maps.items():
        value = search_nested(data, keys)
        if value is not None:
            birth[field] = value
    
    return birth


def extract_palaces(data: Dict) -> Dict[str, Any]:
    """Trích xuất thông tin 12 cung."""
    chart = {
        'menh': {}, 'phu_mau': {}, 'phuc_duc': {}, 'dien_trach': {},
        'quan_loc': {}, 'no_boc': {}, 'thien_di': {}, 'tat_ach': {},
        'tai_bach': {}, 'tu_tuc': {}, 'phu_the': {}, 'huynh_de': {}
    }
    
    def search_palaces(obj: Any, path: str = ""):
        if isinstance(obj, dict):
            for k, v in obj.items():
                normalized_key = PALACE_MAP.get(k)
                if normalized_key and normalized_key in chart:
                    chart[normalized_key] = v
                else:
                    search_palaces(v, f"{path}.{k}")
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                search_palaces(item, f"{path}[{i}]")
    
    search_palaces(data)
    return chart


def extract_stars(data: Dict) -> List[Dict]:
    """Trích xuất danh sách sao."""
    stars = []
    
    def search_stars(obj: Any):
        if isinstance(obj, dict):
            # Kiểm tra nếu object này là một sao
            for kw in STAR_KEYWORDS:
                if any(kw in str(v) for v in obj.values()):
                    stars.append(obj)
                    return
            for v in obj.values():
                search_stars(v)
        elif isinstance(obj, list):
            for item in obj:
                search_stars(item)
    
    search_stars(data)
    return stars[:100]  # Giới hạn


def normalize_chart(data: Dict, chart_id: str, source: str) -> Dict[str, Any]:
    """Chuẩn hóa dữ liệu lá số."""
    return {
        'chart_id': chart_id,
        'source': source,
        'birth': extract_birth_info(data),
        'chart': extract_palaces(data),
        'stars': extract_stars(data),
        'transformations': [],
        'palace_stems': [],
        'great_limits': [],
        'annual_limits': [],
        '_raw_structure': list(data.keys()) if isinstance(data, dict) else type(data).__name__
    }


def analyze_json_structure(data: Any, max_depth: int = 3) -> Dict[str, Any]:
    """Phân tích cấu trúc JSON để hiểu schema."""
    def analyze(obj: Any, depth: int = 0) -> Any:
        if depth > max_depth:
            return "..."
        
        if isinstance(obj, dict):
            return {k: analyze(v, depth + 1) for k, v in list(obj.items())[:20]}
        elif isinstance(obj, list):
            if len(obj) > 0:
                return [analyze(obj[0], depth + 1), f"... ({len(obj)} items)"]
            return []
        elif isinstance(obj, str):
            return f"str({len(obj)})" if len(obj) > 50 else obj
        elif isinstance(obj, (int, float)):
            return obj
        elif obj is None:
            return None
        else:
            return type(obj).__name__
    
    return analyze(data)
