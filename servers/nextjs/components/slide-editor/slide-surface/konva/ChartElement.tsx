import { Arc, Ellipse, Group, Line, Rect, Text } from "react-konva";
import type { ChartElement as ChartEl } from "../../lib/slide-schema";
import { PX_PER_IN, withHash } from "../../editorUtils";
import { chartColor as getChartColor } from "../../lib/element-model";
import { rotationProps, shadowProps } from "./elementVisuals";
import { geometry, type ElementCommonProps } from "./types";

type ChartDatum = {
  label: string;
  value: number;
  color?: string | null;
};

type Plot = { x: number; y: number; w: number; h: number };

export function ChartElement({
  element,
  index,
  scale,
  selected,
  setRef,
  events,
  renderMode = "canvas",
}: ElementCommonProps & {
  element: ChartEl;
  renderMode?: "canvas" | "proxy";
}) {
  const { x, y, width, height, stroke, strokeWidth } = geometry(
    element,
    scale,
    selected,
  );
  const max = Math.max(1, ...element.data.map((datum) => datum.value));
  const titleH = element.title ? 24 * (scale / PX_PER_IN) : 8;
  const pad = 12 * (scale / PX_PER_IN);
  const chartColor = withHash(getChartColor(element));
  const axisColor = withHash(element.axisColor ?? "9AA7BD");
  const labelColor = withHash(element.labelColor ?? "6A7894");
  const plot = {
    x: pad,
    y: titleH,
    w: Math.max(1, width - pad * 2),
    h: Math.max(1, height - titleH - pad),
  };

  return (
    <Group
      ref={setRef}
      name={`element-${index}`}
      x={x}
      y={y}
      width={width}
      height={height}
      {...rotationProps(element)}
      opacity={element.opacity ?? 1}
      {...shadowProps(element.shadow, scale)}
      {...events}
    >
      <Rect width={width} height={height} fill="rgba(0,0,0,0)" />
      {renderMode === "proxy" ? null : (
        <>
          <Rect
            width={width}
            height={height}
            fill="#ffffff"
            opacity={0.92}
            cornerRadius={6}
            stroke={stroke ?? axisColor}
            strokeWidth={selected ? strokeWidth : 0.5}
          />
          {element.title ? (
            <Text
              x={pad}
              y={8 * (scale / PX_PER_IN)}
              width={width - pad * 2}
              height={14 * (scale / PX_PER_IN)}
              text={element.title}
              fontFamily="Arial, Helvetica, sans-serif"
              fontSize={9 * (scale / PX_PER_IN)}
              fontStyle="bold"
              fill={labelColor}
            />
          ) : null}
          {element.chartType === "bar" ? (
            <BarChartParts
              data={element.data}
              max={max}
              plot={plot}
              color={chartColor}
              axisColor={axisColor}
              labelColor={labelColor}
              scale={scale}
              showValues={element.showValues ?? false}
            />
          ) : element.chartType === "line" ? (
            <LineChartParts
              data={element.data}
              max={max}
              plot={plot}
              color={chartColor}
              axisColor={axisColor}
              labelColor={labelColor}
              scale={scale}
              showValues={element.showValues ?? false}
            />
          ) : (
            <DonutChartParts
              data={element.data}
              plot={plot}
              color={chartColor}
              labelColor={labelColor}
              scale={scale}
              showValues={element.showValues ?? false}
            />
          )}
        </>
      )}
      {selected && renderMode === "proxy" ? (
        <Rect
          width={width}
          height={height}
          stroke={stroke}
          strokeWidth={strokeWidth}
          listening={false}
        />
      ) : null}
    </Group>
  );
}

function BarChartParts({
  data,
  max,
  plot,
  color,
  axisColor,
  labelColor,
  scale,
  showValues,
}: {
  data: ChartDatum[];
  max: number;
  plot: Plot;
  color: string;
  axisColor: string;
  labelColor: string;
  scale: number;
  showValues: boolean;
}) {
  const gap = 8 * (scale / PX_PER_IN);
  const barW = Math.max(4, (plot.w - gap * (data.length - 1)) / data.length);
  return (
    <>
      <Line
        points={[plot.x, plot.y + plot.h, plot.x + plot.w, plot.y + plot.h]}
        stroke={axisColor}
        strokeWidth={1}
      />
      <Line
        points={[plot.x, plot.y, plot.x, plot.y + plot.h]}
        stroke={axisColor}
        strokeWidth={1}
      />
      {data.map((datum, index) => {
        const barH = (datum.value / max) * plot.h * 0.82;
        const x = plot.x + index * (barW + gap);
        const y = plot.y + plot.h - barH;
        return (
          <Group key={`${datum.label}-${index}`}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={withHash(datum.color ?? color)}
              cornerRadius={2}
            />
            {showValues ? (
              <Text
                x={x}
                y={Math.max(plot.y, y - 12 * (scale / PX_PER_IN))}
                width={barW}
                height={10 * (scale / PX_PER_IN)}
                text={String(datum.value)}
                fontSize={7 * (scale / PX_PER_IN)}
                align="center"
                fill={labelColor}
              />
            ) : null}
          </Group>
        );
      })}
    </>
  );
}

