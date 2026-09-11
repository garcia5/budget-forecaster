import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import type { MonthlyForecastSummary } from "../types/budget";

interface DailyBalanceChartProps {
  summary: MonthlyForecastSummary;
  safeBufferAmount: number;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-xs max-w-xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-semibold text-slate-200 pr-5">
            {data.date} {data.isToday ? "(Today)" : data.isPast ? "(Past)" : ""}
          </span>
          <span
            className={`text-sm font-bold ${
              data.balance < 0
                ? "text-rose-400"
                : data.isPast
                  ? "text-slate-400 font-semibold"
                  : "text-emerald-400"
            }`}
          >
            {formatCurrency(data.balance)}
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          <span>Net Change: </span>
          <span
            className={`font-semibold ${
              data.netDailyChange > 0
                ? "text-emerald-400"
                : data.netDailyChange < 0
                  ? "text-rose-400"
                  : "text-slate-400"
            }`}
          >
            {data.netDailyChange > 0 ? "+" : ""}
            {formatCurrency(data.netDailyChange)}
          </span>
        </div>

        {data.inflows.length > 0 && (
          <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Inflows</span>
            {data.inflows.map((i: any) => (
              <div key={i.id} className="flex justify-between text-[11px] text-slate-300">
                <span className="truncate pr-2">{i.name}</span>
                <span className="font-medium text-emerald-400">+{formatCurrency(i.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {data.outflows.length > 0 && (
          <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-rose-400">Outflows</span>
            {data.outflows.map((o: any) => (
              <div key={o.id} className="flex justify-between text-[11px] text-slate-300">
                <span className="truncate pr-2">
                  {o.name} {o.isSkipped ? "(Skipped)" : ""}
                </span>
                <span
                  className={`font-medium ${o.isSkipped ? "line-through text-slate-500" : "text-rose-400"}`}
                >
                  -{formatCurrency(o.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const DailyBalanceChart: React.FC<DailyBalanceChartProps> = ({
  summary,
  safeBufferAmount,
}) => {
  const chartData = summary.days.map((d) => ({
    day: d.dayNumber,
    date: d.date,
    balance: d.endingBalance,
    isToday: d.isToday,
    isPast: d.isPast,
    inflows: d.inflows,
    outflows: d.outflows,
    netDailyChange: d.netDailyChange,
  }));

  const activeChartDays = chartData.filter((d) => !d.isPast);
  const evaluationChartDays = activeChartDays.length > 0 ? activeChartDays : chartData;
  const minBalance = Math.min(...evaluationChartDays.map((d) => d.balance), safeBufferAmount);
  const maxBalance = Math.max(...evaluationChartDays.map((d) => d.balance), safeBufferAmount);
  const yDomainMin = Math.floor(Math.min(0, minBalance) / 500) * 500;
  const yDomainMax = Math.ceil(maxBalance / 500) * 500 + 500;

  const pastDays = chartData.filter((d) => d.isPast);
  const hasPast = pastDays.length > 0;
  const allPast = chartData.length > 0 && pastDays.length === chartData.length;
  const firstDay = chartData[0]?.day;
  const lastDay = chartData[chartData.length - 1]?.day;
  const currentDayItem = chartData.find((d) => !d.isPast);
  const currentDay = currentDayItem?.day;

  // Percentage of width where past region transitions to current/future
  const pastPercentage = hasPast
    ? allPast
      ? 100
      : chartData.length > 1 && currentDayItem
        ? Math.max(
            0,
            Math.min(100, (chartData.indexOf(currentDayItem) / (chartData.length - 1)) * 100),
          )
        : 0
    : 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white m-0">
            Daily Projected Balance Curve — {summary.monthName} {summary.year}
          </h3>
          <p className="text-xs text-slate-400 m-0">
            Estimated end-of-day checking balance for each day in the month
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
            <span>Projected Balance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b-2 border-amber-400 border-dashed inline-block" />
            <span>Safe Buffer (${safeBufferAmount.toLocaleString("en-US")})</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                {hasPast && !allPast ? (
                  <>
                    <stop offset="0%" stopColor="#64748b" stopOpacity={0.45} />
                    <stop offset={`${pastPercentage}%`} stopColor="#64748b" stopOpacity={0.45} />
                    <stop offset={`${pastPercentage}%`} stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                  </>
                ) : allPast ? (
                  <>
                    <stop offset="0%" stopColor="#64748b" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#64748b" stopOpacity={0.45} />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                  </>
                )}
              </linearGradient>

              <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop
                  offset="5%"
                  stopColor={allPast ? "#64748b" : "#10b981"}
                  stopOpacity={allPast ? 0.12 : 0.35}
                />
                <stop offset="95%" stopColor={allPast ? "#64748b" : "#10b981"} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              tickFormatter={(day) => `${day}`}
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              tickFormatter={(val) => `$${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={safeBufferAmount}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="url(#balanceLineGrad)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#balanceGradient)"
              isAnimationActive={false}
            />

            {/* Dim past area earlier than current date */}
            {hasPast && firstDay !== undefined && (
              <ReferenceArea
                x1={firstDay}
                x2={allPast ? lastDay : currentDay}
                fill="#020617"
                fillOpacity={0.55}
                stroke="#334155"
                strokeOpacity={0.3}
                strokeDasharray="3 3"
                style={{ pointerEvents: "none" }}
              />
            )}

            {/* Current date marker */}
            {currentDay !== undefined && hasPast && (
              <ReferenceLine
                x={currentDay}
                stroke="#38bdf8"
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
