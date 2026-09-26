import { Link, useLocation } from "react-router-dom";

type BreadcrumbItem = {
  label: string;
  path?: string;
};

const routeLabels: Record<string, string> = {
  "/": "Trang chủ",
  "/lap-la-so": "Lập lá số",
  "/bang-gia": "Bảng giá",
  "/la-so-mau": "Lá số mẫu",
  "/bai-viet": "Bài viết",
  "/video": "Video",
  "/hop-tuoi": "Hợp tuổi",
  "/faq": "FAQ",
  "/lien-he": "Liên hệ",
  "/ve-chung-toi": "Về chúng tôi",
  "/dieu-khoan-su-dung": "Điều khoản",
  "/chinh-sach-bao-mat": "Chính sách bảo mật",
};

type Props = {
  items?: BreadcrumbItem[];
  className?: string;
};

export default function Breadcrumb({ items, className = "" }: Props) {
  const location = useLocation();
  
  // Auto-generate breadcrumb from current path if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const result: BreadcrumbItem[] = [{ label: "Trang chủ", path: "/" }];
    
    let currentPath = "";
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const label = routeLabels[currentPath] || segment.replace(/-/g, " ");
      result.push({ label, path: currentPath });
    }
    
    // Last item has no path (current page)
    if (result.length > 1) {
      result[result.length - 1].path = undefined;
    }
    
    return result;
  })();

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav className={`breadcrumb ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumb-list" itemScope itemType="https://schema.org/BreadcrumbList">
        {breadcrumbItems.map((item, index) => (
          <li
            key={index}
            className="breadcrumb-item"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {item.path ? (
              <Link to={item.path} itemProp="item">
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span itemProp="name" aria-current="page">{item.label}</span>
            )}
            <meta itemProp="position" content={String(index + 1)} />
            {index < breadcrumbItems.length - 1 && (
              <span className="breadcrumb-separator" aria-hidden="true">›</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
