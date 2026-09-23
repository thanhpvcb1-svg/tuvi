// Gen URL cho nam sinh 26/10/1998 00:30 dương lịch

const canChi = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
const chi = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
const chiSlug = ['ti','suu','dan','mao','thin','ty','ngo','mui','than','dau','tuat','hoi'];
const canSlug = ['giap','at','binh','dinh','mau','ky','canh','tan','nham','quy'];

const year = 1998;
const month = 10;
const day = 26;
const hour = 0; // 00:30 = giờ Tý (23:00-01:00)
const gender = 'nam';
const calendar = 'duong';

// Tính Can Chi năm
const canIndex = (year - 4) % 10;
const chiIndex = (year - 4) % 12;

// Giờ Tý = index 0
const hourIndex = Math.floor(((hour + 1) % 24) / 2);
const gioSlug = chiSlug[hourIndex];

console.log('=== THÔNG TIN LÁ SỐ ===');
console.log(`Ngày sinh: ${day}/${month}/${year}`);
console.log(`Giờ sinh: 00:30 (Giờ ${chi[hourIndex]})`);
console.log(`Giới tính: ${gender}`);
console.log(`Lịch: ${calendar}`);
console.log(`Năm: ${canChi[canIndex]} ${chi[chiIndex]}`);
console.log('');

console.log('=== URL COHOC ===');

// URL để POST form
console.log('1. POST form đến:');
console.log('   https://tuvi.cohoc.net/lap-la-so-tu-vi.html');
console.log('');
console.log('   Form data:');
console.log(`   nam=${year}&thang=${month}&ngay=${day}&gio=${gioSlug}&gioitinh=1&lich=1&submit=Lập+lá+số`);
console.log('');

// URL trực tiếp (format Bắc Phái)
const directUrl = `https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-${gender}-${canSlug[canIndex]}-${chiSlug[chiIndex]}-thang-${month}-ngay-${day}-gio-${gioSlug}-${calendar}-${gender}.html`;
console.log('2. URL trực tiếp (có thể không hoạt động):');
console.log(`   ${directUrl}`);
console.log('');

// Fetch thử
console.log('=== ĐANG FETCH... ===');

const formData = new URLSearchParams();
formData.append('nam', year.toString());
formData.append('thang', month.toString());
formData.append('ngay', day.toString());
formData.append('gio', gioSlug);
formData.append('gioitinh', '1');
formData.append('lich', '1');
formData.append('submit', 'Lập lá số');

fetch('https://tuvi.cohoc.net/lap-la-so-tu-vi.html', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0',
  },
  body: formData.toString(),
}).then(res => {
  console.log('Status:', res.status);
  console.log('Final URL:', res.url);
  return res.text();
}).then(html => {
  // Tìm lid trong HTML
  const lidMatch = html.match(/-lid-(\d+)\.html/);
  if (lidMatch) {
    console.log('LID found:', lidMatch[1]);
    console.log('');
    console.log('=== URL CHÍNH THỨC ===');
    console.log(`https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-nam-${canSlug[canIndex]}-${chiSlug[chiIndex]}-thang-${month}-ngay-${day}-gio-${gioSlug}-${calendar}-${gender}-lid-${lidMatch[1]}.html`);
  } else {
    console.log('Không tìm thấy LID trong response');
    // Tìm title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      console.log('Title:', titleMatch[1]);
    }
  }
}).catch(err => {
  console.log('Error:', err.message);
});