function LineChartParts({
  data,
  max,
  plot,
  color,
  axisColor,
  labelColor,
  scale,
  showValues,
}: {
  data: ChartDatum[];
  max: number;
  plot: Plot;
  color: string;
  axisColor: string;
  labelColor: string;
  scale: number;
  showValues: boolean;
}) {
  const labelBand = 16 * (scale / PX_PER_IN);
  const plotH = Math.max(1, plot.h - labelBand);
  const points = data.flatMap((datum, index) => [
    plot.x + (data.length === 1 ? 0 : (index / (data.length - 1)) * plot.w),
    plot.y + plotH - (datum.value / max) * plotH * 0.82,
  ]);
  return (
    <>
      <Line
        points={[plot.x, plot.y + plotH, plot.x + plot.w, plot.y + plotH]}
        stroke={axisColor}
        strokeWidth={1}
      />
      <Line
        points={[plot.x, plot.y, plot.x, plot.y + plotH]}
        stroke={axisColor}
        strokeWidth={1}
      />
      <Line points={points} stroke={color} strokeWidth={2} tension={0.28} />
      {data.map((datum, index) => {
        const cx =
          plot.x +
          (data.length === 1 ? 0 : (index / (data.length - 1)) * plot.w);
        const cy = plot.y + plotH - (datum.value / max) * plotH * 0.82;
        return (
          <Group key={`${datum.label}-${index}`}>
            <Ellipse
              x={cx}
              y={cy}
              radiusX={3.5 * (scale / PX_PER_IN)}
              radiusY={3.5 * (scale / PX_PER_IN)}
              fill={withHash(datum.color ?? color)}
              stroke="#ffffff"
              strokeWidth={1}
            />
            <Text
              x={cx - 14 * (scale / PX_PER_IN)}
              y={plot.y + plotH + 4 * (scale / PX_PER_IN)}
              width={28 * (scale / PX_PER_IN)}
              height={10 * (scale / PX_PER_IN)}
              text={datum.label}
              fontSize={7 * (scale / PX_PER_IN)}
              align="center"
              fill={labelColor}
            />
            {showValues ? (
              <Text
                x={cx - 14 * (scale / PX_PER_IN)}
                y={Math.max(plot.y, cy - 13 * (scale / PX_PER_IN))}
                width={28 * (scale / PX_PER_IN)}
                height={10 * (scale / PX_PER_IN)}
                text={String(datum.value)}
                fontSize={7 * (scale / PX_PER_IN)}
                align="center"
                fill={labelColor}
              />
            ) : null}
          </Group>
        );
      })}
    </>
  );
}

function DonutChartParts({
  data,
  plot,
  color,
  labelColor,
  scale,
  showValues,
}: {
  data: ChartDatum[];
  plot: Plot;
  color: string;
  labelColor: string;
  scale: number;
  showValues: boolean;
}) {
  const total = Math.max(
    1,
    data.reduce((sum, datum) => sum + datum.value, 0),
  );
  const radius = Math.min(plot.w * 0.26, plot.h * 0.42);
  const cx = plot.x + radius + 4 * (scale / PX_PER_IN);
  const cy = plot.y + plot.h / 2;
  const slices = data.reduce<
    Array<{ datum: ChartDatum; angle: number; rotation: number; index: number }>
  >((items, datum, index) => {
    const rotation =
      index === 0 ? -90 : items[index - 1].rotation + items[index - 1].angle;
    items.push({
      datum,
      index,
      rotation,
      angle: (datum.value / total) * 360,
    });
    return items;
  }, []);

  return (
    <>
      {slices.map(({ datum, angle, rotation, index }) => (
        <Arc
          key={`${datum.label}-${index}`}
          x={cx}
          y={cy}
          innerRadius={radius * 0.55}
          outerRadius={radius}
          angle={angle}
          rotation={rotation}
          fill={withHash(datum.color ?? color)}
        />
      ))}
      <Text
        x={cx - radius * 0.5}
        y={cy - 6 * (scale / PX_PER_IN)}
        width={radius}
        height={12 * (scale / PX_PER_IN)}
        text={String(total)}
        fontSize={10 * (scale / PX_PER_IN)}
        fontStyle="bold"
        align="center"
        fill={color}
      />
      {data.map((datum, index) => (
        <Group
          key={`${datum.label}-legend-${index}`}
          x={cx + radius + 18 * (scale / PX_PER_IN)}
          y={plot.y + index * 18 * (scale / PX_PER_IN)}
        >
          <Rect
            width={8 * (scale / PX_PER_IN)}
            height={8 * (scale / PX_PER_IN)}
            fill={withHash(datum.color ?? color)}
          />
          <Text
            x={14 * (scale / PX_PER_IN)}
            y={-1 * (scale / PX_PER_IN)}
            width={Math.max(20, plot.w - radius * 2 - 24 * (scale / PX_PER_IN))}
            height={12 * (scale / PX_PER_IN)}
            text={`${datum.label}${showValues ? ` ${datum.value}` : ""}`}
            fontSize={7.5 * (scale / PX_PER_IN)}
            fill={labelColor}
          />
        </Group>
      ))}
    </>
  );
}
