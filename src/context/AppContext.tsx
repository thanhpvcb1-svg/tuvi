import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { BirthInput, ChartView, LuuDisplayOptions } from "../lib/types";
import type { QuickReadingCard } from "../lib/chartUi";

// ============ TYPES ============

type FormErrors = Partial<Record<keyof BirthInput, string>> & { form?: string };

type AppContextValue = {
  // State
  birthInput: BirthInput;
  submittedInput: BirthInput | null;
  chart: ChartView | null;
  hasRequestedChart: boolean;
  fieldErrors: FormErrors;
  shareMessage: string;
  toastMessage: string;
  showReading: boolean;
  isGenerating: boolean;
  isDownloadingImage: boolean;
  quickReadings: QuickReadingCard[];
  luuOptions: LuuDisplayOptions;
  horoscopeYear: number;
  hasDirtyChanges: boolean;
  
  // Refs
  chartCaptureRef: React.RefObject<HTMLDivElement | null>;
  resultRef: React.RefObject<HTMLElement | null>;
  
  // Setters
  setBirthInput: React.Dispatch<React.SetStateAction<BirthInput>>;
  setFieldErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  setShareMessage: React.Dispatch<React.SetStateAction<string>>;
  setShowReading: React.Dispatch<React.SetStateAction<boolean>>;
  setLuuOptions: React.Dispatch<React.SetStateAction<LuuDisplayOptions>>;
  setHoroscopeYear: React.Dispatch<React.SetStateAction<number>>;
  setIsDownloadingImage: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Actions
  showToast: (message: string) => void;
  handleGenerateFromInput: (input: BirthInput) => void;
  handleGenerateChart: () => void;
  handleResetChart: () => void;
  resetWorkspace: (targetPath?: string) => void;
};

// ============ CONSTANTS ============

const currentYear = new Date().getFullYear();

const defaultInput: BirthInput = {
  fullName: "",
  year: "",
  month: "",
  day: "",
  birthHour: "",
  birthMinute: "",
  gender: "male",
  calendarType: "solar",
  horoscopeYear: String(currentYear),
  unknownBirthTime: false,
};

const getDefaultLuuOptions = (): LuuDisplayOptions => ({
  showLuuTuHoa: false,
  showPhiHoaCanCung: typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches ? false : true,
  showLuuTuDuc: false,
  showLuuDaiVan: false,
  showLuuOtherStars: false,
  showLocKyNhap: false,
  showLuuTuanTriet: false,
});

// ============ HELPERS ============

let chartModulesPromise: Promise<{
  createChart: typeof import("../lib/iztroEngine").createChart;
  buildQuickReadings: typeof import("../lib/chartUi").buildQuickReadings;
}> | null = null;

const loadChartModules = async () => {
  if (!chartModulesPromise) {
    chartModulesPromise = Promise.all([
      import("../lib/iztroEngine"),
      import("../lib/chartUi"),
    ]).then(([iztroEngine, chartUi]) => ({
      createChart: iztroEngine.createChart,
      buildQuickReadings: chartUi.buildQuickReadings,
    }));
  }
  return chartModulesPromise;
};

const parseRequiredNumber = (value: string, min: number, max: number) => {
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
};

const toBirthHourIndex = (hour: number) => hour === 23 ? 12 : Math.floor((hour + 1) / 2);

const isValidCalendarDate = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

type NormalizedBirthInput = BirthInput & {
  year: number;
  month: number;
  day: number;
  birthHour: number;
  birthMinute: number;
  birthHourIndex: number;
};

const normalizeBirthInput = (input: BirthInput): NormalizedBirthInput | null => {
  const year = parseRequiredNumber(input.year, 1900, 2100);
  const month = parseRequiredNumber(input.month, 1, 12);
  const day = parseRequiredNumber(input.day, 1, 31);
  const birthHour = input.unknownBirthTime ? 12 : parseRequiredNumber(input.birthHour, 0, 23);
  const birthMinute = input.unknownBirthTime ? 0 : parseRequiredNumber(input.birthMinute || "0", 0, 59);

  if (year === null || month === null || day === null || birthHour === null || birthMinute === null || !isValidCalendarDate(year, month, day)) {
    return null;
  }

  return {
    ...input,
    year,
    month,
    day,
    birthHour,
    birthMinute,
    birthHourIndex: toBirthHourIndex(birthHour),
  };
};

