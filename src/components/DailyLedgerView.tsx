import React, { useState } from "react";
import type { MonthlyForecastSummary, BudgetConfig } from "../types/budget";
import {
  DollarSign,
  CreditCard,
  Building,
  PiggyBank,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Filter,
  RotateCcw,
} from "lucide-react";

interface DailyLedgerViewProps {
  summary: MonthlyForecastSummary;
  config: BudgetConfig;
  onUpdateAutoDepositOverride: (
    depositId: string,
    key: string,
    override: { skipped?: boolean; overrideAmount?: number },
  ) => void;
  onOpenQuickPaydownWithDate: (dateStr: string) => void;
  onDeleteExtraPaydown: (cardId: string, paymentId: string) => void;
  onOpenAddTransactionWithDate?: (dateStr: string) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const DailyLedgerView: React.FC<DailyLedgerViewProps> = ({
  summary,
  config,
  onUpdateAutoDepositOverride,
  onOpenQuickPaydownWithDate,
  onDeleteExtraPaydown,
  onOpenAddTransactionWithDate,
  onDeleteTransaction,
}) => {
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const displayedDays = filterActiveOnly
    ? summary.days.filter((d) => d.inflows.length > 0 || d.outflows.length > 0 || d.isToday)
    : summary.days;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white m-0">Daily Ledger Breakdown</h3>
          <p className="text-xs text-slate-400 m-0">
            Chronological transaction ledger with running balance for {summary.monthName}{" "}
            {summary.year}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterActiveOnly
                ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {filterActiveOnly ? "Showing Days With Activity" : "Show All Days"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Starting Balance</th>
              <th className="py-3 px-4">Inflows</th>
              <th className="py-3 px-4">Outflows & Transactions</th>
              <th className="py-3 px-4 text-right">Net Change</th>
              <th className="py-3 px-4 text-right">Ending Balance</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {displayedDays.map((day) => {
              const isDanger = !day.isPast && day.endingBalance < 0;
              const isWarning =
                !day.isPast && !isDanger && day.endingBalance < config.account.safeBufferAmount;

              return (
                <tr
                  key={day.date}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    day.isToday ? "bg-slate-800/50" : day.isPast ? "opacity-70" : ""
                  }`}
                >
                  {/* Date Column */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          day.isToday ? "text-emerald-400" : "text-slate-200"
                        }`}
                      >
                        {day.date}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">{day.dayOfWeek}</span>
                      {day.isToday && (
                        <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1 py-0.2 rounded">
                          TODAY
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Starting Balance */}
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {formatMoney(day.startingBalance)}
                  </td>

                  {/* Inflows */}
                  <td className="py-3 px-4">
                    {day.inflows.length === 0 ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <div className="space-y-1">
                        {day.inflows.map((inf) => {
                          const isCheckingInflow = inf.category === "checking_inflow";
                          const isCardCredit = inf.category === "credit_card_credit";
                          const txId = inf.id.replace("tx-", "");

                          if (isCardCredit) {
                            return (
                              <div
                                key={inf.id}
                                className="inline-flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 px-2 py-0.5 rounded text-[11px] mr-1.5"
                              >
                                <CreditCard className="w-3 h-3 text-cyan-400" />
                                <span>{inf.name} (Refund):</span>
                                <span className="font-semibold">+{formatMoney(inf.amount)}</span>
                                {onDeleteTransaction && (
                                  <button
                                    onClick={() => onDeleteTransaction(txId)}
                                    title="Delete transaction"
                                    className="ml-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div
                              key={inf.id}
                              className="inline-flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 px-2 py-0.5 rounded text-[11px] mr-1.5"
                            >
                              <DollarSign className="w-3 h-3 text-emerald-400" />
                              <span>{inf.name}:</span>
                              <span className="font-semibold">+{formatMoney(inf.amount)}</span>
                              {isCheckingInflow && onDeleteTransaction && (
                                <button
                                  onClick={() => onDeleteTransaction(txId)}
                                  title="Delete transaction"
                                  className="ml-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* Outflows */}
                  <td className="py-3 px-4">
                    {day.outflows.length === 0 ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {day.outflows.map((out) => {
                          if (out.category === "auto_deposit") {
                            return (
                              <div
                                key={out.id}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] ${
                                  out.isSkipped
                                    ? "bg-slate-950 border-slate-800 text-slate-500 line-through"
                                    : "bg-purple-950/60 border-purple-800/60 text-purple-300"
                                }`}
                              >
                                <PiggyBank className="w-3 h-3 text-purple-400" />
                                <span>{out.name}:</span>
                                <span className="font-semibold">
                                  {out.isSkipped ? "Skipped" : `-${formatMoney(out.amount)}`}
                                </span>
                                {out.meta?.isOverridden && !out.isSkipped && (
                                  <button
                                    onClick={() =>
                                      onUpdateAutoDepositOverride(out.meta?.depositId, day.date, {
                                        skipped: false,
                                        overrideAmount: undefined,
                                      })
                                    }
                                    title={`Reset tweaked amount back to default (${formatMoney(out.meta?.defaultAmount || out.amount)})`}
                                    className="ml-0.5 text-amber-400 hover:text-white cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    onUpdateAutoDepositOverride(
                                      out.meta?.depositId,
                                      day.date,
                                      out.isSkipped
                                        ? { skipped: false, overrideAmount: undefined }
                                        : { skipped: true },
                                    )
                                  }
                                  title={out.isSkipped ? "Restore occurrence" : "Skip occurrence"}
                                  className="ml-1 text-slate-400 hover:text-white cursor-pointer"
                                >
                                  {out.isSkipped ? (
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-rose-400" />
                                  )}
                                </button>
                              </div>
                            );
                          }

                          if (out.category === "credit_card_extra_payment") {
                            const paymentId = out.id.replace("cc-extra-", "");
                            return (
                              <div
                                key={out.id}
                                className="inline-flex items-center gap-1.5 bg-amber-950/60 border border-amber-800/60 text-amber-300 px-2 py-0.5 rounded text-[11px]"
                              >
                                <CreditCard className="w-3 h-3 text-amber-400" />
                                <span>{out.name}:</span>
                                <span className="font-semibold">-{formatMoney(out.amount)}</span>
                                <button
                                  onClick={() => onDeleteExtraPaydown(out.meta?.cardId, paymentId)}
                                  title="Delete extra paydown"
                                  className="ml-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          }

                          if (out.category === "credit_card_charge") {
                            const txId = out.id.replace("tx-", "");
                            return (
                              <div
                                key={out.id}
                                className="inline-flex items-center gap-1.5 bg-amber-950/40 border border-amber-800/40 text-amber-300/90 px-2 py-0.5 rounded text-[11px]"
                                title="Charged to card; rolls into upcoming autopay"
                              >
                                <CreditCard className="w-3 h-3 text-amber-400" />
                                <span>{out.name} (Card):</span>
                                <span className="font-semibold">-{formatMoney(out.amount)}</span>
                                {onDeleteTransaction && (
                                  <button
                                    onClick={() => onDeleteTransaction(txId)}
                                    title="Delete transaction"
                                    className="ml-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          }

                          if (out.category === "credit_card_autopay") {
                            return (
                              <div
                                key={out.id}
                                className="inline-flex items-center gap-1.5 bg-amber-950/40 border border-amber-800/40 text-amber-300 px-2 py-0.5 rounded text-[11px]"
                              >
                                <CreditCard className="w-3 h-3 text-amber-400" />
                                <span>{out.name}:</span>
                                <span className="font-semibold">-{formatMoney(out.amount)}</span>
                              </div>
                            );
                          }

                          if (out.category === "checking_outflow") {
                            const txId = out.id.replace("tx-", "");
                            return (
                              <div
                                key={out.id}
                                className="inline-flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 text-slate-200 px-2 py-0.5 rounded text-[11px]"
                              >
                                <Building className="w-3 h-3 text-slate-400" />
                                <span>{out.name}:</span>
                                <span className="font-semibold">-{formatMoney(out.amount)}</span>
                                {onDeleteTransaction && (
                                  <button
                                    onClick={() => onDeleteTransaction(txId)}
                                    title="Delete transaction"
                                    className="ml-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          }

                          // ACH Bill
                          return (
                            <div
                              key={out.id}
                              className="inline-flex items-center gap-1.5 bg-rose-950/60 border border-rose-800/60 text-rose-300 px-2 py-0.5 rounded text-[11px]"
                            >
                              <Building className="w-3 h-3 text-rose-400" />
                              <span>{out.name}:</span>
                              <span className="font-semibold">-{formatMoney(out.amount)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* Net Change */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        day.netDailyChange > 0
                          ? "text-emerald-400"
                          : day.netDailyChange < 0
                            ? "text-rose-400"
                            : "text-slate-500"
                      }`}
                    >
                      {day.netDailyChange > 0 ? "+" : ""}
                      {day.netDailyChange !== 0 ? formatMoney(day.netDailyChange) : "$0.00"}
                    </span>
                  </td>

                  {/* Ending Balance */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span
                      className={`font-bold text-sm ${
                        day.isPast
                          ? "text-slate-400"
                          : isDanger
                            ? "text-rose-400"
                            : isWarning
                              ? "text-amber-400"
                              : "text-white"
                      }`}
                    >
                      {formatMoney(day.endingBalance)}
                    </span>
                  </td>

                  {/* Quick Action */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <button
                      onClick={() =>
                        onOpenAddTransactionWithDate
                          ? onOpenAddTransactionWithDate(day.date)
                          : onOpenQuickPaydownWithDate(day.date)
                      }
                      title="Add transaction or paydown on this date"
                      className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
