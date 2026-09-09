export type IncomeScheduleType = 'biweekly' | 'semi-monthly' | 'monthly' | 'exact-dates';

export interface IncomeSchedule {
  type: IncomeScheduleType;
  anchorDate?: string;      // YYYY-MM-DD for biweekly cadence calculation
  daysOfMonth?: number[];   // e.g. [15, -1] for 15th and last day of month (-1 represents last day)
  dayOfMonth?: number;      // e.g. 1 for 1st of every month
  exactDates?: string[];    // specific YYYY-MM-DD dates
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  schedule: IncomeSchedule;
  active: boolean;
}

export interface StaticBill {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;       // 1-31 (ACH direct debit from checking)
  category?: string;
  active: boolean;
}

export interface CreditCardExtraPayment {
  id: string;
  cardId: string;
  date: string;              // YYYY-MM-DD
  amount: number;
  note?: string;
  reducesStatementAutopay: boolean; // If true, decreases the remaining autopay due on statement due date
}

export interface CreditCard {
  id: string;
  name: string;
  statementCloseDay: number; // e.g. 18th
  paymentDueDay: number;     // e.g. 13th of following month
  currentStatementBalance: number;
  statementDate?: string;    // YYYY-MM-DD when statement closed
  autoPayFromChecking: boolean;
  extraPayments: CreditCardExtraPayment[];
  color?: string;
}

export interface AutoDepositOverride {
  skipped?: boolean;
  overrideAmount?: number;
}

export type AutoDepositScheduleType = 'monthly' | 'biweekly' | 'semi-monthly' | 'per-paycheck';

export interface AutoDeposit {
  id: string;
  name: string;
  defaultAmount: number;
  scheduleType: AutoDepositScheduleType;
  dayOfMonth?: number;
  daysOfMonth?: number[];   // e.g. [15, -1] for 15th & end of month
  anchorDate?: string;
  // Overrides keyed by YYYY-MM or YYYY-MM-DD
  overrides: Record<string, AutoDepositOverride>;
  active: boolean;
}

export interface AccountState {
  currentCheckingBalance: number;
  asOfDate: string; // YYYY-MM-DD
  safeBufferAmount: number; // Minimum balance target threshold (e.g. $1000)
}

export type AccountType = 'checking' | 'credit_card';

export interface AccountTransaction {
  id: string;
  accountType: AccountType;
  cardId?: string; // required if accountType === 'credit_card'
  name: string;
  amount: number;
  type: 'inflow' | 'outflow'; // For checking: inflow=deposit, outflow=expense. For card: outflow=charge/purchase, inflow=refund/credit.
  date: string; // YYYY-MM-DD
  category?: string;
  note?: string;
}

export interface ForecastTransaction {
  id: string;
  name: string;
  amount: number;
  category:
    | 'income'
    | 'bill'
    | 'credit_card_autopay'
    | 'credit_card_extra_payment'
    | 'auto_deposit'
    | 'checking_outflow'
    | 'checking_inflow'
    | 'credit_card_charge'
    | 'credit_card_credit';
  isSkipped?: boolean;
  meta?: Record<string, any>;
}

export interface DailyForecast {
  date: string;         // YYYY-MM-DD
  dayNumber: number;    // 1-31
  dayOfWeek: string;    // 'Sun', 'Mon', etc.
  isToday: boolean;
  isPast: boolean;
  startingBalance: number;
  inflows: ForecastTransaction[];
  outflows: ForecastTransaction[];
  netDailyChange: number;
  endingBalance: number;
}

export interface MonthlyForecastSummary {
  year: number;
  month: number; // 1-12
  monthName: string;
  startingBalance: number;
  projectedEndingBalance: number;
  lowestProjectedBalance: number;
  lowestBalanceDate: string;
  highestProjectedBalance: number;
  highestBalanceDate: string;
  totalInflows: number;
  totalBills: number;
  totalCreditCardPayments: number;
  totalAutoDeposits: number;
  totalCheckingInflows?: number;
  totalCheckingOutflows?: number;
  netCashflow: number;
  days: DailyForecast[];
}

export interface BudgetConfig {
  account: AccountState;
  incomes: IncomeSource[];
  bills: StaticBill[];
  creditCards: CreditCard[];
  autoDeposits: AutoDeposit[];
  transactions: AccountTransaction[];
}
