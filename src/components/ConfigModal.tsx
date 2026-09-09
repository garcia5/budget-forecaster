import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  Building,
  CreditCard,
  PiggyBank,
  Download,
  Upload,
  RotateCcw,
  Check,
  Receipt,
  HardDrive,
} from 'lucide-react';
import type {
  BudgetConfig,
  IncomeSource,
  StaticBill,
  CreditCard as CreditCardType,
  AutoDeposit,
  AccountTransaction,
} from '../types/budget';
import { exportConfigAsJson, importConfigFromJson, saveBudgetConfigToDisk } from '../utils/storage';
import { getDefaultBudgetData } from '../utils/defaultData';
import { ScheduleInputs } from './ScheduleInputs';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BudgetConfig;
  onSaveConfig: (newConfig: BudgetConfig) => void;
  onOpenAddTransaction?: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onOpenAddTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'income' | 'bills' | 'cards' | 'savings' | 'transactions' | 'data'>('income');
  const [incomes, setIncomes] = useState<IncomeSource[]>(config.incomes);
  const [bills, setBills] = useState<StaticBill[]>(config.bills);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>(config.creditCards);
  const [autoDeposits, setAutoDeposits] = useState<AutoDeposit[]>(config.autoDeposits);
  const [transactions, setTransactions] = useState<AccountTransaction[]>(config.transactions || []);
  const [transactionAccountFilter, setTransactionAccountFilter] = useState<string>('all');
  const [diskSyncStatus, setDiskSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    onSaveConfig({
      ...config,
      incomes,
      bills,
      creditCards,
      autoDeposits,
      transactions,
    });
    onClose();
  };

  const handleAddIncome = () => {
    const newInc: IncomeSource = {
      id: `inc-${Date.now()}`,
      name: 'New Income',
      amount: 2000,
      schedule: {
        type: 'biweekly',
        anchorDate: '2026-03-06',
        daysOfMonth: [15, -1],
      },
      active: true,
    };
    setIncomes([...incomes, newInc]);
  };

  const handleRemoveIncome = (id: string) => {
    setIncomes(incomes.filter(i => i.id !== id));
  };

  const handleAddBill = () => {
    const newBill: StaticBill = {
      id: `bill-${Date.now()}`,
      name: 'New ACH Bill',
      amount: 100,
      dayOfMonth: 1,
      category: 'Utilities',
      active: true,
    };
    setBills([...bills, newBill]);
  };

  const handleRemoveBill = (id: string) => {
    setBills(bills.filter(b => b.id !== id));
  };

  const handleAddCard = () => {
    const newCard: CreditCardType = {
      id: `card-${Date.now()}`,
      name: 'New Credit Card',
      statementCloseDay: 15,
      paymentDueDay: 10,
      currentStatementBalance: 0,
      autoPayFromChecking: true,
      extraPayments: [],
    };
    setCreditCards([...creditCards, newCard]);
  };

  const handleRemoveCard = (id: string) => {
    setCreditCards(creditCards.filter(c => c.id !== id));
  };

  const handleAddAutoDeposit = () => {
    const newDeposit: AutoDeposit = {
      id: `ad-${Date.now()}`,
      name: 'New Savings Transfer',
      defaultAmount: 300,
      scheduleType: 'per-paycheck',
      anchorDate: '2026-03-06',
      overrides: {},
      active: true,
    };
    setAutoDeposits([...autoDeposits, newDeposit]);
  };

  const handleRemoveAutoDeposit = (id: string) => {
    setAutoDeposits(autoDeposits.filter(a => a.id !== id));
  };

  const handleExport = () => {
    exportConfigAsJson({
      ...config,
      incomes,
      bills,
      creditCards,
      autoDeposits,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importConfigFromJson(file);
      onSaveConfig(imported);
      setIncomes(imported.incomes);
      setBills(imported.bills);
      setCreditCards(imported.creditCards);
      setAutoDeposits(imported.autoDeposits);
      alert('Configuration imported successfully!');
    } catch (err: any) {
      alert('Failed to import JSON: ' + (err.message || 'Invalid format'));
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all data and rules to defaults? This will erase custom entries.')) {
      const def = getDefaultBudgetData();
      setIncomes(def.incomes);
      setBills(def.bills);
      setCreditCards(def.creditCards);
      setAutoDeposits(def.autoDeposits);
      onSaveConfig(def);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h2 className="text-lg font-bold text-white m-0">Budget Configuration & Rules</h2>
            <p className="text-xs text-slate-400 m-0">Configure recurring schedules, static ACH bills, cards, and auto-deposits</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 overflow-x-auto">
          {[
            { key: 'income', label: 'Income Schedules', icon: DollarSign },
            { key: 'bills', label: 'Static ACH Bills', icon: Building },
            { key: 'cards', label: 'Credit Cards', icon: CreditCard },
            { key: 'savings', label: 'Auto-Deposits', icon: PiggyBank },
            { key: 'transactions', label: `Transactions (${transactions.length})`, icon: Receipt },
            { key: 'data', label: 'Disk & Backup', icon: HardDrive },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: Income */}
          {activeTab === 'income' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 m-0">
                  Configure your recurring income streams and schedules (biweekly anchor, semi-monthly, monthly, etc.).
                </p>
                <button
                  type="button"
                  onClick={handleAddIncome}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Income Source
                </button>
              </div>

              <div className="space-y-3">
                {incomes.map((inc, index) => (
                  <div key={inc.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={inc.name}
                        onChange={e => {
                          const updated = [...incomes];
                          updated[index].name = e.target.value;
                          setIncomes(updated);
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-semibold text-sm flex-1 focus:outline-none focus:border-emerald-500"
                        placeholder="Income name"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={inc.active}
                            onChange={e => {
                              const updated = [...incomes];
                              updated[index].active = e.target.checked;
                              setIncomes(updated);
                            }}
                            className="rounded border-slate-700 text-emerald-500"
                          />
                          Active
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveIncome(inc.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Remove Income"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <ScheduleInputs
                      amount={inc.amount}
                      onAmountChange={val => {
                        const updated = [...incomes];
                        updated[index].amount = val;
                        setIncomes(updated);
                      }}
                      scheduleType={inc.schedule.type}
                      onScheduleTypeChange={newType => {
                        const updated = [...incomes];
                        updated[index].schedule.type = newType as any;
                        if (newType === 'semi-monthly' && (!updated[index].schedule.daysOfMonth || updated[index].schedule.daysOfMonth.length < 2)) {
                          updated[index].schedule.daysOfMonth = [15, -1];
                        }
                        if (newType === 'biweekly' && !updated[index].schedule.anchorDate) {
                          updated[index].schedule.anchorDate = '2026-03-06';
                        }
                        setIncomes(updated);
                      }}
                      anchorDate={inc.schedule.anchorDate}
                      onAnchorDateChange={d => {
                        const updated = [...incomes];
                        updated[index].schedule.anchorDate = d;
                        setIncomes(updated);
                      }}
                      daysOfMonth={inc.schedule.daysOfMonth}
                      onDaysOfMonthChange={days => {
                        const updated = [...incomes];
                        updated[index].schedule.daysOfMonth = days;
                        setIncomes(updated);
                      }}
                      dayOfMonth={inc.schedule.dayOfMonth}
                      onDayOfMonthChange={d => {
                        const updated = [...incomes];
                        updated[index].schedule.dayOfMonth = d;
                        setIncomes(updated);
                      }}
                      includePerPaycheck={false}
                      themeColor="emerald"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Static ACH Bills */}
          {activeTab === 'bills' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 m-0">
                  Fixed bills debited directly via ACH from your checking account on a specific day each month.
                </p>
                <button
                  type="button"
                  onClick={handleAddBill}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add ACH Bill
                </button>
              </div>

              <div className="space-y-2">
                {bills.map((bill, index) => (
                  <div key={bill.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={bill.name}
                        onChange={e => {
                          const updated = [...bills];
                          updated[index].name = e.target.value;
                          setBills(updated);
                        }}
                        placeholder="Bill name (e.g. Rent)"
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-semibold text-sm flex-1 focus:outline-none focus:border-rose-500"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bill.active}
                            onChange={e => {
                              const updated = [...bills];
                              updated[index].active = e.target.checked;
                              setBills(updated);
                            }}
                            className="rounded border-slate-700 text-rose-500"
                          />
                          Active
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveBill(bill.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Remove Bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Amount per Month ($)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={bill.amount || ''}
                            onChange={e => {
                              const updated = [...bills];
                              updated[index].amount = parseFloat(e.target.value) || 0;
                              setBills(updated);
                            }}
                            placeholder="0.00"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-2 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Due Day of Month
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={bill.dayOfMonth}
                          onChange={e => {
                            const updated = [...bills];
                            updated[index].dayOfMonth = parseInt(e.target.value) || 1;
                            setBills(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Credit Cards */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 m-0">
                  Credit cards and statement schedules. The statement balance is deducted on the payment due day.
                </p>
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Credit Card
                </button>
              </div>

              <div className="space-y-3">
                {creditCards.map((card, index) => (
                  <div key={card.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={card.name}
                        onChange={e => {
                          const updated = [...creditCards];
                          updated[index].name = e.target.value;
                          setCreditCards(updated);
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-semibold text-sm flex-1 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(card.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Remove Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Statement Close Day</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={card.statementCloseDay}
                          onChange={e => {
                            const updated = [...creditCards];
                            updated[index].statementCloseDay = parseInt(e.target.value) || 1;
                            setCreditCards(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Payment Due Day</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={card.paymentDueDay}
                          onChange={e => {
                            const updated = [...creditCards];
                            updated[index].paymentDueDay = parseInt(e.target.value) || 1;
                            setCreditCards(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-1 border-t border-slate-800/80 text-slate-400 gap-1">
                      <span className="text-[11px]">
                        Statement Balance:{' '}
                        <span className="font-semibold text-slate-200">
                          ${card.currentStatementBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {card.statementDate ? ` (as of ${card.statementDate})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Manage via <span className="text-emerald-400 font-medium">Update Balances</span> button up top
                      </span>
                    </div>

                    {card.extraPayments && card.extraPayments.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          Recorded Manual Paydowns ({card.extraPayments.length})
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {card.extraPayments.map(ep => (
                            <div key={ep.id} className="flex items-center justify-between text-xs bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                              <span className="text-slate-300">
                                {ep.date}: <span className="font-mono text-amber-400 font-medium">${ep.amount.toFixed(2)}</span>
                                {ep.note ? ` ("${ep.note}")` : ''}
                                {ep.reducesStatementAutopay && (
                                  <span className="ml-1.5 text-[10px] text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/40">
                                    Reduces autopay
                                  </span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...creditCards];
                                  updated[index].extraPayments = (card.extraPayments || []).filter(p => p.id !== ep.id);
                                  setCreditCards(updated);
                                }}
                                className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                                title="Delete paydown"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Auto-Deposits */}
          {activeTab === 'savings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 m-0">
                  Transfers to savings, HYSA, or investments that can be tweaked or skipped as needed.
                </p>
                <button
                  type="button"
                  onClick={handleAddAutoDeposit}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Auto-Deposit
                </button>
              </div>

              <div className="space-y-3">
                {autoDeposits.map((ad, index) => (
                  <div key={ad.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={ad.name}
                        onChange={e => {
                          const updated = [...autoDeposits];
                          updated[index].name = e.target.value;
                          setAutoDeposits(updated);
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-semibold text-sm flex-1 focus:outline-none focus:border-purple-500"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ad.active}
                            onChange={e => {
                              const updated = [...autoDeposits];
                              updated[index].active = e.target.checked;
                              setAutoDeposits(updated);
                            }}
                            className="rounded border-slate-700 text-purple-500"
                          />
                          Active
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveAutoDeposit(ad.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Remove Auto-Deposit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <ScheduleInputs
                      amount={ad.defaultAmount}
                      onAmountChange={val => {
                        const updated = [...autoDeposits];
                        updated[index].defaultAmount = val;
                        setAutoDeposits(updated);
                      }}
                      scheduleType={ad.scheduleType}
                      onScheduleTypeChange={newType => {
                        const updated = [...autoDeposits];
                        updated[index].scheduleType = newType as any;
                        if (newType === 'semi-monthly' && (!updated[index].daysOfMonth || updated[index].daysOfMonth.length < 2)) {
                          updated[index].daysOfMonth = [15, -1];
                        }
                        if (newType === 'biweekly' && !updated[index].anchorDate) {
                          updated[index].anchorDate = '2026-03-06';
                        }
                        setAutoDeposits(updated);
                      }}
                      anchorDate={ad.anchorDate}
                      onAnchorDateChange={d => {
                        const updated = [...autoDeposits];
                        updated[index].anchorDate = d;
                        setAutoDeposits(updated);
                      }}
                      daysOfMonth={ad.daysOfMonth}
                      onDaysOfMonthChange={days => {
                        const updated = [...autoDeposits];
                        updated[index].daysOfMonth = days;
                        setAutoDeposits(updated);
                      }}
                      dayOfMonth={ad.dayOfMonth}
                      onDayOfMonthChange={d => {
                        const updated = [...autoDeposits];
                        updated[index].dayOfMonth = d;
                        setAutoDeposits(updated);
                      }}
                      includePerPaycheck={true}
                      themeColor="purple"
                    />

                    {ad.overrides && Object.keys(ad.overrides).length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs bg-purple-950/20 px-3 py-2 rounded-lg border border-purple-800/30">
                        <span className="text-purple-300">
                          {Object.keys(ad.overrides).length} custom date override(s) (skips/tweaks)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...autoDeposits];
                            updated[index].overrides = {};
                            setAutoDeposits(updated);
                          }}
                          className="text-slate-300 hover:text-white text-[11px] flex items-center gap-1 cursor-pointer bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Clear All Overrides
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Ad-Hoc Transactions */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <div>
                  <h4 className="text-sm font-semibold text-white m-0">Ad-Hoc Account Transactions</h4>
                  <p className="text-xs text-slate-400 m-0">
                    Recorded spending or deposits on Checking and Credit Cards ({transactions.length} total)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={transactionAccountFilter}
                    onChange={(e) => setTransactionAccountFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">All Accounts</option>
                    <option value="checking">Checking Only</option>
                    {creditCards.map(c => (
                      <option key={c.id} value={c.id}>Card: {c.name}</option>
                    ))}
                  </select>

                  {onOpenAddTransaction && (
                    <button
                      type="button"
                      onClick={onOpenAddTransaction}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Transaction
                    </button>
                  )}
                </div>
              </div>

              {transactions.filter(t => {
                if (transactionAccountFilter === 'all') return true;
                if (transactionAccountFilter === 'checking') return t.accountType === 'checking';
                return t.accountType === 'credit_card' && t.cardId === transactionAccountFilter;
              }).length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                  <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium m-0">No transactions recorded yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 mb-3">
                    Record one-off expenses, deposits, or card charges to project your balances accurately.
                  </p>
                  {onOpenAddTransaction && (
                    <button
                      type="button"
                      onClick={onOpenAddTransaction}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/40 transition-colors cursor-pointer"
                    >
                      + Add Transaction
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Account</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-2 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {transactions
                        .filter(t => {
                          if (transactionAccountFilter === 'all') return true;
                          if (transactionAccountFilter === 'checking') return t.accountType === 'checking';
                          return t.accountType === 'credit_card' && t.cardId === transactionAccountFilter;
                        })
                        .map(tx => {
                          const card = creditCards.find(c => c.id === tx.cardId);
                          const isChecking = tx.accountType === 'checking';
                          const isInflow = tx.type === 'inflow';

                          return (
                            <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">{tx.date}</td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {isChecking ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                                    <Building className="w-3 h-3 text-emerald-400" /> Checking
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                                    <CreditCard className="w-3 h-3 text-amber-400" /> {card?.name || 'Card'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                    isInflow
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                      : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                  }`}
                                >
                                  {isChecking
                                    ? (isInflow ? 'Deposit' : 'Expense')
                                    : (isInflow ? 'Refund' : 'Card Charge')}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-medium text-white">{tx.name}</div>
                                {tx.category && <div className="text-[10px] text-slate-400">{tx.category}{tx.note ? ` • ${tx.note}` : ''}</div>}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold whitespace-nowrap">
                                <span className={isInflow ? 'text-emerald-400' : 'text-slate-200'}>
                                  {isInflow ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setTransactions(transactions.filter(t => t.id !== tx.id))}
                                  className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Delete transaction"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Data & Disk Backup */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white m-0 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-400" /> Durable Disk Storage (budget-data.json)
                  </h4>
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 m-0 leading-relaxed">
                  Automatic debounced disk flush is active. Every edit you make (updating balances, adding transactions, skipping/tweaking auto-deposits, or saving rules) is automatically saved to <code className="text-emerald-300 font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">budget-data.json</code> on disk in real-time. You never have to remember to manually sync.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setDiskSyncStatus('saving');
                      const ok = await saveBudgetConfigToDisk({
                        ...config,
                        incomes,
                        bills,
                        creditCards,
                        autoDeposits,
                        transactions,
                      });
                      setDiskSyncStatus(ok ? 'saved' : 'error');
                      setTimeout(() => setDiskSyncStatus('idle'), 3000);
                    }}
                    disabled={diskSyncStatus === 'saving'}
                    className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    {diskSyncStatus === 'saving' ? 'Flushing to Disk...' : diskSyncStatus === 'saved' ? '✓ Synced to Disk!' : 'Force Flush to Disk'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold text-white m-0 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-400" /> Export Configuration Backup
                </h4>
                <p className="text-xs text-slate-400 m-0 leading-relaxed">
                  Download all your schedules, bills, balances, and extra paydowns as a clean JSON file. You can back it up or edit it offline.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download JSON Backup
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold text-white m-0 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-cyan-400" /> Import Configuration
                </h4>
                <p className="text-xs text-slate-400 m-0 leading-relaxed">
                  Restore your budget setup from a previously exported JSON backup file.
                </p>
                <div className="pt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Select JSON File to Restore
                  </button>
                </div>
              </div>

              <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold text-rose-300 m-0 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-400" /> Reset to Initial Sample Data
                </h4>
                <p className="text-xs text-rose-300/80 m-0 leading-relaxed">
                  Replaces all current configurations with realistic sample paychecks, bills, cards, and auto-deposits.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-4 py-2 text-xs font-semibold bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset All Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <span className="text-[11px] text-slate-500">Changes are automatically saved to your browser</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save & Apply Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