const getHoroscopeYear = (input: BirthInput) => parseRequiredNumber(input.horoscopeYear, 1900, 2100) ?? currentYear;

const validateBirthInput = (input: BirthInput): FormErrors => {
  const errors: FormErrors = {};
  const year = parseRequiredNumber(input.year, 1900, 2100);
  const month = parseRequiredNumber(input.month, 1, 12);
  const day = parseRequiredNumber(input.day, 1, 31);
  const horoscopeYear = parseRequiredNumber(input.horoscopeYear, 1900, 2100);

  if (!input.fullName.trim()) {
    errors.fullName = "Vui lòng nhập tên hiển thị.";
  }

  if (!input.day.trim() || !input.month.trim() || !input.year.trim()) {
    errors.day = "Vui lòng chọn đầy đủ ngày sinh.";
    errors.month = "Vui lòng chọn đầy đủ ngày sinh.";
    errors.year = "Vui lòng chọn đầy đủ ngày sinh.";
  } else if (year === null || month === null || day === null || !isValidCalendarDate(year, month, day)) {
    errors.day = "Ngày sinh không hợp lệ, vui lòng kiểm tra lại.";
  }

  if (!input.unknownBirthTime) {
    const birthHour = parseRequiredNumber(input.birthHour, 0, 23);
    const birthMinute = input.birthMinute.trim() ? parseRequiredNumber(input.birthMinute, 0, 59) : 0;

    if (birthHour === null) {
      errors.birthHour = "Vui lòng chọn giờ sinh hoặc chọn 'Không rõ giờ sinh'.";
    }
    if (birthMinute === null) {
      errors.birthMinute = "Phút sinh không hợp lệ.";
    }
  }

  if (horoscopeYear === null) {
    errors.horoscopeYear = "Vui lòng nhập năm hợp lệ.";
  }

  return errors;
};

const buildInputSignature = (input: BirthInput) => JSON.stringify(input);
const isMobileViewport = () => window.matchMedia("(max-width: 760px)").matches;

// ============ CONTEXT ============

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}

// ============ PROVIDER ============

