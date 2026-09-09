import React, { useState } from 'react';
import type {
  MonthlyForecastSummary,
  BudgetConfig,
  ForecastTransaction,
} from '../types/budget';
import {
  DollarSign,
  CreditCard,
  Building,
  PiggyBank,
  CheckCircle,
  XCircle,
  Edit2,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface CalendarViewProps {
  summary: MonthlyForecastSummary;
  config: BudgetConfig;
  onUpdateAutoDepositOverride: (
    depositId: string,
    key: string,
    override: { skipped?: boolean; overrideAmount?: number }
  ) => void;
  onOpenQuickPaydownWithDate: (dateStr: string) => void;
  onOpenAddTransactionWithDate: (dateStr: string) => void;
  onDeleteExtraPaydown?: (cardId: string, paymentId: string) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  summary,
  config,
  onUpdateAutoDepositOverride,
  onOpenQuickPaydownWithDate,
  onOpenAddTransactionWithDate,
  onDeleteExtraPaydown,
  onDeleteTransaction,
}) => {
  const [selectedAutoDeposit, setSelectedAutoDeposit] = useState<{
    transaction: ForecastTransaction;
    dateStr: string;
  } | null>(null);
  const [tweakAmountInput, setTweakAmountInput] = useState<string>('');

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const firstDayDate = new Date(summary.year, summary.month - 1, 1);
  const startDayOfWeek = firstDayDate.getDay();

  const emptyCells = Array.from({ length: startDayOfWeek });

  const handleOpenTweak = (tx: ForecastTransaction, dateStr: string) => {
    setSelectedAutoDeposit({ transaction: tx, dateStr });
    setTweakAmountInput(String(tx.amount || tx.meta?.defaultAmount || ''));
  };

  const handleApplySkip = (skip: boolean) => {
    if (!selectedAutoDeposit) return;
    const depositId = selectedAutoDeposit.transaction.meta?.depositId;
    if (!depositId) return;

    if (!skip) {
      // Restore occurrence by completely clearing the override
      onUpdateAutoDepositOverride(depositId, selectedAutoDeposit.dateStr, {
        skipped: false,
        overrideAmount: undefined,
      });
    } else {
      onUpdateAutoDepositOverride(depositId, selectedAutoDeposit.dateStr, {
        skipped: true,
      });
    }
    setSelectedAutoDeposit(null);
  };

  const handleResetToDefault = () => {
    if (!selectedAutoDeposit) return;
    const depositId = selectedAutoDeposit.transaction.meta?.depositId;
    if (!depositId) return;

    // Completely clear date override so it falls back to standard schedule & default amount
    onUpdateAutoDepositOverride(depositId, selectedAutoDeposit.dateStr, {
      skipped: false,
      overrideAmount: undefined,
    });
    setSelectedAutoDeposit(null);
  };

  const handleApplyTweak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAutoDeposit) return;
    const depositId = selectedAutoDeposit.transaction.meta?.depositId;
    if (!depositId) return;

    const parsed = parseFloat(tweakAmountInput);
    if (isNaN(parsed) || parsed < 0) return;

    onUpdateAutoDepositOverride(depositId, selectedAutoDeposit.dateStr, {
      skipped: false,
      overrideAmount: parsed,
    });
    setSelectedAutoDeposit(null);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            ACH Bill
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Card Autopay / Paydown
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            Auto-Deposit
          </span>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-xs font-semibold text-slate-400 py-1 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {emptyCells.map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px] bg-slate-950/30 rounded-xl border border-transparent" />
        ))}

        {summary.days.map(day => {
          const isDanger = !day.isPast && day.endingBalance < 0;
          const isWarning = !day.isPast && !isDanger && day.endingBalance < config.account.safeBufferAmount;

          return (
            <div
              key={day.date}
              className={`min-h-[110px] p-2 rounded-xl border transition-all flex flex-col justify-between group relative ${
                day.isToday
                  ? 'bg-slate-800/90 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                  : day.isPast
                  ? 'bg-slate-950/40 border-slate-900 opacity-60'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-5 h-5 rounded-md flex items-center justify-center ${
                    day.isToday ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'text-slate-300'
                  }`}
                >
                  {day.dayNumber}
                </span>

                <div className="flex items-center gap-1">
                  {day.isToday && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1 rounded">
                      TODAY
                    </span>
                  )}
                  {/* Quick Add Button */}
                  <button
                    type="button"
                    onClick={() => onOpenAddTransactionWithDate(day.date)}
                    title="Add transaction on this date"
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-opacity cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Transactions Badges */}
              <div className="space-y-1 my-1.5 overflow-hidden">
                {/* Inflows */}
                {day.inflows.map(inf => {
                  const isCardCredit = inf.category === 'credit_card_credit';
                  const isCheckingInflow = inf.category === 'checking_inflow';
                  const isAdHoc = isCardCredit || isCheckingInflow;
                  const txId = inf.id.replace('tx-', '');

                  return (
                    <div
                      key={inf.id}
                      title={`${inf.name}: +${formatMoney(inf.amount)}${isCardCredit ? ' (Card Credit/Refund)' : ''}`}
                      className={`group flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded truncate ${
                        isCardCredit
                          ? 'bg-cyan-950/60 border border-cyan-800/60 text-cyan-300'
                          : 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                      }`}
                    >
                      <span className="truncate flex items-center gap-1 min-w-0">
                        {isCardCredit ? (
                          <CreditCard className="w-2.5 h-2.5 shrink-0 text-cyan-400" />
                        ) : (
                          <DollarSign className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                        )}
                        <span className="truncate">{inf.name}</span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="font-semibold">+{formatMoney(inf.amount)}</span>
                        {isAdHoc && onDeleteTransaction && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTransaction(txId);
                            }}
                            title="Delete manual transaction"
                            className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Outflows */}
                {day.outflows.map(out => {
                  const isCardAutopay = out.category === 'credit_card_autopay';
                  const isCardExtra = out.category === 'credit_card_extra_payment';
                  const isCardCharge = out.category === 'credit_card_charge';
                  const isCheckingOutflow = out.category === 'checking_outflow';
                  const isAD = out.category === 'auto_deposit';

                  if (isAD) {
                    return (
                      <button
                        key={out.id}
                        type="button"
                        onClick={() => handleOpenTweak(out, day.date)}
                        title={`Click to tweak/skip: ${out.name}`}
                        className={`w-full text-left flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                          out.isSkipped
                            ? 'bg-slate-900/80 border-slate-800 text-slate-500 line-through'
                            : 'bg-purple-950/60 border-purple-800/60 text-purple-300 hover:bg-purple-900/50'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1">
                          <PiggyBank className="w-2.5 h-2.5 shrink-0" />
                          {out.name}
                        </span>
                        <span className="font-semibold shrink-0 ml-1">
                          {out.isSkipped ? 'Skipped' : `-${formatMoney(out.amount)}`}
                        </span>
                      </button>
                    );
                  }

                  if (isCardCharge) {
                    const txId = out.id.replace('tx-', '');
                    return (
                      <div
                        key={out.id}
                        title={`${out.name}: -${formatMoney(out.amount)} (Credit card charge - rolls into autopay)`}
                        className="group flex items-center justify-between text-[10px] bg-amber-950/40 border border-amber-800/40 text-amber-300/90 px-1.5 py-0.5 rounded truncate"
                      >
                        <span className="truncate flex items-center gap-1 min-w-0">
                          <CreditCard className="w-2.5 h-2.5 shrink-0 text-amber-400" />
                          <span className="truncate">{out.name}</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="font-semibold">-{formatMoney(out.amount)}</span>
                          {onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTransaction(txId);
                              }}
                              title="Delete card charge"
                              className="text-amber-400/60 hover:text-rose-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (isCardExtra) {
                    const paymentId = out.id.replace('cc-extra-', '');
                    return (
                      <div
                        key={out.id}
                        title={`${out.name}: -${formatMoney(out.amount)} (Extra Card Payment)`}
                        className="group w-full flex items-center justify-between text-[10px] bg-amber-950/60 border border-amber-800/60 text-amber-300 px-1.5 py-0.5 rounded truncate hover:bg-amber-900/40 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenQuickPaydownWithDate(day.date)}
                          className="truncate flex items-center gap-1 flex-1 text-left cursor-pointer min-w-0"
                        >
                          <CreditCard className="w-2.5 h-2.5 shrink-0 text-amber-400" />
                          <span className="truncate">{out.name}</span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="font-semibold">-{formatMoney(out.amount)}</span>
                          {onDeleteExtraPaydown && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (out.meta?.cardId) {
                                  onDeleteExtraPaydown(out.meta.cardId, paymentId);
                                }
                              }}
                              title="Delete extra payment"
                              className="text-amber-400/70 hover:text-rose-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (isCardAutopay) {
                    return (
                      <button
                        key={out.id}
                        type="button"
                        onClick={() => onOpenQuickPaydownWithDate(day.date)}
                        title={`${out.name}: -${formatMoney(out.amount)} (Scheduled Statement Autopay)`}
                        className="w-full text-left flex items-center justify-between text-[10px] bg-amber-950/60 border border-amber-800/60 text-amber-300 px-1.5 py-0.5 rounded truncate cursor-pointer hover:bg-amber-900/40 transition-colors"
                      >
                        <span className="truncate flex items-center gap-1">
                          <CreditCard className="w-2.5 h-2.5 shrink-0 text-amber-400" />
                          {out.name}
                        </span>
                        <span className="font-semibold shrink-0 ml-1">-{formatMoney(out.amount)}</span>
                      </button>
                    );
                  }

                  if (isCheckingOutflow) {
                    const txId = out.id.replace('tx-', '');
                    return (
                      <div
                        key={out.id}
                        title={`${out.name}: -${formatMoney(out.amount)} (Checking expense)`}
                        className="group flex items-center justify-between text-[10px] bg-slate-800/80 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded truncate"
                      >
                        <span className="truncate flex items-center gap-1 min-w-0">
                          <Building className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                          <span className="truncate">{out.name}</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="font-semibold">-{formatMoney(out.amount)}</span>
                          {onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTransaction(txId);
                              }}
                              title="Delete checking expense"
                              className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // ACH Bill
                  return (
                    <div
                      key={out.id}
                      title={`${out.name}: -${formatMoney(out.amount)}`}
                      className="flex items-center justify-between text-[10px] bg-rose-950/60 border border-rose-800/60 text-rose-300 px-1.5 py-0.5 rounded truncate"
                    >
                      <span className="truncate flex items-center gap-1">
                        <Building className="w-2.5 h-2.5 shrink-0" />
                        {out.name}
                      </span>
                      <span className="font-semibold shrink-0 ml-1">-{formatMoney(out.amount)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Day Projected Balance Footer */}
              <div className="border-t border-slate-800/60 pt-1 flex items-baseline justify-between mt-auto">
                <span className="text-[9px] uppercase tracking-wider text-slate-500">Bal</span>
                  <span
                    className={`text-xs font-bold tracking-tight ${
                      day.isPast ? 'text-slate-500' : isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-200'
                    }`}
                  >
                  {formatMoney(day.endingBalance)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-Deposit Tweak / Skip Popover Modal */}
      {selectedAutoDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-purple-400" />
                <h4 className="text-sm font-bold text-white m-0">
                  {selectedAutoDeposit.transaction.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedAutoDeposit(null)}
                className="text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div>
                Occurrence on <span className="font-semibold text-white">{selectedAutoDeposit.dateStr}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Default scheduled:</span>
                <span className="font-semibold text-purple-400">
                  {formatMoney(selectedAutoDeposit.transaction.meta?.defaultAmount || selectedAutoDeposit.transaction.amount)}
                </span>
              </div>
              {selectedAutoDeposit.transaction.isSkipped ? (
                <div className="text-[11px] text-rose-300 font-medium bg-rose-950/40 border border-rose-800/60 rounded px-2 py-1">
                  Status: Skipped (funds kept in Checking)
                </div>
              ) : selectedAutoDeposit.transaction.meta?.isOverridden ? (
                <div className="text-[11px] text-amber-300 font-medium bg-amber-950/40 border border-amber-800/60 rounded px-2 py-1">
                  Status: Tweaked to {formatMoney(selectedAutoDeposit.transaction.amount)}
                </div>
              ) : null}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-1">
              {selectedAutoDeposit.transaction.isSkipped ? (
                <button
                  type="button"
                  onClick={() => handleApplySkip(false)}
                  className="w-full py-2 px-3 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Unskip / Restore Occurrence
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApplySkip(true)}
                  className="w-full py-2 px-3 text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Skip This Occurrence
                </button>
              )}

              {/* Tweak Amount Form */}
              <form onSubmit={handleApplyTweak} className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-[11px] font-medium text-slate-400">
                  Or tweak amount for this occurrence ($):
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tweakAmountInput}
                      onChange={e => setTweakAmountInput(e.target.value)}
                      placeholder="Amount"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500 font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Apply
                  </button>
                </div>
              </form>

              {/* Reset to Default if overridden or skipped */}
              {(selectedAutoDeposit.transaction.isSkipped || selectedAutoDeposit.transaction.meta?.isOverridden) && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="w-full py-1.5 px-2 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to Default ({formatMoney(selectedAutoDeposit.transaction.meta?.defaultAmount || selectedAutoDeposit.transaction.amount)})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
