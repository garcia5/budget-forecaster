import React, { useState } from 'react';
import type { BudgetConfig, AccountType, AccountTransaction, CreditCardExtraPayment } from '../types/budget';
import {
  X,
  DollarSign,
  CreditCard,
  Building,
  Info,
  ArrowLeft,
  ArrowRight,
  Receipt,
  Sparkles,
  Calendar,
  Trash2,
} from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BudgetConfig;
  onAddTransaction: (transaction: Omit<AccountTransaction, 'id'>) => void;
  onAddCardPayment: (payment: Omit<CreditCardExtraPayment, 'id'>) => void;
  onDeleteCardPayment?: (cardId: string, paymentId: string) => void;
  onDeleteTransaction?: (id: string) => void;
  initialDate?: string;
  initialFlow?: 'select' | 'transaction' | 'card_payment';
  initialAccountType?: AccountType;
  initialCardId?: string;
}

const CATEGORY_OPTIONS = [
  'Groceries',
  'Dining Out',
  'Shopping',
  'Utilities',
  'Travel & Transit',
  'Entertainment',
  'Health & Wellness',
  'Home & Rent',
  'Personal Care',
  'Freelance / Bonus',
  'Other',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  config,
  onAddTransaction,
  onAddCardPayment,
  onDeleteCardPayment,
  onDeleteTransaction,
  initialDate,
  initialFlow = 'select',
  initialAccountType = 'checking',
  initialCardId,
}) => {
  const [currentStep, setCurrentStep] = useState<'select' | 'transaction' | 'card_payment'>(initialFlow);

  const allExtraPayments = (config.creditCards || [])
    .flatMap((card) =>
      (card.extraPayments || []).map((payment) => ({
        card,
        payment,
      }))
    )
    .sort((a, b) => a.payment.date.localeCompare(b.payment.date));

  const allTransactions = [...(config.transactions || [])].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  // Transaction form states
  const [accountType, setAccountType] = useState<AccountType>(initialAccountType);
  const [cardId, setCardId] = useState<string>(
    initialCardId || config.creditCards[0]?.id || ''
  );
  const [type, setType] = useState<'inflow' | 'outflow'>('outflow');
  const [name, setName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(
    initialDate || config.account.asOfDate || new Date().toISOString().slice(0, 10)
  );
  const [category, setCategory] = useState<string>('Groceries');
  const [note, setNote] = useState<string>('');

  // Card payment form states
  const [paydownCardId, setPaydownCardId] = useState<string>(
    initialCardId || config.creditCards[0]?.id || ''
  );
  const [paydownAmount, setPaydownAmount] = useState<string>('');
  const [paydownDate, setPaydownDate] = useState<string>(
    initialDate || config.account.asOfDate || new Date().toISOString().slice(0, 10)
  );
  const [paydownNote, setPaydownNote] = useState<string>('');
  const [reducesAutopay, setReducesAutopay] = useState<boolean>(true);

  if (!isOpen) return null;

  const selectedCard = config.creditCards.find(c => c.id === cardId);
  const selectedPaydownCard = config.creditCards.find(c => c.id === paydownCardId);

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !date) {
      return;
    }

    onAddTransaction({
      accountType,
      cardId: accountType === 'credit_card' ? cardId : undefined,
      name: name.trim(),
      amount: parsedAmount,
      type,
      date,
      category: category.trim() || undefined,
      note: note.trim() || undefined,
    });

    onClose();
  };

  const handleCardPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(paydownAmount);
    if (!paydownCardId || isNaN(parsedAmount) || parsedAmount <= 0 || !paydownDate) {
      return;
    }

    onAddCardPayment({
      cardId: paydownCardId,
      amount: parsedAmount,
      date: paydownDate,
      reducesStatementAutopay: reducesAutopay,
      note: paydownNote.trim() || undefined,
    });

    onClose();
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* ================= PAGE 1: SELECTION SCREEN ================= */}
        {currentStep === 'select' && (
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white m-0">Add to Forecast</h3>
                  <p className="text-xs text-slate-400 m-0">
                    Choose what you would like to record
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selection Options */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed m-0">
                Select whether you want to record an ad-hoc income/expense transaction, or make a payment from Checking to knock down a credit card balance.
              </p>

              <div className="grid grid-cols-1 gap-3.5">
                {/* Option 1: Transaction */}
                <button
                  type="button"
                  onClick={() => setCurrentStep('transaction')}
                  className="group w-full p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/50 hover:border-emerald-500/60 text-left transition-all cursor-pointer flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                        Transaction
                      </span>
                      <span className="text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                        Expense / Deposit
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Record spending or income directly against your Checking Account or an individual Credit Card charge.
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                      Continue to transaction details <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>

                {/* Option 2: Card Payment */}
                <button
                  type="button"
                  onClick={() => setCurrentStep('card_payment')}
                  disabled={config.creditCards.length === 0}
                  className={`group w-full p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/50 hover:border-amber-500/60 text-left transition-all cursor-pointer flex items-start gap-4 ${
                    config.creditCards.length === 0 ? 'opacity-40 cursor-not-allowed hover:border-slate-800' : ''
                  }`}
                >
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">
                        Card Payment
                      </span>
                      <span className="text-[11px] font-medium bg-amber-950/80 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-full">
                        Pay Card Down
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Make an extra payment from Checking on any date to pay down an existing credit card balance and optionally reduce autopay.
                    </p>
                    {config.creditCards.length === 0 ? (
                      <p className="text-[11px] text-rose-400 mt-2">
                        No credit cards configured yet. Add credit cards in Settings.
                      </p>
                    ) : (
                      <div className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                        Continue to payment details <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-950/40 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ================= PAGE 2: TRANSACTION FORM ================= */}
        {currentStep === 'transaction' && (
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCurrentStep('select')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer mr-1"
                  title="Back to selection"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white m-0">Add Transaction</h3>
                  <p className="text-xs text-slate-400 m-0">
                    Record ad-hoc spending or income to Checking or a Credit Card
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Account Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Account
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('checking')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      accountType === 'checking'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    Checking Account
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('credit_card')}
                    disabled={config.creditCards.length === 0}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      accountType === 'credit_card'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    } ${config.creditCards.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Credit Card
                  </button>
                </div>
              </div>

              {/* Credit Card Selector if accountType === 'credit_card' */}
              {accountType === 'credit_card' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Which Credit Card?
                  </label>
                  <select
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                    required
                  >
                    {config.creditCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name} (Due {card.paymentDueDay}th • Bal: ${card.currentStatementBalance.toLocaleString('en-US')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Transaction Type */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('outflow')}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      type === 'outflow'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {accountType === 'checking' ? '💸 Expense / Withdrawal' : '💳 Card Charge / Purchase'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('inflow')}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      type === 'inflow'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {accountType === 'checking' ? '💰 Deposit / Income' : '↩️ Card Refund / Credit'}
                  </button>
                </div>
              </div>

              {/* Description / Merchant & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Description / Merchant
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={accountType === 'checking' ? 'e.g. Venmo to Alex, Car repair' : "e.g. Trader Joe's, Flight ticket"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Date & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note (Optional) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. reimbursed by work, annual subscription"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Explanation Info Banner */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  {accountType === 'checking' ? (
                    <span>
                      <strong className="text-slate-200">Checking impact:</strong> Directly adjusts your cash checking balance on{' '}
                      <span className="text-emerald-300 font-medium">{date || 'selected date'}</span>.
                    </span>
                  ) : (
                    <span>
                      <strong className="text-slate-200">Credit Card impact:</strong> Tracked on {date || 'selected date'} and automatically rolls into{' '}
                      <span className="text-amber-300 font-medium">
                        {selectedCard?.name || 'card'} upcoming statement autopay
                      </span>{' '}
                      from checking on the {selectedCard?.paymentDueDay || 'due'}th.
                    </span>
                  )}
                </div>
              </div>

              {/* Recorded Transactions Section */}
              {allTransactions.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Recorded Transactions ({allTransactions.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Click trash to delete
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {allTransactions.map((tx) => {
                      const isChecking = tx.accountType === 'checking';
                      const card = tx.cardId ? config.creditCards.find((c) => c.id === tx.cardId) : undefined;
                      const isInflow = tx.type === 'inflow';

                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isChecking
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {isChecking ? <Building className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate flex items-center gap-2">
                                <span>{tx.name}</span>
                                <span
                                  className={`font-mono font-medium ${
                                    isInflow ? 'text-emerald-400' : 'text-slate-300'
                                  }`}
                                >
                                  {isInflow ? '+' : '-'}{formatMoney(tx.amount)}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                                <span>{tx.date}</span>
                                <span className="text-slate-500">•</span>
                                <span>{isChecking ? 'Checking' : card?.name || 'Credit Card'}</span>
                                {tx.category && (
                                  <>
                                    <span className="text-slate-500">•</span>
                                    <span>{tx.category}</span>
                                  </>
                                )}
                                {tx.note && <span className="truncate italic text-slate-500">"{tx.note}"</span>}
                              </div>
                            </div>
                          </div>
                          {onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={() => onDeleteTransaction(tx.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                              title="Delete this transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep('select')}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    Add Transaction
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ================= PAGE 2: CARD PAYMENT FORM ================= */}
        {currentStep === 'card_payment' && (
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCurrentStep('select')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer mr-1"
                  title="Back to selection"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white m-0">Pay Card Down</h3>
                  <p className="text-xs text-slate-400 m-0">
                    Record a payment from Checking to knock down a card balance
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCardPaymentSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Card Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Which Credit Card?
                </label>
                <select
                  value={paydownCardId}
                  onChange={(e) => setPaydownCardId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  required
                >
                  {config.creditCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} (Due {card.paymentDueDay}th • Statement Bal: {formatMoney(card.currentStatementBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Payment Amount ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={paydownAmount}
                      onChange={(e) => setPaydownAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Payment Date
                  </label>
                  <input
                    type="date"
                    value={paydownDate}
                    onChange={(e) => setPaydownDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Reduces Autopay Checkbox */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="reducesAutopayModal"
                  checked={reducesAutopay}
                  onChange={(e) => setReducesAutopay(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
                />
                <label htmlFor="reducesAutopayModal" className="text-xs text-slate-300 cursor-pointer">
                  <span className="font-semibold text-white block">Reduce upcoming autopay</span>
                  Deduct this amount from the scheduled full-statement autopay on the {selectedPaydownCard?.paymentDueDay || 'due'}th of the month.
                </label>
              </div>

              {/* Note (Optional) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={paydownNote}
                  onChange={(e) => setPaydownNote(e.target.value)}
                  placeholder="e.g. bonus payment, knocked down card balance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Explanation Info Banner */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span>
                    <strong className="text-slate-200">Checking impact:</strong> Deducts{' '}
                    <span className="text-amber-300 font-semibold">
                      {parseFloat(paydownAmount) > 0 ? formatMoney(parseFloat(paydownAmount)) : '$0.00'}
                    </span>{' '}
                    from Checking on <span className="text-white font-medium">{paydownDate || 'selected date'}</span>.{' '}
                    {reducesAutopay
                      ? `Upcoming statement autopay on the ${selectedPaydownCard?.paymentDueDay || 'due'}th will be reduced accordingly.`
                      : 'Scheduled statement autopay amount will remain unchanged.'}
                  </span>
                </div>
              </div>

              {/* Recorded Card Payments Section */}
              {allExtraPayments.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Recorded Card Payments ({allExtraPayments.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Click trash to delete
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {allExtraPayments.map(({ card, payment }) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate flex items-center gap-2">
                              <span>{card.name}</span>
                              <span className="text-amber-400 font-mono font-medium">-{formatMoney(payment.amount)}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                              <span>{payment.date}</span>
                              {payment.note && <span className="truncate italic text-slate-500">"{payment.note}"</span>}
                              {payment.reducesStatementAutopay && (
                                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                  Reduces autopay
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {onDeleteCardPayment && (
                          <button
                            type="button"
                            onClick={() => onDeleteCardPayment(card.id, payment.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                            title="Delete this payment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep('select')}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                  >
                    Record Card Payment
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