export function AppProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  // State
  const [birthInput, setBirthInput] = useState<BirthInput>(defaultInput);
  const [submittedInput, setSubmittedInput] = useState<BirthInput | null>(null);
  const [chart, setChart] = useState<ChartView | null>(null);
  const [hasRequestedChart, setHasRequestedChart] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [shareMessage, setShareMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showReading, setShowReading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [quickReadings, setQuickReadings] = useState<QuickReadingCard[]>([]);
  const [luuOptions, setLuuOptions] = useState<LuuDisplayOptions>(getDefaultLuuOptions);
  const [horoscopeYear, setHoroscopeYear] = useState(currentYear);
  const [lastSubmittedSignature, setLastSubmittedSignature] = useState<string | null>(null);
  
  // Refs
  const chartCaptureRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  // Derived state
  const hasDirtyChanges = useMemo(() => {
    if (!lastSubmittedSignature) return false;
    return buildInputSignature(birthInput) !== lastSubmittedSignature;
  }, [birthInput, lastSubmittedSignature]);

  // Effects
  useEffect(() => {
    if (!submittedInput) return;

    const normalizedInput = normalizeBirthInput(submittedInput);
    if (!normalizedInput) return;

    let cancelled = false;

    const refreshChart = async () => {
      const { createChart, buildQuickReadings } = await loadChartModules();
      if (cancelled) return;

      const nextChart = createChart(normalizedInput, "tuvichancoCompatible", { 
        luuOptions, 
        horoscopeDate: new Date(horoscopeYear, 5, 15) 
      });
      if (cancelled) return;

      setChart(nextChart);
      setQuickReadings(buildQuickReadings(nextChart));
      setShowReading(false);
    };

    refreshChart();
    return () => { cancelled = true; };
  }, [submittedInput, luuOptions, horoscopeYear]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = window.setTimeout(() => setToastMessage(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  // Actions
  const showToast = useCallback((message: string) => {
    setToastMessage("");
    window.setTimeout(() => setToastMessage(message), 10);
  }, []);

  const resetWorkspace = useCallback((targetPath = "/lap-la-so") => {
    setBirthInput(defaultInput);
    setSubmittedInput(null);
    setChart(null);
    setHasRequestedChart(false);
    setFieldErrors({});
    setShareMessage("");
    setToastMessage("");
    setShowReading(false);
    setQuickReadings([]);
    setLuuOptions(getDefaultLuuOptions());
    setHoroscopeYear(currentYear);
    setLastSubmittedSignature(null);
    navigate(targetPath, { replace: true });
  }, [navigate]);

  const handleGenerateFromInput = useCallback((nextInput: BirthInput) => {
    const errors = validateBirthInput(nextInput);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setShareMessage("");
    setLuuOptions((current) => ({
      ...current,
      showPhiHoaCanCung: !isMobileViewport(),
    }));
    setIsGenerating(true);
    navigate("/lap-la-so");

    window.setTimeout(async () => {
      const normalizedInput = normalizeBirthInput(nextInput);

      if (!normalizedInput) {
        setFieldErrors({ form: "Không thể lập lá số từ dữ liệu hiện tại. Vui lòng kiểm tra lại thông tin sinh." });
        setIsGenerating(false);
        return;
      }

      const { createChart, buildQuickReadings } = await loadChartModules();
      const nextYear = getHoroscopeYear(nextInput);
      const nextChart = createChart(normalizedInput, "tuvichancoCompatible", { 
        luuOptions, 
        horoscopeDate: new Date(nextYear, 5, 15) 
      });
      
      setHoroscopeYear(nextYear);
      setSubmittedInput(nextInput);
      setChart(nextChart);
      setQuickReadings(buildQuickReadings(nextChart));
      setHasRequestedChart(true);
      setShowReading(false);
      setLastSubmittedSignature(buildInputSignature(nextInput));
      navigate("/lap-la-so", { replace: true });
      setIsGenerating(false);
      showToast("Lập lá số thành công");

      window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }, 40);
  }, [navigate, luuOptions, showToast]);

  const handleGenerateChart = useCallback(() => {
    handleGenerateFromInput(birthInput);
  }, [birthInput, handleGenerateFromInput]);

  const handleResetChart = useCallback(() => {
    resetWorkspace("/lap-la-so");
  }, [resetWorkspace]);

  // Context value
  const value = useMemo<AppContextValue>(() => ({
    birthInput,
    submittedInput,
    chart,
    hasRequestedChart,
    fieldErrors,
    shareMessage,
    toastMessage,
    showReading,
    isGenerating,
    isDownloadingImage,
    quickReadings,
    luuOptions,
    horoscopeYear,
    hasDirtyChanges,
    chartCaptureRef,
    resultRef,
    setBirthInput,
    setFieldErrors,
    setShareMessage,
    setShowReading,
    setLuuOptions,
    setHoroscopeYear,
    setIsDownloadingImage,
    showToast,
    handleGenerateFromInput,
    handleGenerateChart,
    handleResetChart,
    resetWorkspace,
  }), [
    birthInput, submittedInput, chart, hasRequestedChart, fieldErrors,
    shareMessage, toastMessage, showReading, isGenerating, isDownloadingImage,
    quickReadings, luuOptions, horoscopeYear, hasDirtyChanges,
    showToast, handleGenerateFromInput, handleGenerateChart, handleResetChart, resetWorkspace,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============ EXPORTS ============

export { defaultInput, currentYear, getDefaultLuuOptions };
export type { FormErrors };
