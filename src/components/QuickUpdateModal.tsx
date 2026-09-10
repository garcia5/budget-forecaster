import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Check } from 'lucide-react';
import type { BudgetConfig } from '../types/budget';
import { getTodayDateString } from '../utils/forecaster';

interface QuickUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BudgetConfig;
  onSaveConfig: (newConfig: BudgetConfig) => void;
  initialTab?: 'checking' | 'cards';
}

export const QuickUpdateModal: React.FC<QuickUpdateModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  initialTab = 'checking',
}) => {
  const [activeTab, setActiveTab] = useState<'checking' | 'cards'>(initialTab);

  // Checking state
  const [checkingBalance, setCheckingBalance] = useState<number>(config.account.currentCheckingBalance);
  const [asOfDate, setAsOfDate] = useState<string>(config.account.asOfDate);
  const [safeBuffer, setSafeBuffer] = useState<number>(config.account.safeBufferAmount);

  // Cards statement state
  const [cardsState, setCardsState] = useState(
    config.creditCards.map(c => ({
      id: c.id,
      name: c.name,
      statementBalance: c.currentStatementBalance,
      statementDate: c.statementDate || '',
    }))
  );

  if (!isOpen) return null;

  const handleSaveChecking = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      account: {
        ...config.account,
        currentCheckingBalance: Number(checkingBalance),
        asOfDate,
        safeBufferAmount: Number(safeBuffer),
      },
    });
    onClose();
  };

  const handleSaveCards = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCards = config.creditCards.map(c => {
      const match = cardsState.find(s => s.id === c.id);
      if (match) {
        return {
          ...c,
          currentStatementBalance: Number(match.statementBalance),
          statementDate: match.statementDate,
        };
      }
      return c;
    });
    onSaveConfig({
      ...config,
      creditCards: updatedCards,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <h2 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Update Balances
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('checking')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'checking'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Checking Account
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'cards'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Card Statement Balances
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'checking' && (
            <form onSubmit={handleSaveChecking} className="space-y-4">
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80 mb-2">
                <p className="text-xs text-slate-300 leading-relaxed m-0">
                  Update your current checking account balance as of today or another date. The forecast recalculates all subsequent daily balances from this baseline.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Checking Balance ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={checkingBalance}
                    onChange={e => setCheckingBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-white font-semibold text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      As of Date
                    </label>
                    <button
                      type="button"
                      onClick={() => setAsOfDate(getTodayDateString())}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      Set to Today
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    value={asOfDate}
                    onChange={e => setAsOfDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Safe Target Buffer ($)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={safeBuffer}
                    onChange={e => setSafeBuffer(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Checking Balance
                </button>
              </div>
            </form>
          )}

          {activeTab === 'cards' && (
            <form onSubmit={handleSaveCards} className="space-y-4">
              <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80 mb-2">
                <p className="text-xs text-slate-300 leading-relaxed m-0">
                  Update your credit card statement balances when each card's monthly statement closes. On the payment due date, checking balance drops by the statement balance.
                </p>
              </div>

              {cardsState.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No credit cards configured yet. Add credit cards in Settings.
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {cardsState.map((card, idx) => (
                    <div
                      key={card.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-amber-400" />
                          {card.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Due day: {config.creditCards.find(c => c.id === card.id)?.paymentDueDay}th of month
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative w-32">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={card.statementBalance}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...cardsState];
                              updated[idx].statementBalance = val;
                              setCardsState(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-white font-medium text-sm focus:outline-none focus:border-emerald-500 text-right"
                          />
                        </div>
                        <input
                          type="date"
                          value={card.statementDate}
                          onChange={e => {
                            const updated = [...cardsState];
                            updated[idx].statementDate = e.target.value;
                            setCardsState(updated);
                          }}
                          title="Statement Closing Date"
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Statement Balances
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
