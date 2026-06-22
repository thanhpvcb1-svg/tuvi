import React from "react";
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

export default function ChartCenter({ chart }: { chart: ChartView }) {
  const { profile } = chart;
  const bodyPalace = chart.palaces.find((palace) => palace.isBodyPalace);
  const anThanDisplay = bodyPalace?.name ?? profile.bodyPalaceBranch ?? "";
  const laiNhanDisplay = profile.laiNhanCung?.functionalPalace ?? "";
  const solarDate = formatDisplayDate(profile.solarDate);
  const lunarDate = formatDisplayDate(profile.lunarDate);

  return (
    <div className="center-main">
      <div className="center-content">
        <p className="center-subtitle">Chương trình lập lá số Tử Vi</p>
        <h2 className="blue">LÁ SỐ TỬ VI</h2>

        <table className="profile">
          <tbody>
            <tr>
              <td>Họ tên</td>
              <td>{profile.fullName || "Chưa nhập"}</td>
            </tr>
            <tr>
              <td>Dương lịch</td>
              <td>{solarDate}</td>
            </tr>
            <tr>
              <td>Âm lịch</td>
              <td>{lunarDate}</td>
            </tr>
            <tr>
              <td>Tứ trụ</td>
              <td>{profile.chineseDate}</td>
            </tr>
            <tr>
              <td>Giới tính</td>
              <td>{profile.yinYangLabel ?? profile.gender}</td>
            </tr>
            <tr>
              <td>Giờ sinh</td>
              <td>{profile.birthTime}</td>
            </tr>
            <tr>
              <td>Con giáp</td>
              <td>{profile.zodiac}</td>
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
          </tbody>
        </table>

        {profile.yinYangStatus ? <div className="note">{profile.yinYangStatus}</div> : null}
        {profile.elementalStatus ? <div className="note">{profile.elementalStatus}</div> : null}
      </div>
    </div>
  );
}
