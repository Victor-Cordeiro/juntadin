import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { Slice } from '@/lib/analytics';
import { font, palette } from '@/theme/tokens';

const GAP = 2; // surface gap between adjacent fills, per chart mark specs

export function formatCompactBRL(cents: bigint): string {
  const value = Number(cents) / 100;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}k`.replace('.', ',');
  return String(Math.round(value));
}

/** Ring chart: identity by color, magnitude by arc, with the headline total in the middle. */
export function DonutChart({ slices, caption, value, tint }: { slices: Slice[]; caption: string; value: string; tint: string }) {
  const size = 212;
  const stroke = 30;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const drawable = slices.filter((slice) => slice.share > 0);
  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90, ${size / 2}, ${size / 2})`}>
          {drawable.length === 0 ? (
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={palette.border} strokeWidth={stroke} fill="none" />
          ) : drawable.length === 1 ? (
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={drawable[0].color || tint} strokeWidth={stroke} fill="none" />
          ) : (
            drawable.map((slice) => {
              const length = (slice.share / 100) * circumference;
              const dash = Math.max(length - GAP, 1);
              const element = (
                <Circle
                  key={slice.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return element;
            })
          )}
        </G>
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutCaption}>{caption}</Text>
        <Text style={styles.donutValue}>{value}</Text>
      </View>
    </View>
  );
}

export type TrendPoint = { label: string; income: bigint; expense: bigint; projected: boolean };

/**
 * Two series over time — expenses and income — on one shared axis.
 * Projected months keep the same hue but switch to a dashed stroke.
 */
export function TrendChart({ points, limitCents }: { points: TrendPoint[]; limitCents?: bigint | null }) {
  const width = 320;
  const height = 190;
  const padding = { top: 18, right: 10, bottom: 28, left: 10 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const values = points.flatMap((point) => [Number(point.income), Number(point.expense)]);
  if (limitCents) values.push(Number(limitCents));
  const max = Math.max(...values, 1);
  const x = (index: number) => padding.left + (points.length <= 1 ? plotWidth / 2 : (index * plotWidth) / (points.length - 1));
  const y = (value: number) => padding.top + plotHeight - (value / max) * plotHeight;

  const segments = (pick: (point: TrendPoint) => bigint) => {
    const solid: string[] = [];
    const dashed: string[] = [];
    points.forEach((point, index) => {
      if (index === 0) { solid.push(`M ${x(0)} ${y(Number(pick(point)))}`); return; }
      const command = `L ${x(index)} ${y(Number(pick(point)))}`;
      const target = point.projected ? dashed : solid;
      if (point.projected && dashed.length === 0) {
        const previous = points[index - 1];
        dashed.push(`M ${x(index - 1)} ${y(Number(pick(previous)))}`);
      }
      target.push(command);
    });
    return { solid: solid.join(' '), dashed: dashed.join(' ') };
  };

  const expense = segments((point) => point.expense);
  const income = segments((point) => point.income);

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((step) => (
          <Line key={step} x1={padding.left} x2={width - padding.right} y1={padding.top + plotHeight * step} y2={padding.top + plotHeight * step} stroke={palette.border} strokeWidth={1} strokeDasharray="3 5" />
        ))}
        {limitCents ? (
          <>
            <Line x1={padding.left} x2={width - padding.right} y1={y(Number(limitCents))} y2={y(Number(limitCents))} stroke={palette.greenVault} strokeWidth={1.5} strokeDasharray="6 4" />
            <SvgText x={padding.left} y={y(Number(limitCents)) - 6} fill={palette.inkMuted} fontSize={10} fontFamily={font.medium}>limite</SvgText>
          </>
        ) : null}

        <Path d={expense.solid} stroke={palette.deficit} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {expense.dashed ? <Path d={expense.dashed} stroke={palette.deficit} strokeWidth={2} fill="none" strokeDasharray="5 4" strokeLinecap="round" /> : null}
        <Path d={income.solid} stroke={palette.greenAction} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {income.dashed ? <Path d={income.dashed} stroke={palette.greenAction} strokeWidth={2} fill="none" strokeDasharray="5 4" strokeLinecap="round" /> : null}

        {points.map((point, index) => (
          <G key={point.label}>
            <Circle cx={x(index)} cy={y(Number(point.expense))} r={4} fill={palette.deficit} stroke={palette.surface} strokeWidth={2} />
            <Circle cx={x(index)} cy={y(Number(point.income))} r={4} fill={palette.greenAction} stroke={palette.surface} strokeWidth={2} />
            <SvgText x={x(index)} y={height - 8} fill={palette.inkMuted} fontSize={10} fontFamily={font.regular} textAnchor="middle">{point.label}</SvgText>
          </G>
        ))}
      </Svg>
      <View style={styles.legend}>
        <LegendDot color={palette.deficit} label="Despesas" />
        <LegendDot color={palette.greenAction} label="Rendas" />
      </View>
    </View>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: color }]} /><Text style={styles.legendLabel}>{label}</Text></View>;
}

/** Vertical bars for ranked magnitudes, with 4px rounded ends anchored to the baseline. */
export function CategoryBars({ slices }: { slices: Slice[] }) {
  const width = 320;
  const height = 170;
  const bottom = 132;
  const max = slices.reduce((top, slice) => (slice.total > top ? slice.total : top), 1n);
  const step = width / Math.max(slices.length, 1);
  const barWidth = Math.min(18, step - GAP * 3);

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line x1={0} x2={width} y1={bottom} y2={bottom} stroke={palette.border} strokeWidth={1} />
      {slices.map((slice, index) => {
        const barHeight = Math.max(Number((slice.total * BigInt(Math.round(bottom - 16))) / max), 3);
        const x = step * index + (step - barWidth) / 2;
        return (
          <G key={slice.key}>
            <Rect x={x} y={bottom - barHeight} width={barWidth} height={barHeight} rx={4} fill={slice.color} />
            <SvgText x={x + barWidth / 2} y={bottom + 16} fill={palette.inkMuted} fontSize={10} fontFamily={font.regular} textAnchor="middle">
              {slice.label.length > 9 ? `${slice.label.slice(0, 8)}…` : slice.label}
            </SvgText>
            <SvgText x={x + barWidth / 2} y={bottom - barHeight - 6} fill={palette.ink} fontSize={10} fontFamily={font.semibold} textAnchor="middle">
              {formatCompactBRL(slice.total)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  donutWrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  donutCenter: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 2 },
  donutCaption: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13 },
  donutValue: { color: palette.ink, fontFamily: font.display, fontSize: 25, letterSpacing: -0.5 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendSwatch: { width: 12, height: 4, borderRadius: 2 },
  legendLabel: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 13 },
});
