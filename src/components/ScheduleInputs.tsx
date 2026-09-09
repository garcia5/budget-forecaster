import React from 'react';

export type StandardScheduleType = 'biweekly' | 'semi-monthly' | 'monthly' | 'per-paycheck' | 'exact-dates';

interface ScheduleInputsProps {
  amount: number;
  onAmountChange: (newAmount: number) => void;
  scheduleType: StandardScheduleType;
  onScheduleTypeChange: (newType: StandardScheduleType) => void;
  anchorDate?: string;
  onAnchorDateChange?: (date: string) => void;
  daysOfMonth?: number[];
  onDaysOfMonthChange?: (days: [number, number]) => void;
  dayOfMonth?: number;
  onDayOfMonthChange?: (day: number) => void;
  includePerPaycheck?: boolean;
  themeColor?: 'emerald' | 'purple';
}

export const ScheduleInputs: React.FC<ScheduleInputsProps> = ({
  amount,
  onAmountChange,
  scheduleType,
  onScheduleTypeChange,
  anchorDate,
  onAnchorDateChange,
  daysOfMonth = [15, -1],
  onDaysOfMonthChange,
  dayOfMonth = 1,
  onDayOfMonthChange,
  includePerPaycheck = false,
  themeColor = 'emerald',
}) => {
  const focusBorder = themeColor === 'purple' ? 'focus:border-purple-500' : 'focus:border-emerald-500';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Amount */}
      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-1">
          Amount per Occurrence ($)
        </label>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
          <input
            type="number"
            step="0.01"
            value={amount || ''}
            onChange={e => onAmountChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className={`w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-white text-xs font-semibold focus:outline-none ${focusBorder}`}
          />
        </div>
      </div>

      {/* 2. Schedule Cadence */}
      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-1">
          Schedule Cadence
        </label>
        <select
          value={scheduleType}
          onChange={e => onScheduleTypeChange(e.target.value as StandardScheduleType)}
          className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none ${focusBorder}`}
        >
          {includePerPaycheck && (
            <option value="per-paycheck">Every Paycheck (Payday Transfer)</option>
          )}
          <option value="biweekly">Biweekly (Every 14 days)</option>
          <option value="semi-monthly">Semi-monthly (Twice a month)</option>
          <option value="monthly">Monthly (Fixed day)</option>
        </select>
      </div>

      {/* 3 & 4. Dynamic Schedule Config */}
      {scheduleType === 'biweekly' && (
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Anchor Reference Date
          </label>
          <input
            type="date"
            value={anchorDate || '2026-03-06'}
            onChange={e => onAnchorDateChange?.(e.target.value)}
            className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none ${focusBorder}`}
          />
        </div>
      )}

      {scheduleType === 'semi-monthly' && (
        <>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              1st Date (Day of Month)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={daysOfMonth[0] ?? 15}
              onChange={e => {
                const d1 = parseInt(e.target.value) || 1;
                const d2 = daysOfMonth[1] ?? -1;
                onDaysOfMonthChange?.([d1, d2]);
              }}
              className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none ${focusBorder}`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              2nd Date (Day of Month)
            </label>
            <select
              value={daysOfMonth[1] ?? -1}
              onChange={e => {
                const d1 = daysOfMonth[0] ?? 15;
                const d2 = parseInt(e.target.value);
                onDaysOfMonthChange?.([d1, d2]);
              }}
              className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none ${focusBorder}`}
            >
              <option value="-1">Last Day of Month (End of Month)</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {scheduleType === 'monthly' && (
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Day of Month
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={dayOfMonth || 1}
            onChange={e => onDayOfMonthChange?.(parseInt(e.target.value) || 1)}
            className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none ${focusBorder}`}
          />
        </div>
      )}

      {scheduleType === 'per-paycheck' && (
        <div className="sm:col-span-2 flex items-center pt-3">
          <span className="text-[11px] text-purple-300/80 italic">
            ⚡ Automatically transfers whenever an active paycheck or income hits
          </span>
        </div>
      )}
    </div>
  );
};
