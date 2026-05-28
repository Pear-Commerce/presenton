import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useRef } from "react";
import type { ChartElement as ChartEl, Slide } from "../../../lib/slide-schema";
import { PX_PER_IN, withHash } from "../../../editorUtils";
import { DomElementLayer, elementBoxStyle } from "../shared";

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
);

export function ChartDomElement({
  scale,
  slide,
}: {
  scale: number;
  slide: Slide;
}) {
  return (
    <DomElementLayer>
      {slide.elements.map((element, index) =>
        element.type === "chart" ? (
          <ChartCanvas key={index} element={element} scale={scale} />
        ) : null,
      )}
    </DomElementLayer>
  );
}

function ChartCanvas({ element, scale }: { element: ChartEl; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labels = useMemo(
    () => element.data.map((datum) => datum.label),
    [element.data],
  );
  const values = useMemo(
    () => element.data.map((datum) => datum.value),
    [element.data],
  );
  const colors = useMemo(
    () =>
      element.data.map((datum) =>
        withHash(datum.color ?? element.color ?? "D4A24C"),
      ),
    [element.color, element.data],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    Chart.getChart(canvas)?.destroy();

    const isDonut = element.chartType === "donut";
    const chart = new Chart(canvas, {
      type:
        element.chartType === "donut"
          ? "doughnut"
          : element.chartType === "line"
            ? "line"
            : "bar",
      data: {
        labels,
        datasets: [
          {
            label: element.title ?? "Series",
            data: values,
            backgroundColor: isDonut ? colors : colors.map((color) => color),
            borderColor:
              element.chartType === "line"
                ? withHash(element.color ?? "D4A24C")
                : colors,
            borderRadius: element.chartType === "bar" ? 4 : 0,
            borderWidth: element.chartType === "line" ? 2 : 1,
            fill: false,
            pointBackgroundColor: colors,
            pointBorderColor: "#ffffff",
            pointRadius: element.chartType === "line" ? 3 : 0,
            tension: element.chartType === "line" ? 0.28 : 0,
          },
        ],
      },
      options: {
        animation: false,
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            display: isDonut,
            position: "right",
            labels: {
              boxWidth: 8,
              color: withHash(element.labelColor ?? "6A7894"),
              font: { family: "Arial, Helvetica, sans-serif", size: 10 },
            },
          },
          title: {
            display: Boolean(element.title),
            align: "start",
            color: withHash(element.labelColor ?? "6A7894"),
            font: {
              family: "Arial, Helvetica, sans-serif",
              size: 12,
              weight: "bold",
            },
            padding: { bottom: 8 },
            text: element.title ?? "",
          },
          tooltip: { enabled: false },
        },
        scales: isDonut
          ? undefined
          : {
              x: {
                border: { color: withHash(element.axisColor ?? "9AA7BD") },
                grid: { display: false },
                ticks: {
                  color: withHash(element.labelColor ?? "6A7894"),
                  font: { family: "Arial, Helvetica, sans-serif", size: 10 },
                  maxRotation: 0,
                },
              },
              y: {
                beginAtZero: true,
                border: { color: withHash(element.axisColor ?? "9AA7BD") },
                grid: {
                  color: `${withHash(element.axisColor ?? "9AA7BD")}55`,
                  tickBorderDash: [3, 3],
                },
                ticks: {
                  color: withHash(element.labelColor ?? "6A7894"),
                  font: { family: "Arial, Helvetica, sans-serif", size: 10 },
                },
              },
            },
      },
    });

    return () => chart.destroy();
  }, [colors, element, labels, values]);

  return (
    <div
      style={{
        ...elementBoxStyle(element, scale),
        background: "rgba(255,255,255,0.92)",
        border: `1px solid ${withHash(element.axisColor ?? "9AA7BD")}`,
        borderRadius: 6,
        overflow: "hidden",
        padding: 8 * (scale / PX_PER_IN),
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", height: "100%", width: "100%" }}
      />
    </div>
  );
}
