import React, { useEffect, useMemo, useState } from "react";
import LocationPickerMap from "./LocationPickerMap";
import { searchLocation, type GeocodedPlace } from "../lib/geocoding";
import {
  calculateSolarNoon,
  calculateSolarNoonDebug,
  formatMinutesToHHMM,
  formatUtcOffset,
  getTimezoneForLocation,
  type SolarNoonDebugInfo,
} from "../lib/solarNoon";

type SelectedLocation = Omit<GeocodedPlace, "provider"> & {
  provider: GeocodedPlace["provider"] | "manual";
};

type SolarNoonResult = {
  location: SelectedLocation;
  timezone: string;
  utcOffset: number;
  solarNoon: string;
  note?: string;
  isRepresentativeResult: boolean;
  debug: SolarNoonDebugInfo;
};

const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_CENTER: SelectedLocation = {
  displayName: "Hà Nội, Việt Nam",
  latitude: 21.028511,
  longitude: 105.804817,
  provider: "manual",
  placeType: "city",
};

function getTodayInputValue() {
  const today = new Date();
  const year = String(today.getFullYear());
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function isRepresentativeLocation(location: Pick<SelectedLocation, "placeType" | "addressType" | "provider">) {
  if (location.provider === "manual") {
    return true;
  }

  const typeLabel = `${location.addressType ?? ""} ${location.placeType ?? ""}`.toLowerCase();
  return ["district", "province", "city", "county", "administrative", "commune", "suburb", "town", "village", "hamlet"].some(
    (item) => typeLabel.includes(item),
  );
}

function formatPlaceType(location: Pick<SelectedLocation, "placeType" | "addressType" | "provider">) {
  if (location.provider === "manual") {
    return "thủ công";
  }

  return location.addressType ?? location.placeType ?? "địa điểm";
}

export default function SolarNoonCalculator() {
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SolarNoonResult | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(DEFAULT_CENTER);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setError("");
      setHasSearched(true);

      try {
        const places = await searchLocation(normalizedQuery, controller.signal);
        setSuggestions(places);
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") {
          return;
        }

        console.error(searchError);
        setSuggestions([]);
        setError(searchError instanceof Error ? searchError.message : "Không thể tìm địa điểm lúc này.");
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isModalOpen, query]);

  useEffect(() => {
    if (!selectedLocation) {
      setResult(null);
      return;
    }

    const parsedDate = parseDateInput(selectedDate);
    if (!parsedDate) {
      setError("Ngày tính chưa hợp lệ.");
      setResult(null);
      return;
    }

    const timezoneInfo = getTimezoneForLocation(selectedLocation.latitude, selectedLocation.longitude);
    const solarNoonMinutes = calculateSolarNoon(parsedDate, selectedLocation.longitude, timezoneInfo.utcOffset);
    const debug = calculateSolarNoonDebug(parsedDate, selectedLocation.longitude, timezoneInfo.utcOffset);

    setResult({
      location: selectedLocation,
      timezone: timezoneInfo.timezone,
      utcOffset: timezoneInfo.utcOffset,
      solarNoon: formatMinutesToHHMM(solarNoonMinutes),
      note: timezoneInfo.note,
      isRepresentativeResult: isRepresentativeLocation(selectedLocation),
      debug,
    });
  }, [selectedDate, selectedLocation]);

  const helperText = useMemo(() => {
    const messages = [
      "Kết quả được tính theo tọa độ geocoding trả về. Nếu nhập tên tỉnh/thành, đây là tọa độ đại diện; muốn chính xác hơn hãy chọn địa điểm cụ thể.",
      "Tên hành chính có thể thay đổi theo dữ liệu geocoding hiện tại. Với khu vực Vĩnh Phúc cũ, kết quả có thể hiển thị thuộc tỉnh Phú Thọ sau sắp xếp đơn vị hành chính.",
    ];

    if (result?.note) {
      messages.unshift(result.note);
    }

    if (result?.isRepresentativeResult) {
      messages.unshift("Kết quả này là tọa độ đại diện do geocoder trả về, không phải toàn bộ ranh giới hành chính.");
    }

    return messages;
  }, [result]);

  const currentLocation = selectedLocation ?? DEFAULT_CENTER;
  const currentTimezone = getTimezoneForLocation(currentLocation.latitude, currentLocation.longitude);
  const showSuggestionList = isModalOpen && suggestions.length > 0;
  const showEmptySearch = isModalOpen && hasSearched && !isSearching && query.trim().length >= 2 && suggestions.length === 0;

  const handlePickSuggestion = (place: GeocodedPlace) => {
    setSelectedLocation(place);
    setQuery(place.displayName);
    setSuggestions([]);
    setHasSearched(false);
    setError("");
    setIsModalOpen(false);
  };

  const handleMapLocationChange = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    setSelectedLocation((current) => {
      const displayName = current ? `Vị trí tinh chỉnh gần ${current.displayName}` : "Vị trí đã chọn trên bản đồ";
      setQuery(displayName);

      return {
        displayName,
        latitude,
        longitude,
        provider: "manual",
        placeType: current?.placeType,
        addressType: current?.addressType,
      };
    });
    setError("");
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setError("");
    setQuery(currentLocation.displayName);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSuggestions([]);
    setHasSearched(false);
  };

  return (
    <section className="solar-noon-panel solar-noon-panel--compact">
      <div className="solar-noon-card-head">
        <div className="solar-noon-card-copy">
          <p className="solar-noon-card-kicker">VỊ TRÍ TÍNH TOÁN</p>
          <h3>{currentLocation.displayName}</h3>
        </div>
        <button type="button" className="ghost-button solar-noon-compact-button" onClick={handleOpenModal}>
          Đổi
        </button>
      </div>

      <p className="solar-noon-meta">
        {currentLocation.latitude.toFixed(3)}°, {currentLocation.longitude.toFixed(3)}° · {currentTimezone.timezone} ({formatUtcOffset(currentTimezone.utcOffset)})
      </p>

      {result ? (
        <div className="solar-noon-value solar-noon-value--compact">
          <span>Chính ngọ</span>
          <strong>{result.solarNoon}</strong>
        </div>
      ) : null}

      <div className="solar-noon-inline-actions">
        <input
          id="solar-noon-date"
          className="solar-noon-inline-date"
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </div>

      {error ? <div className="solar-noon-feedback solar-noon-feedback--error">{error}</div> : null}

      {isModalOpen ? (
        <div className="solar-noon-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="solar-noon-modal-title">
          <div className="solar-noon-modal">
            <div className="solar-noon-modal-head">
              <h3 id="solar-noon-modal-title">Chọn địa điểm sinh</h3>
              <button type="button" className="solar-noon-modal-close" onClick={handleCloseModal} aria-label="Đóng">
                ×
              </button>
            </div>

            <div className="field field-full">
              <label htmlFor="solar-noon-query">Tìm thành phố / quốc gia</label>
              <input
                id="solar-noon-query"
                type="text"
                placeholder="Ví dụ: Hà Nội, Việt Nam"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setError("");
                }}
              />
            </div>

            {isSearching ? <div className="solar-noon-feedback solar-noon-feedback--loading">Đang tìm gợi ý địa điểm...</div> : null}
            {showSuggestionList ? (
              <div className="solar-noon-suggestions solar-noon-suggestions--modal">
                {suggestions.map((place, index) => (
                  <button
                    key={`${place.provider}-${place.displayName}-${place.latitude}-${place.longitude}-${index}`}
                    type="button"
                    className="solar-noon-suggestion"
                    onClick={() => handlePickSuggestion(place)}
                  >
                    <span className="solar-noon-suggestion-title">{place.displayName}</span>
                    <span className="solar-noon-suggestion-meta">
                      {place.latitude.toFixed(6)}°, {place.longitude.toFixed(6)}° · {formatPlaceType(place)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            {showEmptySearch ? (
              <div className="solar-noon-empty">Không có gợi ý phù hợp. Hãy nhập rõ hơn tên huyện, quận, xã hoặc thành phố tại Việt Nam.</div>
            ) : null}

            <div className="solar-noon-current">
              <p><strong>Địa điểm hiện tại:</strong> {currentLocation.displayName}</p>
              <p><strong>Tọa độ:</strong> {currentLocation.latitude.toFixed(6)}°, {currentLocation.longitude.toFixed(6)}°</p>
              <p><strong>Múi giờ:</strong> {currentTimezone.timezone} (Offset: {formatUtcOffset(currentTimezone.utcOffset)}h)</p>
            </div>

            <div className="solar-noon-map-shell">
              <LocationPickerMap
                latitude={currentLocation.latitude}
                longitude={currentLocation.longitude}
                onChange={handleMapLocationChange}
              />
            </div>

            <p className="solar-noon-map-hint">Click bản đồ để chọn vị trí sinh</p>

            {result ? (
              <div className="solar-noon-notes">
                {helperText.map((message) => (
                  <p key={message} className="solar-noon-note">{message}</p>
                ))}
              </div>
            ) : null}

            {import.meta.env.DEV && result ? (
              <div className="solar-noon-debug">
                <p><strong>equationOfTime</strong>: {result.debug.equationOfTime.toFixed(3)}</p>
                <p><strong>longitude correction</strong>: {result.debug.longitudeCorrection.toFixed(3)}</p>
                <p><strong>raw solarNoonMinutes</strong>: {result.debug.rawSolarNoonMinutes.toFixed(3)}</p>
                <p><strong>timezone offset</strong>: {result.debug.timezoneOffset}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
