export type ManualVideoLesson = {
  id: string;
  platform: "tiktok";
  title: string;
  url: string;
  category: string;
  source: "TikTok";
  author: string;
  isFeatured: boolean;
};

export const manualVideoLessons: ManualVideoLesson[] = [
  {
    id: "tiktok-thien-ngan-tu-01",
    platform: "tiktok",
    title: "Bài học ngắn về cách đọc lá số",
    url: "https://vt.tiktok.com/ZSCN6Q3G6/",
    category: "Bài học ngắn",
    source: "TikTok",
    author: "Thiên Ngân Tử",
    isFeatured: true,
  },
  {
    id: "tiktok-thien-ngan-tu-02",
    platform: "tiktok",
    title: "Gợi ý đọc Tử Vi Bắc Phái cho người mới",
    url: "https://vt.tiktok.com/ZSCN6PnLM/",
    category: "Bài học ngắn",
    source: "TikTok",
    author: "Thiên Ngân Tử",
    isFeatured: true,
  },
];
