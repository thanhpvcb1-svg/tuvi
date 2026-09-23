export type SourceRef = {
  title: string;
  href?: string;
  note: string;
};

export type KnowledgeContentBlock = {
  heading: string;
  body: string;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  readingTime: string;
  summary: string;
  curiosityHook: string;
  tags: string[];
  sourceRefs: SourceRef[];
  content: KnowledgeContentBlock[];
  applicationBox: {
    title: string;
    body: string;
  };
  cta: {
    label: string;
    href: string;
  };
};

export const getKnowledgeArticleHref = (slug: string) => `/bai-viet/${slug}`;

const sourceRefs = {
  tuViToanThu: {
    title: "Tử Vi Đẩu Số Toàn Thư / 紫微斗數全書",
    href: "https://zh.wikisource.org/wiki/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8",
    note: "Bản Hán văn dùng làm nền cho cách gọi sao, an cung và hệ Tứ Hóa theo thiên can năm sinh.",
  },
  wikiVi: {
    title: "Tử vi đẩu số - Wikipedia tiếng Việt",
    href: "https://vi.wikipedia.org/wiki/T%E1%BB%AD_vi_%C4%91%E1%BA%A9u_s%E1%BB%91",
    note: "Dùng cho đoạn dẫn nhập khái quát, phạm vi khái niệm và vị trí của Tử Vi trong hệ thuật số Đông Á.",
  },
  wikiZh: {
    title: "紫微斗数 - 维基百科",
    href: "https://zh.wikipedia.org/wiki/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B0",
    note: "Dùng để đối chiếu thuật ngữ Hán văn, thứ tự an cung, an sao, Tứ Hóa và đại vận, lưu niên.",
  },
  modernOverview: {
    title: "Zi Wei Dou Shu - English overview citing Ho Peng Yoke, Chinese Mathematical Astrology (Routledge, 2003)",
    href: "https://en.wikipedia.org/wiki/Zi_Wei_Dou_Shu",
    note: "Dùng như tài liệu diễn giải hiện đại cho Four Transformations, Flying Star School và khung đại vận, lưu niên.",
  },
  hoaLoc: {
    title: "化祿 - 維基百科",
    href: "https://zh.wikipedia.org/wiki/%E5%8C%96%E7%A5%BF",
    note: "Dùng để đối chiếu cách gọi, danh sách thiên can sinh Hóa Lộc và sắc thái cát tính căn bản.",
  },
  hoaQuyen: {
    title: "化權 - 維基百科",
    href: "https://zh.wikipedia.org/wiki/%E5%8C%96%E6%AC%8A",
    note: "Dùng để đối chiếu danh sách thiên can sinh Hóa Quyền và nghĩa thiên về quyền năng, thế phát động.",
  },
  hoaKhoa: {
    title: "化科 - 維基百科",
    href: "https://zh.wikipedia.org/wiki/%E5%8C%96%E7%A7%91",
    note: "Dùng để đối chiếu danh sách thiên can sinh Hóa Khoa và nghĩa thiên về danh dự, học thuật, tín nhiệm.",
  },
  hoaKy: {
    title: "化忌 - 維基百科",
    href: "https://zh.wikipedia.org/wiki/%E5%8C%96%E5%BF%8C",
    note: "Dùng để đối chiếu danh sách thiên can sinh Hóa Kỵ và sắc thái tắc trở, vướng mắc, chỗ cần thận trọng.",
  },
  internalPhiHoa: {
    title: "Tài liệu biên soạn nội bộ: bộ ghi chú Bắc Phái và Phi Hóa của website",
    note: "Tài liệu biên soạn nội bộ, cần bổ sung nguồn gốc khi xuất bản công khai.",
  },
};

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: "bac-phai-overview",
    title: "Tử Vi Bắc Phái là gì?",
    slug: "tu-vi-bac-phai-la-gi",
    category: "Nhập môn",
    level: "Sơ nhập",
    readingTime: "7 phút",
    summary: "Bài mở cửa cho người mới: Bắc Phái là lối đọc nhấn vào can cung, Tứ Hóa và sự vận động của các cung chứ không chỉ nhìn tĩnh vào bộ sao.",
    curiosityHook: "Nếu cùng một lá số mà có người chỉ nhìn sao, có người lại đi theo đường phi hóa, thì khác biệt ấy bắt đầu từ đâu?",
    tags: ["Bắc Phái", "Nhập môn", "Can cung", "Phi Hóa"],
    sourceRefs: [sourceRefs.tuViToanThu, sourceRefs.wikiVi, sourceRefs.wikiZh, sourceRefs.modernOverview],
    content: [
      {
        heading: "Từ khái quát đến trường phái",
        body:
          "Tử Vi Đẩu Số vốn là một hệ thống luận mệnh nhiều lớp, trong đó mệnh bàn được cấu thành bởi mười hai cung, các sao chính tinh, phụ tinh và những quy tắc an sao gắn với thiên can, địa chi, ngày giờ sinh. Trong dòng vận hành hiện đại, Bắc Phái thường được người học nhắc tới như một lối đọc chú trọng hơn vào can cung, Tứ Hóa Phi Tinh, đại vận và lưu niên.\n\nNói gọn, nếu lối đọc truyền thống thiên về bố cục sao và tam phương tứ chính, thì Bắc Phái nhấn mạnh thêm vào sự vận động: sao nào hóa, hóa vào đâu, từ đâu phi sang và trong thời vận nào thì mối liên hệ ấy nổi rõ nhất.",
      },
      {
        heading: "Bắc Phái không phải là lời phán tuyệt đối",
        body:
          "Điểm mạnh của Bắc Phái là giúp người học thấy mạch động trong lá số: chỗ nào là nguồn phát, chỗ nào là nơi tiếp nhận, chỗ nào mở ra, chỗ nào vướng lại. Nhưng đó vẫn là một hệ quy chiếu biểu tượng. Nó hữu ích nhất khi dùng để đặt câu hỏi đúng, nhận diện xu hướng và đối chiếu với đời sống thật.\n\nVì vậy, trong cách trình bày của thư viện này, Bắc Phái được giới thiệu như một hệ tư duy có quy tắc, không phải một thứ khẳng định cứng rằng đời người nhất định sẽ diễn ra theo một đường duy nhất.",
      },
      {
        heading: "Vì sao người mới nên bắt đầu từ Bắc Phái",
        body:
          "Với người mới, Bắc Phái có một ưu điểm khá đặc biệt: nó buộc người đọc phải nhìn quan hệ giữa các cung thay vì dừng ở việc thuộc lòng ý nghĩa từng sao. Một mệnh bàn vì thế bớt cảm giác rời rạc. Khi đã quen với cách nhìn này, bạn sẽ đọc đại vận, lưu niên và Tứ Hóa có trật tự hơn, biết nên ưu tiên xem cung nào trước, xem mạch nào sau.",
      },
    ],
    applicationBox: {
      title: "Ứng dụng vào lá số",
      body:
        "Khi mở một lá số, hãy thử bỏ qua phán đoán nhanh kiểu “sao này tốt, sao kia xấu”. Thay vào đó, hãy xác định Mệnh, Quan, Tài, Phúc rồi nhìn xem Tứ Hóa từ thiên can năm sinh đi về đâu. Đó là bước đầu để chuyển từ đọc sao sang đọc mạch.",
    },
    cta: {
      label: "Lập lá số để xem can cung và Tứ Hóa",
      href: "/lap-la-so",
    },
  },
  {
    id: "tu-hoa-phi-tinh",
    title: "Tứ Hóa Phi Tinh là gì?",
    slug: "tu-hoa-phi-tinh-la-gi",
    category: "Tứ Hóa Phi Tinh",
    level: "Căn bản",
    readingTime: "8 phút",
    summary: "Tứ Hóa là bốn trạng thái Lộc, Quyền, Khoa, Kỵ được gắn cho sao theo thiên can, rồi từ đó tạo nên mạch phi hóa giữa các cung.",
    curiosityHook: "Cùng là sao cũ, nhưng khi gặp đúng thiên can, vì sao nó lại đổi vai và kéo cả mệnh bàn chuyển động?",
    tags: ["Tứ Hóa", "Phi Tinh", "Thiên can", "Lộc Quyền Khoa Kỵ"],
    sourceRefs: [sourceRefs.tuViToanThu, sourceRefs.wikiZh, sourceRefs.modernOverview, sourceRefs.internalPhiHoa],
    content: [
      {
        heading: "Tứ Hóa là bốn nhãn động của lá số",
        body:
          "Trong cách hiểu thông dụng của Bắc Phái, Tứ Hóa gồm Hóa Lộc, Hóa Quyền, Hóa Khoa và Hóa Kỵ. Chúng không phải bốn sao độc lập sinh ra ngoài hệ sao, mà là bốn trạng thái biến hóa được gắn vào một số sao nhất định theo thiên can.\n\nKhi một sao nhận Hóa, ý nghĩa của sao ấy không mất đi, nhưng nó được đẩy mạnh theo một chiều riêng: Lộc thiên về mở dòng lợi ích, Quyền thiên về lực điều động, Khoa thiên về danh tín và sự sáng tỏ, còn Kỵ thiên về chỗ mắc, chỗ nghẽn, chỗ phải trả giá bằng kinh nghiệm.",
      },
      {
        heading: "Vì sao gọi là Phi Tinh",
        body:
          "Chữ “phi” trong Phi Tinh gợi ý một động tác chuyển mạch. Người học không chỉ hỏi “sao nào hóa”, mà còn hỏi “hóa từ cung nào đi sang cung nào”. Chính bước này làm nên cảm giác động của Bắc Phái: mỗi Tứ Hóa là một đầu mối quan hệ, nối cung phát với cung nhận.\n\nBởi vậy, xem Tứ Hóa Phi Tinh không dừng ở tên gọi cát hay hung. Điều quan trọng hơn là đường đi của nó, và đường đi ấy tác động lên chủ đề nào của đời sống.",
      },
      {
        heading: "Tứ Hóa giúp đọc vận như thế nào",
        body:
          "Khi bước vào đại vận hoặc lưu niên, mệnh bàn không còn là một ảnh tĩnh. Những cung được kích hoạt bởi Tứ Hóa thường là nơi đời sống phát sinh sự kiện, áp lực hoặc cơ hội. Nói cách khác, Tứ Hóa không chỉ dùng để “miêu tả tính cách”, mà còn giúp người đọc theo dõi nơi mệnh bàn bắt đầu chuyển động mạnh nhất theo từng giai đoạn.",
      },
    ],
    applicationBox: {
      title: "Ứng dụng vào lá số",
      body:
        "Nếu bạn đã có lá số, hãy xác định bốn Hóa năm sinh trước. Sau đó nối từng Hóa từ sao phát ra tới cung mà sao đó đang tọa thủ. Chỉ riêng thao tác này đã giúp bạn nhìn được trục ưu tiên của mệnh bàn.",
    },
    cta: {
      label: "Mở lá số và xem Tứ Hóa của tôi",
      href: "/lap-la-so",
    },
  },
  {
    id: "loc-quyen-khoa-ky",
    title: "Lộc – Quyền – Khoa – Kỵ có ý nghĩa gì?",
    slug: "loc-quyen-khoa-ky-co-y-nghia-gi",
    category: "Tứ Hóa Phi Tinh",
    level: "Căn bản",
    readingTime: "9 phút",
    summary: "Bốn Hóa không nên hiểu đơn giản là tốt ba, xấu một. Mỗi Hóa là một kiểu vận động riêng, mang giá trị lẫn cái giá của nó.",
    curiosityHook: "Nếu Hóa Kỵ không chỉ là điều xấu, và Hóa Lộc cũng chưa chắc luôn dễ chịu, thì nên đọc bốn Hóa theo cách nào?",
    tags: ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"],
    sourceRefs: [sourceRefs.tuViToanThu, sourceRefs.hoaLoc, sourceRefs.hoaQuyen, sourceRefs.hoaKhoa, sourceRefs.hoaKy],
    content: [
      {
        heading: "Hóa Lộc: nơi khí bắt đầu lưu thông",
        body:
          "Lộc thường được hiểu là lợi, là sự mở dòng, là thứ khiến một cung có xu hướng dễ sinh thành, dễ nảy nở, dễ thu hút nguồn lực. Nhưng Lộc không chỉ là tiền. Trong nhiều lá số, Lộc còn là độ thuận tay, là cảm giác việc này làm được, mối này kết được, cơ hội này dễ đến.\n\nTuy nhiên, một dòng mở quá mạnh mà không có cấu trúc đi kèm cũng có thể sinh tản khí. Vì thế Hóa Lộc tốt hay không còn tùy nó mở ở cung nào và có đi cùng Hóa khác hay không.",
      },
      {
        heading: "Hóa Quyền và Hóa Khoa: lực điều động và lực chính danh",
        body:
          "Quyền thiên về thế phát động, quyền chủ động, năng lực quyết định hay buộc sự việc phải dịch chuyển. Nó hợp với những chỗ cần cầm trịch, nhưng cũng có thể làm tăng áp lực va chạm nếu rơi vào cung vốn bất ổn.\n\nKhoa thì mềm hơn. Khoa thường gắn với danh tín, khả năng được nhìn nhận, tính minh bạch, học thuật, giấy tờ, tiếng nói có trọng lượng. Trong nhiều trường hợp, Khoa không làm sự việc bùng lên nhanh như Quyền, nhưng giúp nó có chỗ đứng bền hơn.",
      },
      {
        heading: "Hóa Kỵ: điểm mắc để thấy chỗ phải học",
        body:
          "Kỵ thường bị đọc quá nhanh như một dấu xấu. Thực ra, Kỵ là nơi mệnh bàn phải dừng lại, va vào giới hạn, thấy rõ nợ nần, ràng buộc, ám ảnh hoặc khúc mắc chưa giải. Chính vì vậy, Kỵ rất quan trọng: nó cho biết chỗ nào không thể chỉ tiến bằng ý chí mà phải đổi cách nhìn hoặc đổi cách làm.\n\nMột lá số có Kỵ không có nghĩa là thất bại. Nó chỉ nói rằng có một chủ đề cần đi chậm, đi kỹ và đi bằng ý thức hơn người khác.",
      },
    ],
    applicationBox: {
      title: "Ứng dụng vào lá số",
      body:
        "Thử ghi bốn chữ ngắn bên cạnh bốn Hóa của bạn: Lộc là “mở”, Quyền là “đẩy”, Khoa là “sáng”, Kỵ là “mắc”. Khi nhìn vào từng cung, bạn sẽ dễ cảm được chủ đề nào đang được mở ra và chủ đề nào cần xử lý cẩn trọng hơn.",
    },
    cta: {
      label: "Đối chiếu Lộc Quyền Khoa Kỵ trên lá số",
      href: "/lap-la-so",
    },
  },
  {
    id: "phi-nhap-phi-xuat",
    title: "Phi nhập và phi xuất là gì?",
    slug: "phi-nhap-va-phi-xuat-la-gi",
    category: "Phi Hóa",
    level: "Trung cấp",
    readingTime: "8 phút",
    summary: "Phi nhập và phi xuất giúp người học nhìn được dòng trao đổi giữa các cung: cung nào phát ý, cung nào lĩnh ý, cung nào tiêu hao lực.",
    curiosityHook: "Có khi nào một cung nhìn rất mạnh, nhưng vì luôn phi xuất nên rốt cuộc lại là nơi hao tâm hao lực?",
    tags: ["Phi nhập", "Phi xuất", "Quan hệ cung", "Bắc Phái"],
    sourceRefs: [sourceRefs.tuViToanThu, sourceRefs.wikiZh, sourceRefs.internalPhiHoa],
    content: [
      {
        heading: "Phi nhập: tín hiệu đi vào một cung",
        body:
          "Khi nói một Hóa phi nhập vào cung nào đó, người đọc đang xác định cung ấy là nơi tiếp nhận tác động. Tác động đó có thể là lợi, quyền, danh, hoặc vướng mắc tùy loại Hóa. Nhờ phi nhập, một cung không còn là ô đứng yên, mà trở thành nơi bị tác động bởi quan hệ với cung khác.\n\nĐọc đúng phi nhập giúp ta bớt rơi vào lối nhìn tách rời. Một cung Tài chẳng hạn, không chỉ đọc bằng sao trong cung Tài, mà còn phải xem những gì đang bay vào cung ấy.",
      },
      {
        heading: "Phi xuất: nơi phát lực và nơi tiêu lực",
        body:
          "Phi xuất cho biết một cung đang phát động ảnh hưởng ra ngoài. Nó giống như nơi phát lời, phát ý, phát lực, phát nhu cầu. Có những cung phi xuất rất đẹp, vì nó giúp tài năng được đưa ra đúng chỗ. Nhưng cũng có những trường hợp phi xuất liên tục khiến chính cung phát lực bị hao.\n\nDo đó, phi xuất không mặc nhiên tốt hay xấu. Nó chỉ cho biết chiều vận động: từ đây đi đâu, vì chuyện gì, và cái giá nằm ở đâu.",
      },
      {
        heading: "Đọc phi nhập và phi xuất cùng nhau",
        body:
          "Sai lầm phổ biến của người mới là chỉ nhớ cung nhận mà quên cung phát, hoặc ngược lại. Thực ra, hai đầu phải được đọc cùng nhau. Cung phát cho biết động cơ, cung nhận cho biết mặt đời sống chịu ảnh hưởng. Khi ghép hai đầu, bạn mới thấy câu chuyện trọn vẹn của một đường phi hóa.",
      },
    ],
    applicationBox: {
      title: "Ứng dụng vào lá số",
      body:
        "Chọn một Hóa Kỵ trong lá số của bạn. Hãy hỏi ba câu: nó phát từ cung nào, nhập vào cung nào, và chủ đề của hai cung ấy có quan hệ gì trong đời thật. Chỉ một đường như vậy đã đủ để luyện cách đọc Bắc Phái theo quan hệ thay vì theo từng ô riêng lẻ.",
    },
    cta: {
      label: "Mở lá số để lần đường phi nhập, phi xuất",
      href: "/lap-la-so",
    },
  },
  {
    id: "tu-hoa",
    title: "Tự hóa là gì?",
    slug: "tu-hoa-la-gi",
    category: "Phi Hóa",
    level: "Trung cấp",
    readingTime: "7 phút",
    summary: "Tự hóa là tình huống một cung phát Hóa rồi lại quay trở lại chính chủ đề của cung ấy, tạo cảm giác tự xoay, tự khởi, tự vướng hoặc tự giải.",
    curiosityHook: "Vì sao có những chủ đề trong đời cứ lặp lại như tự mình châm ngòi cho chính mình?",
    tags: ["Tự hóa", "Phi Hóa", "Cung tự động", "Bắc Phái"],
    sourceRefs: [sourceRefs.tuViToanThu, sourceRefs.internalPhiHoa, sourceRefs.modernOverview],
    content: [
      {
        heading: "Tự hóa không chỉ là kỹ thuật, mà là nhịp lặp",
        body:
          "Trong nhiều cách giảng hiện đại của Bắc Phái, tự hóa thường được dùng để chỉ trường hợp một cung phát Hóa mà mạch ý lại quy về chính cung đó hoặc chủ đề của chính nó. Khi ấy, năng lượng không tản rộng ra ngoài nhiều, mà có xu hướng tự xoay vòng, tự đẩy, tự cản, tự nuôi lớn một mẫu hành vi.\n\nBởi vậy, tự hóa thường gây ấn tượng rất rõ trong trải nghiệm sống: người đương số có thể thấy có những chuyện cứ lặp đi lặp lại ở cùng một chủ đề, dường như chính mình vừa là nguyên nhân, vừa là người chịu hệ quả.",
      },
      {
        heading: "Tự hóa Lộc, Quyền, Khoa, Kỵ đọc ra sao",
        body:
          "Tự hóa Lộc thường làm một cung tự sinh động, tự mở việc, tự hút nguồn lực. Tự hóa Quyền dễ tạo thế tự cầm lái, tự quyết, tự ép mình phải gánh. Tự hóa Khoa khiến chủ đề ấy cần được minh định, gọi tên, sửa sang cho có trật tự. Tự hóa Kỵ thì thường là chỗ dễ sinh nút thắt nội tâm, dễ ám ảnh, dễ tự nghi hoặc hoặc tự vướng.\n\nNhưng như mọi kỹ thuật khác, không nên tách tự hóa khỏi toàn cục. Một cung tự hóa mạnh mà được tam phương nâng đỡ sẽ rất khác với một cung vốn đã yếu mà lại tự hóa Kỵ.",
      },
      {
        heading: "Giá trị thực tế của việc nhận ra tự hóa",
        body:
          "Nhận ra tự hóa giúp người học có một công cụ tự quan sát rất tốt. Nó chỉ ra những nơi không thể chỉ đổ cho ngoại cảnh. Có lúc vấn đề nằm ở chính cơ chế phản ứng của mình: cách nhìn, cách giữ, cách cố, cách sợ, hoặc cách muốn quá mức. Ở nghĩa tốt, tự hóa cũng cho biết nơi nào nếu tu chỉnh đúng thì hiệu quả cải thiện sẽ rất nhanh, vì mạch lực vốn đã nằm ngay trong cung đó.",
      },
    ],
    applicationBox: {
      title: "Ứng dụng vào lá số",
      body:
        "Nếu bạn thấy một chủ đề trong đời mình cứ lặp lại với cùng kiểu căng thẳng hoặc cùng kiểu thúc đẩy, hãy ưu tiên kiểm tra các cung liên quan có dấu hiệu tự hóa hay không. Đây là điểm rất hợp để đem so lá số với trải nghiệm thật.",
    },
    cta: {
      label: "Xem lá số và đối chiếu dấu tự hóa",
      href: "/lap-la-so",
    },
  },
  {
    id: "dai-van-luu-nien-bac-phai",
    title: "Đại vận và lưu niên trong Bắc Phái",
    slug: "dai-van-va-luu-nien-trong-bac-phai",
    category: "Vận trình",
    level: "Căn bản",
    readingTime: "8 phút",
    summary: "Đại vận cho bối cảnh mười năm, lưu niên cho điểm nhấn từng năm. Trong Bắc Phái, hai lớp này được đọc cùng với Tứ Hóa để thấy chủ đề nào thật sự bị kích hoạt.",
    curiosityHook: "Vì sao cùng một cung trong bản mệnh, có lúc im như chưa hề có chuyện, có lúc lại trở thành trung tâm của cả năm?",
    tags: ["Đại vận", "Lưu niên", "Vận trình", "Tứ Hóa"],
    sourceRefs: [sourceRefs.tuViToanThu, sourceRefs.wikiZh, sourceRefs.modernOverview, sourceRefs.internalPhiHoa],
    content: [
      {
        heading: "Đại vận là bối cảnh, lưu niên là điểm gõ",
        body:
          "Trong cách đọc vận, đại vận thường được hiểu là lớp khí hậu dài hơn, cho biết mười năm ấy nghiêng về chủ đề nào, kiểu phát triển nào, và cung nào thường được đưa lên mặt tiền đời sống. Lưu niên thì nhỏ hơn, giống như tiếng gõ rõ vào từng năm: năm nào nổi chuyện, năm nào đổi hướng, năm nào phải thu xếp lại.\n\nNếu chỉ đọc lưu niên mà bỏ đại vận, người học dễ nhìn năm quá rời. Nếu chỉ đọc đại vận mà bỏ lưu niên, lại dễ thành lời nói quá rộng. Bắc Phái thường yêu cầu đọc cả hai lớp cùng lúc.",
      },
      {
        heading: "Tứ Hóa làm rõ nơi vận trình thật sự tác động",
        body:
          "Điểm thú vị của Bắc Phái là không để vận trình đứng một mình. Khi đại vận hoặc lưu niên tới, người đọc sẽ nhìn cùng Tứ Hóa để xác định cung nào chỉ được nhắc tên, và cung nào thật sự bị kích hoạt bởi mạch phi hóa. Chính nhờ vậy, việc đọc vận bớt cảm tính hơn.\n\nMột năm có thể rất ồn ở bề mặt, nhưng nếu không chạm mạch trọng yếu thì đôi khi chỉ là chuyển động ngoài viền. Ngược lại, có năm nhìn tưởng bình thường mà Tứ Hóa lại rơi đúng trục Mệnh - Quan - Tài - Phúc, khi ấy ảnh hưởng thường sâu hơn nhiều.",
      },
      {
        heading: "Đọc vận để chuẩn bị, không phải để sợ",
        body:
          "Giá trị tốt nhất của đại vận và lưu niên là giúp ta biết mình đang ở giai đoạn nào: nên mở, nên giữ, nên dồn lực, hay nên làm cho gọn. Một mệnh bàn không buộc người ta bất lực trước thời vận; nó chỉ cho thấy mùa nào hợp gieo, mùa nào hợp sửa đất. Đọc như vậy, vận trình mới có ích cho quyết định đời sống.",
      },
    ],
    applicationBox: {
      title: "Ứng dụng vào lá số",
      body:
        "Khi xem năm hiện tại, đừng chỉ hỏi “năm nay tốt hay xấu”. Hãy hỏi: đại vận đang đặt mình vào sân nào, lưu niên đang gõ vào cung nào, và Tứ Hóa đang làm mạch nào sáng lên. Câu hỏi tốt sẽ cho một cách đọc vận tốt hơn.",
    },
    cta: {
      label: "Lập lá số và xem năm đang vận hành",
      href: "/lap-la-so",
    },
  },
];

export const knowledgeCategories = Array.from(new Set(knowledgeArticles.map((article) => article.category)));
export const knowledgeLevels = Array.from(new Set(knowledgeArticles.map((article) => article.level)));

export const findKnowledgeArticleByPath = (pathname: string) => {
  return knowledgeArticles.find((article) => pathname === getKnowledgeArticleHref(article.slug)) ?? null;
};
