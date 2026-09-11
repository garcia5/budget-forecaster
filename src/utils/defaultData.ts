import type { BudgetConfig } from "../types/budget";
import { formatDate } from "./forecaster";

export function getDefaultBudgetData(): BudgetConfig {
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  return {
    account: {
      currentCheckingBalance: 4850,
      asOfDate: todayStr,
      safeBufferAmount: 1000,
    },
    incomes: [
      {
        id: "inc-primary",
        name: "Primary Paycheck",
        amount: 2800,
        schedule: {
          type: "biweekly",
          anchorDate: "2026-03-06",
        },
        active: true,
      },
      {
        id: "inc-side",
        name: "Side Project / Consulting",
        amount: 650,
        schedule: {
          type: "monthly",
          dayOfMonth: 1,
        },
        active: true,
      },
    ],
    bills: [
      {
        id: "bill-rent",
        name: "Apartment Rent (ACH)",
        amount: 1950,
        dayOfMonth: 1,
        category: "Housing",
        active: true,
      },
      {
        id: "bill-electric",
        name: "ConEd Electric (ACH)",
        amount: 115,
        dayOfMonth: 12,
        category: "Utilities",
        active: true,
      },
      {
        id: "bill-wifi",
        name: "Fios Internet (ACH)",
        amount: 70,
        dayOfMonth: 18,
        category: "Utilities",
        active: true,
      },
      {
        id: "bill-gym",
        name: "Gym Membership (ACH)",
        amount: 85,
        dayOfMonth: 24,
        category: "Health",
        active: true,
      },
    ],
    creditCards: [
      {
        id: "cc-amex",
        name: "Amex Gold",
        statementCloseDay: 18,
        paymentDueDay: 13,
        currentStatementBalance: 1140.25,
        statementDate: "2026-02-18",
        autoPayFromChecking: true,
        color: "#d97706",
        extraPayments: [],
      },
      {
        id: "cc-chase",
        name: "Chase Sapphire",
        statementCloseDay: 26,
        paymentDueDay: 21,
        currentStatementBalance: 825.5,
        statementDate: "2026-02-26",
        autoPayFromChecking: true,
        color: "#2563eb",
        extraPayments: [],
      },
    ],
    autoDeposits: [
      {
        id: "ad-hysa",
        name: "Emergency Fund (HYSA)",
        defaultAmount: 400,
        scheduleType: "per-paycheck",
        overrides: {},
        active: true,
      },
      {
        id: "ad-ira",
        name: "Vanguard Roth IRA",
        defaultAmount: 500,
        scheduleType: "monthly",
        dayOfMonth: 5,
        overrides: {},
        active: true,
      },
    ],
    transactions: [],
  };
}
