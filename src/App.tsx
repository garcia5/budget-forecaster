import { useState, useMemo, useEffect } from 'react';
import type { BudgetConfig, AccountTransaction, CreditCardExtraPayment } from './types/budget';
import { loadBudgetConfig, saveBudgetConfig, loadBudgetConfigFromDisk } from './utils/storage';
import { calculateDailyForecast } from './utils/forecaster';
import { Header } from './components/Header';
import { DailyBalanceChart } from './components/DailyBalanceChart';
import { CalendarView } from './components/CalendarView';
import { DailyLedgerView } from './components/DailyLedgerView';
import { QuickUpdateModal } from './components/QuickUpdateModal';
import { ConfigModal } from './components/ConfigModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { Calendar as CalendarIcon, List } from 'lucide-react';

export function App() {
  const [config, setConfig] = useState<BudgetConfig>(() => loadBudgetConfig());

  // On mount, synchronize with durable disk storage if running with dev or preview server
  useEffect(() => {
    loadBudgetConfigFromDisk().then((diskConfig) => {
      setConfig(diskConfig);
    });
  }, []);

  // Initialize selected month/year based on current date
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('budget_selected_year');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return new Date().getFullYear();
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('budget_selected_month');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return new Date().getMonth() + 1;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('budget_selected_year', String(selectedYear));
      sessionStorage.setItem('budget_selected_month', String(selectedMonth));
    } catch {}
  }, [selectedYear, selectedMonth]);

  const [viewMode, setViewMode] = useState<'calendar' | 'ledger'>('calendar');

  // Modals state
  const [isQuickUpdateOpen, setIsQuickUpdateOpen] = useState<boolean>(false);
  const [quickUpdateTab, setQuickUpdateTab] = useState<'checking' | 'cards'>('checking');
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState<boolean>(false);
  const [addTransactionInitialDate, setAddTransactionInitialDate] = useState<string | undefined>(undefined);
  const [addTransactionInitialFlow, setAddTransactionInitialFlow] = useState<'select' | 'transaction' | 'card_payment'>('select');

  // Auto-save whenever config changes (persists to localStorage AND disk)
  const handleSaveConfig = (newConfig: BudgetConfig) => {
    setConfig(newConfig);
    saveBudgetConfig(newConfig);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleCurrentMonth = () => {
    const today = new Date();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
  };

  // Compute monthly forecast
  const summary = useMemo(() => {
    return calculateDailyForecast(config, selectedYear, selectedMonth);
  }, [config, selectedYear, selectedMonth]);

  // Handle auto-deposit override (skip or tweak)
  const handleUpdateAutoDepositOverride = (
    depositId: string,
    key: string,
    override: { skipped?: boolean; overrideAmount?: number }
  ) => {
    const updated = {
      ...config,
      autoDeposits: config.autoDeposits.map(ad => {
        if (ad.id === depositId) {
          const newOverrides = { ...ad.overrides };
          if (
            (override.skipped === undefined && override.overrideAmount === undefined) ||
            (override.skipped === false && override.overrideAmount === undefined)
          ) {
            delete newOverrides[key];
          } else {
            newOverrides[key] = {
              ...(newOverrides[key] || {}),
              ...override,
            };
          }
          return {
            ...ad,
            overrides: newOverrides,
          };
        }
        return ad;
      }),
    };
    handleSaveConfig(updated);
  };

  // Handle deleting an extra card paydown
  const handleDeleteExtraPaydown = (cardId: string, paymentId: string) => {
    const updated = {
      ...config,
      creditCards: config.creditCards.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            extraPayments: (c.extraPayments || []).filter(p => p.id !== paymentId),
          };
        }
        return c;
      }),
    };
    handleSaveConfig(updated);
  };

  // Card paydown management
  const handleAddCardPayment = (paymentData: Omit<CreditCardExtraPayment, 'id'>) => {
    const newPayment: CreditCardExtraPayment = {
      ...paymentData,
      id: `extra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    const updated = {
      ...config,
      creditCards: config.creditCards.map(c => {
        if (c.id === paymentData.cardId) {
          return {
            ...c,
            extraPayments: [...(c.extraPayments || []), newPayment],
          };
        }
        return c;
      }),
    };
    handleSaveConfig(updated);
  };

  const handleOpenPaydownModalWithDate = (dateStr: string) => {
    setAddTransactionInitialDate(dateStr);
    setAddTransactionInitialFlow('card_payment');
    setIsAddTransactionOpen(true);
  };

  // Ad-hoc transaction management
  const handleAddTransaction = (transactionData: Omit<AccountTransaction, 'id'>) => {
    const newTx: AccountTransaction = {
      ...transactionData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    const updated = {
      ...config,
      transactions: [...(config.transactions || []), newTx],
    };
    handleSaveConfig(updated);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const updated = {
      ...config,
      transactions: (config.transactions || []).filter(t => t.id !== transactionId),
    };
    handleSaveConfig(updated);
  };

  const handleOpenAddTransactionWithDate = (dateStr: string) => {
    setAddTransactionInitialDate(dateStr);
    setAddTransactionInitialFlow('select');
    setIsAddTransactionOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header & KPI Summary */}
        <Header
          config={config}
          summary={summary}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onCurrentMonth={handleCurrentMonth}
          onOpenQuickUpdate={() => {
            setQuickUpdateTab('checking');
            setIsQuickUpdateOpen(true);
          }}
          onOpenAddTransaction={() => {
            setAddTransactionInitialDate(undefined);
            setAddTransactionInitialFlow('select');
            setIsAddTransactionOpen(true);
          }}
          onOpenConfig={() => setIsConfigOpen(true)}
        />

        {/* Daily Running Balance Chart */}
        <DailyBalanceChart
          summary={summary}
          safeBufferAmount={config.account.safeBufferAmount}
        />

        {/* View Switcher & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar View
            </button>
            <button
              onClick={() => setViewMode('ledger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Daily Ledger
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            {summary.monthName} • End balance:{' '}
            <span
              className={`font-semibold ${
                summary.projectedEndingBalance < 0 ? 'text-rose-400' : 'text-cyan-300'
              }`}
            >
              ${summary.projectedEndingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* View Component */}
        {viewMode === 'calendar' ? (
          <CalendarView
            summary={summary}
            config={config}
            onUpdateAutoDepositOverride={handleUpdateAutoDepositOverride}
            onOpenQuickPaydownWithDate={handleOpenPaydownModalWithDate}
            onOpenAddTransactionWithDate={handleOpenAddTransactionWithDate}
            onDeleteExtraPaydown={handleDeleteExtraPaydown}
            onDeleteTransaction={handleDeleteTransaction}
          />
        ) : (
          <DailyLedgerView
            summary={summary}
            config={config}
            onUpdateAutoDepositOverride={handleUpdateAutoDepositOverride}
            onOpenQuickPaydownWithDate={handleOpenPaydownModalWithDate}
            onDeleteExtraPaydown={handleDeleteExtraPaydown}
            onOpenAddTransactionWithDate={handleOpenAddTransactionWithDate}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
      </div>

      {/* Modals */}
      {isQuickUpdateOpen && (
        <QuickUpdateModal
          isOpen={isQuickUpdateOpen}
          onClose={() => setIsQuickUpdateOpen(false)}
          config={config}
          onSaveConfig={handleSaveConfig}
          initialTab={quickUpdateTab}
        />
      )}

      {isConfigOpen && (
        <ConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          config={config}
          onSaveConfig={handleSaveConfig}
          onOpenAddTransaction={() => {
            setAddTransactionInitialDate(undefined);
            setAddTransactionInitialFlow('select');
            setIsAddTransactionOpen(true);
          }}
        />
      )}

      {isAddTransactionOpen && (
        <AddTransactionModal
          key={`${addTransactionInitialFlow}-${addTransactionInitialDate || 'none'}`}
          isOpen={isAddTransactionOpen}
          onClose={() => setIsAddTransactionOpen(false)}
          config={config}
          onAddTransaction={handleAddTransaction}
          onAddCardPayment={handleAddCardPayment}
          onDeleteCardPayment={handleDeleteExtraPaydown}
          onDeleteTransaction={handleDeleteTransaction}
          initialDate={addTransactionInitialDate}
          initialFlow={addTransactionInitialFlow}
        />
      )}
    </div>
  );
}

export default App;
