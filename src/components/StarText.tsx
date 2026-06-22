import React from "react";
import type { StarView } from "../lib/types";

export default function StarText({ star }: { star: StarView }) {
  const extraClass = star.scope === "annual" || star.scope === "monthly" || star.scope === "daily" || star.scope === "hourly" ? " star-luu" : "";
  return (
    <span className={`star ${star.colorGroup}${extraClass}`} style={star.color ? { color: star.color } : undefined}>
      {star.display ?? `${star.name}${star.brightness ? `(${star.brightness})` : ""}`}
    </span>
  );
}
