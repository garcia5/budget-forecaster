import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sliders,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  PiggyBank,
  Plus,
  HardDrive,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { BudgetConfig, MonthlyForecastSummary } from '../types/budget';
import { subscribeSyncStatus, type SyncStatus } from '../utils/storage';

interface HeaderProps {
  config: BudgetConfig;
  summary: MonthlyForecastSummary;
  selectedYear: number;
  selectedMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onOpenQuickUpdate: () => void;
  onOpenAddTransaction: () => void;
  onOpenConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  summary,
  selectedYear,
  selectedMonth: _selectedMonth,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onOpenQuickUpdate,
  onOpenAddTransaction,
  onOpenConfig,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  useEffect(() => {
    return subscribeSyncStatus(setSyncStatus);
  }, []);

  const isDanger = summary.lowestProjectedBalance < 0;
  const isWarning = !isDanger && summary.lowestProjectedBalance < config.account.safeBufferAmount;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <header className="space-y-5">
      {/* Top Navbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <DollarSign className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white m-0">
                Budget Forecaster
              </h1>
              {syncStatus === 'synced' && (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium bg-slate-900 border border-slate-800 text-emerald-400 px-2 py-0.5 rounded-md transition-all"
                  title="Every edit is automatically debounced & flushed to budget-data.json on disk"
                >
                  <HardDrive className="w-3 h-3 text-emerald-400" />
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium bg-amber-950/40 border border-amber-800/60 text-amber-300 px-2 py-0.5 rounded-md transition-all animate-pulse"
                  title="Flushing edits to budget-data.json on disk..."
                >
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                </span>
              )}
              {syncStatus === 'error' && (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium bg-rose-950/40 border border-rose-800/60 text-rose-300 px-2 py-0.5 rounded-md transition-all"
                  title="Disk write error; changes safely saved in browser"
                >
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  Sync Error
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={onPrevMonth}
              title="Previous Month"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-3 min-w-[140px] text-center font-semibold text-slate-200 text-sm flex items-center justify-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              {summary.monthName} {selectedYear}
            </div>
            <button
              onClick={onNextMonth}
              title="Next Month"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onCurrentMonth}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700/60 cursor-pointer"
          >
            Today
          </button>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 ml-auto md:ml-2">
            <button
              onClick={onOpenAddTransaction}
              className="px-3 py-2 text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Record an expense or deposit to Checking or Credit Card"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Transaction
            </button>

            <button
              onClick={onOpenQuickUpdate}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Update Balances
            </button>

            <button
              onClick={onOpenConfig}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Configure Incomes, Bills, Cards & Savings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Checking */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Current Checking</span>
            <span className="text-[11px] text-slate-500">As of {config.account.asOfDate}</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatMoney(config.account.currentCheckingBalance)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span>Target buffer:</span>
            <span className="font-semibold text-slate-300">{formatMoney(config.account.safeBufferAmount)}</span>
          </div>
          <div className="absolute right-3 bottom-3 opacity-10 text-emerald-400">
            <DollarSign className="w-14 h-14" />
          </div>
        </div>

        {/* Card 2: Projected End-of-Month Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Projected End-of-Month</span>
            <span className="text-[11px] text-slate-500">End of {summary.monthName}</span>
          </div>
          <div
            className={`text-2xl font-bold tracking-tight ${
              summary.projectedEndingBalance < 0 ? 'text-rose-400' : 'text-cyan-300'
            }`}
          >
            {formatMoney(summary.projectedEndingBalance)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {summary.netCashflow >= 0 ? (
              <span className="text-emerald-400 flex items-center font-medium">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
                +{formatMoney(summary.netCashflow)} net
              </span>
            ) : (
              <span className="text-rose-400 flex items-center font-medium">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />
                {formatMoney(summary.netCashflow)} net
              </span>
            )}
            <span className="text-slate-500 ml-1">this month</span>
          </div>
          <div className="absolute right-3 bottom-3 opacity-10 text-cyan-400">
            <TrendingUp className="w-14 h-14" />
          </div>
        </div>

        {/* Card 3: Lowest Balance Warning Indicator */}
        <div
          className={`border rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all ${
            isDanger
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
              : isWarning
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
              : 'bg-slate-900/90 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <span className="flex items-center gap-1">
              {isDanger ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              ) : isWarning ? (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              Lowest Day Balance
            </span>
            <span className="text-[11px] opacity-75">{summary.lowestBalanceDate}</span>
          </div>
          <div
            className={`text-2xl font-bold tracking-tight ${
              isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {formatMoney(summary.lowestProjectedBalance)}
          </div>
          <div className="mt-2 text-xs opacity-80">
            {isDanger
              ? '⚠️ Projected overdraft risk!'
              : isWarning
              ? 'Below your target safe buffer'
              : 'Safely above your buffer'}
          </div>
        </div>

        {/* Card 4: Month Inflows vs Savings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Inflows & Savings</span>
            <PiggyBank className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <div>
              <div className="text-xs text-slate-400">Total Inflows</div>
              <div className="text-lg font-bold text-emerald-400">
                {formatMoney(summary.totalInflows)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Auto-Deposited</div>
              <div className="text-lg font-bold text-purple-300">
                {formatMoney(summary.totalAutoDeposits)}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex justify-between border-t border-slate-800/80 pt-1.5">
            <span>Bills: {formatMoney(summary.totalBills)}</span>
            <span>Cards: {formatMoney(summary.totalCreditCardPayments)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
