import type { ChartView } from "../lib/types";

function padDatePart(value: string) {
  return value.padStart(2, "0");
}

function formatDisplayDate(value: string | undefined) {
  if (!value) {
    return "";
  }

  const text = value.trim();
  const suffix = text.match(/\s*\(.+\)$/)?.[0] ?? "";
  const dateText = suffix ? text.slice(0, -suffix.length).trim() : text;
  const ymd = dateText.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  const dmy = dateText.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

  if (ymd) {
    return `${padDatePart(ymd[3])}/${padDatePart(ymd[2])}/${ymd[1]}${suffix}`;
  }

  if (dmy) {
    return `${padDatePart(dmy[1])}/${padDatePart(dmy[2])}/${dmy[3]}${suffix}`;
  }

  return text;
}

const HIDDEN = "******";

function maskValue(value: string | undefined, hide: boolean) {
  if (!hide || !value) return value;
  return HIDDEN;
}

type Props = {
  chart: ChartView;
  hidePersonalInfo?: boolean;
};

export default function ChartCenter({ chart, hidePersonalInfo = false }: Props) {
  const { profile } = chart;
  const bodyPalace = chart.palaces.find((palace) => palace.isBodyPalace);
  const anThanDisplay = bodyPalace?.name ?? profile.bodyPalaceBranch ?? "";
  const laiNhanDisplay = profile.laiNhanCung?.functionalPalace ?? "";
  const solarDate = formatDisplayDate(profile.solarDate);
  const lunarDate = formatDisplayDate(profile.lunarDate);
  const nguHanhBanMenh = profile.nguHanhBanMenh;
  const nguHanhBanMenhDisplay =
    nguHanhBanMenh?.napAm || nguHanhBanMenh?.hanh || profile.natalElementName || "";

  const hide = hidePersonalInfo;

  return (
    <div className="center-main">
      <div className="center-content">
        <p className="center-subtitle">Chương trình lập lá số Tử Vi</p>
        {/* Tiêu đề trang trí của bàn lá số - không phải heading của trang */}
        <p className="blue center-title">LÁ SỐ TỬ VI</p>

        <table className="profile">
          <tbody>
            <tr>
              <td>Họ tên</td>
              <td>{maskValue(profile.fullName, hide) || "Chưa nhập"}</td>
            </tr>
            <tr>
              <td>Dương lịch</td>
              <td>{maskValue(solarDate, hide)}</td>
            </tr>
            <tr>
              <td>Âm lịch</td>
              <td>{maskValue(lunarDate, hide)}</td>
            </tr>
            <tr>
              <td>Tứ trụ</td>
              <td>{maskValue(profile.chineseDate, hide)}</td>
            </tr>
            <tr>
              <td>Giới tính</td>
              <td>{maskValue(profile.yinYangLabel ?? profile.gender, hide)}</td>
            </tr>
            <tr>
              <td>Giờ sinh</td>
              <td>{maskValue(profile.birthTime, hide)}</td>
            </tr>
            <tr>
              <td>Mệnh</td>
              <td>{profile.natalElementName}</td>
            </tr>
            <tr>
              <td>Cục</td>
              <td>{profile.fiveElementsClass}</td>
            </tr>
            <tr>
              <td>Mệnh chủ</td>
              <td>{profile.soul}</td>
            </tr>
            <tr>
              <td>Thân chủ</td>
              <td>{profile.body}</td>
            </tr>
            <tr>
              <td>An Thân</td>
              <td>{anThanDisplay}</td>
            </tr>
            <tr>
              <td>Lai Nhân Cung</td>
              <td>{laiNhanDisplay}</td>
            </tr>
            {nguHanhBanMenhDisplay ? (
              <tr>
                <td>Ngũ hành bản mệnh</td>
                <td>{nguHanhBanMenhDisplay}</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {profile.yinYangStatus ? <div className="note">{profile.yinYangStatus}</div> : null}
        {profile.elementalStatus ? <div className="note">{profile.elementalStatus}</div> : null}
      </div>
    </div>
  );
}
