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
    title: "Bài học TikTok 01",
    url: "https://vt.tiktok.com/ZSCN6Q3G6/",
    category: "Bài học ngắn",
    source: "TikTok",
    author: "Thiên Ngân Tử",
    isFeatured: true,
  },
  {
    id: "tiktok-thien-ngan-tu-02",
    platform: "tiktok",
    title: "Bài học TikTok 02",
    url: "https://vt.tiktok.com/ZSCN6PnLM/",
    category: "Video",
    source: "TikTok",
    author: "Thiên Ngân Tử",
    isFeatured: true,
  },
];
