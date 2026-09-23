import type { ChartLayers, DisplayChart, NormalizedBirthInput, SchoolConfig } from "./config/types";
import { createAnalysisChart } from "./createAnalysisChart";
import { createDisplayChart } from "./createDisplayChart";
import { inspectIztroRaw } from "./inspect/inspectIztroRaw";

export type TuviChartResult = {
  inspectionReport: ReturnType<typeof inspectIztroRaw>;
  layers: ChartLayers;
  displayChart: DisplayChart;
};

export function createTuviChart(rawChart: unknown, input: NormalizedBirthInput, config: SchoolConfig): TuviChartResult {
  const inspectionReport = inspectIztroRaw(rawChart);
  const analysisChart = createAnalysisChart(rawChart, input, config);
  const displayChart = createDisplayChart(rawChart, input, config);
  const layers: ChartLayers = {
    rawChart,
    normalizedChart: analysisChart,
    analysisChart,
    displayChart,
  };

  displayChart.layers = layers;

  return {
    inspectionReport,
    layers,
    displayChart,
  };
}
