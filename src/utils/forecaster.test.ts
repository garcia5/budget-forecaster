import { describe, it, expect } from 'vitest';
import { calculateDailyForecast, getDaysInMonth } from './forecaster';
import type { BudgetConfig } from '../types/budget';

describe('Forecaster Engine', () => {
  const baseConfig: BudgetConfig = {
    account: {
      currentCheckingBalance: 5000,
      asOfDate: '2026-03-01',
      safeBufferAmount: 1000,
    },
    incomes: [
      {
        id: 'inc-1',
        name: 'Biweekly Paycheck',
        amount: 2500,
        schedule: {
          type: 'biweekly',
          anchorDate: '2026-03-06',
        },
        active: true,
      },
    ],
    bills: [
      {
        id: 'bill-rent',
        name: 'Rent (ACH)',
        amount: 1800,
        dayOfMonth: 1,
        active: true,
      },
      {
        id: 'bill-wifi',
        name: 'Internet (ACH)',
        amount: 80,
        dayOfMonth: 10,
        active: true,
      },
    ],
    creditCards: [
      {
        id: 'card-amex',
        name: 'Amex Gold',
        statementCloseDay: 18,
        paymentDueDay: 13,
        currentStatementBalance: 1200,
        autoPayFromChecking: true,
        extraPayments: [],
      },
    ],
    autoDeposits: [
      {
        id: 'ad-hysa',
        name: 'HYSA Savings',
        defaultAmount: 500,
        scheduleType: 'monthly',
        dayOfMonth: 5,
        overrides: {},
        active: true,
      },
    ],
    transactions: [],
  };

  it('calculates days in month properly', () => {
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(getDaysInMonth(2026, 3)).toBe(31);
    expect(getDaysInMonth(2026, 4)).toBe(30);
  });

  it('projects daily balances continuously for March 2026', () => {
    const summary = calculateDailyForecast(baseConfig, 2026, 3);
    expect(summary.days.length).toBe(31);
    expect(summary.startingBalance).toBe(5000);

    const day1 = summary.days[0];
    expect(day1.startingBalance).toBe(5000);
    expect(day1.outflows.some(o => o.name === 'Rent (ACH)' && o.amount === 1800)).toBe(true);
    expect(day1.endingBalance).toBe(3200);

    for (let i = 1; i < summary.days.length; i++) {
      expect(summary.days[i].startingBalance).toBe(summary.days[i - 1].endingBalance);
    }
  });

  it('triggers biweekly income on anchor date and every 14 days', () => {
    const summary = calculateDailyForecast(baseConfig, 2026, 3);
    const day6 = summary.days[5];
    const day20 = summary.days[19];
    const day7 = summary.days[6];

    expect(day6.inflows.some(i => i.name === 'Biweekly Paycheck' && i.amount === 2500)).toBe(true);
    expect(day20.inflows.some(i => i.name === 'Biweekly Paycheck' && i.amount === 2500)).toBe(true);
    expect(day7.inflows.length).toBe(0);
  });

  it('triggers credit card autopay on payment due date', () => {
    const summary = calculateDailyForecast(baseConfig, 2026, 3);
    const day13 = summary.days[12];
    const ccOutflow = day13.outflows.find(o => o.category === 'credit_card_autopay');
    expect(ccOutflow).toBeDefined();
    expect(ccOutflow?.amount).toBe(1200);
  });

  it('handles extra credit card paydowns and reduces autopay accordingly', () => {
    const configWithExtraPaydown: BudgetConfig = {
      ...baseConfig,
      creditCards: [
        {
          ...baseConfig.creditCards[0],
          extraPayments: [
            {
              id: 'extra-1',
              cardId: 'card-amex',
              date: '2026-03-08',
              amount: 400,
              reducesStatementAutopay: true,
            },
          ],
        },
      ],
    };

    const summary = calculateDailyForecast(configWithExtraPaydown, 2026, 3);
    const day8 = summary.days[7];
    const extraOutflow = day8.outflows.find(o => o.category === 'credit_card_extra_payment');
    expect(extraOutflow).toBeDefined();
    expect(extraOutflow?.amount).toBe(400);

    const day13 = summary.days[12];
    const ccAutopay = day13.outflows.find(o => o.category === 'credit_card_autopay');
    expect(ccAutopay).toBeDefined();
    expect(ccAutopay?.amount).toBe(800);
  });

  it('allows skipping and tweaking auto-deposits', () => {
    const normalSummary = calculateDailyForecast(baseConfig, 2026, 3);
    const day5Normal = normalSummary.days[4];
    expect(day5Normal.outflows.some(o => o.category === 'auto_deposit' && o.amount === 500 && !o.isSkipped)).toBe(true);

    const configSkipped: BudgetConfig = {
      ...baseConfig,
      autoDeposits: [
        {
          ...baseConfig.autoDeposits[0],
          overrides: {
            '2026-03': { skipped: true },
          },
        },
      ],
    };
    const skippedSummary = calculateDailyForecast(configSkipped, 2026, 3);
    const day5Skipped = skippedSummary.days[4];
    const adOutflow = day5Skipped.outflows.find(o => o.category === 'auto_deposit');
    expect(adOutflow?.isSkipped).toBe(true);
    expect(adOutflow?.amount).toBe(0);
    expect(skippedSummary.projectedEndingBalance).toBe(normalSummary.projectedEndingBalance + 500);

    const configTweaked: BudgetConfig = {
      ...baseConfig,
      autoDeposits: [
        {
          ...baseConfig.autoDeposits[0],
          overrides: {
            '2026-03': { overrideAmount: 200 },
          },
        },
      ],
    };
    const tweakedSummary = calculateDailyForecast(configTweaked, 2026, 3);
    const day5Tweaked = tweakedSummary.days[4];
    expect(day5Tweaked.outflows.find(o => o.category === 'auto_deposit')?.amount).toBe(200);
    expect(tweakedSummary.projectedEndingBalance).toBe(normalSummary.projectedEndingBalance + 300);
  });

  it('handles semi-monthly schedule with -1 as end of month', () => {
    const configSemiMonthly: BudgetConfig = {
      ...baseConfig,
      incomes: [
        {
          id: 'inc-semi',
          name: 'Semi-monthly Salary',
          amount: 3000,
          schedule: {
            type: 'semi-monthly',
            daysOfMonth: [15, -1],
          },
          active: true,
        },
      ],
    };

    const febSummary = calculateDailyForecast(configSemiMonthly, 2026, 2);
    expect(febSummary.days[14].inflows.some(i => i.amount === 3000)).toBe(true);
    expect(febSummary.days[27].inflows.some(i => i.amount === 3000)).toBe(true);

    const marSummary = calculateDailyForecast(configSemiMonthly, 2026, 3);
    expect(marSummary.days[14].inflows.some(i => i.amount === 3000)).toBe(true);
    expect(marSummary.days[30].inflows.some(i => i.amount === 3000)).toBe(true);
  });

  it('handles semi-monthly schedule with custom dates like 1st and 15th', () => {
    const configSemiCustom: BudgetConfig = {
      ...baseConfig,
      incomes: [
        {
          id: 'inc-custom-semi',
          name: 'Custom Semi Salary',
          amount: 1500,
          schedule: {
            type: 'semi-monthly',
            daysOfMonth: [1, 15],
          },
          active: true,
        },
      ],
    };

    const summary = calculateDailyForecast(configSemiCustom, 2026, 3);
    // Fires on Day 1 and Day 15
    expect(summary.days[0].inflows.some(i => i.name === 'Custom Semi Salary' && i.amount === 1500)).toBe(true);
    expect(summary.days[14].inflows.some(i => i.name === 'Custom Semi Salary' && i.amount === 1500)).toBe(true);
    expect(summary.days[30].inflows.length).toBe(0);
  });

  it('triggers biweekly auto-deposits according to anchor date', () => {
    const configBiweeklyAD: BudgetConfig = {
      ...baseConfig,
      autoDeposits: [
        {
          id: 'ad-biweekly',
          name: 'Biweekly Savings',
          defaultAmount: 250,
          scheduleType: 'biweekly',
          anchorDate: '2026-03-06',
          overrides: {},
          active: true,
        },
      ],
    };

    const summary = calculateDailyForecast(configBiweeklyAD, 2026, 3);
    // March 6 (day index 5) and March 20 (day index 19) should have auto-deposits
    const day6 = summary.days[5];
    const day20 = summary.days[19];
    const day7 = summary.days[6];

    expect(day6.outflows.some(o => o.name === 'Biweekly Savings' && o.amount === 250)).toBe(true);
    expect(day20.outflows.some(o => o.name === 'Biweekly Savings' && o.amount === 250)).toBe(true);
    expect(day7.outflows.some(o => o.name === 'Biweekly Savings')).toBe(false);
  });

  it('triggers semi-monthly auto-deposits twice a month (e.g. 15th and end of month)', () => {
    const configSemiAD: BudgetConfig = {
      ...baseConfig,
      autoDeposits: [
        {
          id: 'ad-semi',
          name: 'Twice-a-Month Transfer',
          defaultAmount: 300,
          scheduleType: 'semi-monthly',
          daysOfMonth: [15, -1],
          overrides: {},
          active: true,
        },
      ],
    };

    const febSummary = calculateDailyForecast(configSemiAD, 2026, 2);
    // In Feb 2026 (28 days): fires on 15 and 28
    expect(febSummary.days[14].outflows.some(o => o.name === 'Twice-a-Month Transfer' && o.amount === 300)).toBe(true);
    expect(febSummary.days[27].outflows.some(o => o.name === 'Twice-a-Month Transfer' && o.amount === 300)).toBe(true);
    expect(febSummary.days[13].outflows.some(o => o.name === 'Twice-a-Month Transfer')).toBe(false);

    const marSummary = calculateDailyForecast(configSemiAD, 2026, 3);
    // In Mar 2026 (31 days): fires on 15 and 31
    expect(marSummary.days[14].outflows.some(o => o.name === 'Twice-a-Month Transfer' && o.amount === 300)).toBe(true);
    expect(marSummary.days[30].outflows.some(o => o.name === 'Twice-a-Month Transfer' && o.amount === 300)).toBe(true);
  });

  it('correctly calculates total monthly inflows, total outflows, and net cashflow', () => {
    const summary = calculateDailyForecast(baseConfig, 2026, 3);
    // baseConfig has 2 biweekly paychecks of $2500 in March 2026 = $5,000
    expect(summary.totalInflows).toBe(5000);
    expect(summary.totalBills).toBe(1880); // Rent 1800 + Internet 80
    expect(summary.totalAutoDeposits).toBe(500); // HYSA
    expect(summary.totalCreditCardPayments).toBe(1200); // Amex
    // Net cashflow: 5000 - (1880 + 500 + 1200) = 5000 - 3580 = +1420
    expect(summary.netCashflow).toBe(1420);
    // Ending balance minus starting balance must equal net cashflow
    expect(summary.projectedEndingBalance - summary.startingBalance).toBe(summary.netCashflow);
  });

  it('correctly reports lowest projected balance date and amount', () => {
    const summary = calculateDailyForecast(baseConfig, 2026, 3);
    expect(summary.lowestProjectedBalance).toBeLessThanOrEqual(summary.startingBalance);
    expect(summary.lowestBalanceDate).toMatch(/^2026-03-\d{2}$/);
  });

  it('handles ad-hoc checking inflow and outflow transactions on specific days', () => {
    const configWithTx: BudgetConfig = {
      ...baseConfig,
      transactions: [
        {
          id: 'tx-1',
          accountType: 'checking',
          name: 'Freelance Bonus',
          amount: 500,
          type: 'inflow',
          date: '2026-03-08',
        },
        {
          id: 'tx-2',
          accountType: 'checking',
          name: 'Plumbing Repair',
          amount: 250,
          type: 'outflow',
          date: '2026-03-08',
        },
      ],
    };

    const summary = calculateDailyForecast(configWithTx, 2026, 3);
    const day8 = summary.days[7];

    expect(day8.inflows.some(i => i.name === 'Freelance Bonus' && i.amount === 500)).toBe(true);
    expect(day8.outflows.some(o => o.name === 'Plumbing Repair' && o.amount === 250)).toBe(true);
    expect(day8.netDailyChange).toBe(250); // +500 - 250 = +250
  });

  it('handles credit card charge without deducting cash on charge date, and rolls it into autopay on due date', () => {
    const configWithCardTx: BudgetConfig = {
      ...baseConfig,
      transactions: [
        {
          id: 'tx-card-1',
          accountType: 'credit_card',
          cardId: 'card-amex',
          name: 'Target Shopping',
          amount: 150,
          type: 'outflow',
          date: '2026-03-04',
        },
      ],
    };

    const summary = calculateDailyForecast(configWithCardTx, 2026, 3);
    const day4 = summary.days[3]; // March 4
    const day13 = summary.days[12]; // March 13 (payment due date)

    // On March 4: card charge appears in day's transactions for tracking, but does not deduct from cash
    const day4Charge = day4.outflows.find(o => o.category === 'credit_card_charge');
    expect(day4Charge).toBeDefined();
    expect(day4Charge?.amount).toBe(150);
    expect(day4.netDailyChange).toBe(0); // Cash checking balance is NOT affected on March 4

    // On March 13 (autopay due date): Autopay is $1,200 (base statement) + $150 (card charge) = $1,350
    const autopayOutflow = day13.outflows.find(o => o.category === 'credit_card_autopay');
    expect(autopayOutflow).toBeDefined();
    expect(autopayOutflow?.amount).toBe(1350);
  });

  it('does not take into account past dates when calculating lowest projected balance', () => {
    // Suppose asOfDate is March 15, 2026 with checking balance of $4,000.
    // A large bill of $3,500 occurs on March 1 (in the past relative to March 15).
    // The forward projection from March 15 remains at $4,000+.
    const configMidMonth: BudgetConfig = {
      ...baseConfig,
      account: {
        currentCheckingBalance: 4000,
        asOfDate: '2026-03-15',
        safeBufferAmount: 1000,
      },
      bills: [
        {
          id: 'bill-rent',
          name: 'Big Rent Bill',
          amount: 3500,
          dayOfMonth: 1, // March 1st (in the past)
          active: true,
        },
      ],
      creditCards: [],
      autoDeposits: [],
    };

    const summary = calculateDailyForecast(configMidMonth, 2026, 3, '2026-03-15');

    // Lowest balance must strictly be evaluated from March 15 and forward
    expect(summary.lowestBalanceDate >= '2026-03-15').toBe(true);
    expect(summary.lowestProjectedBalance).toBeGreaterThanOrEqual(4000);
  });

  it('deducts extra card payment from checking on payment date and reduces upcoming autopay', () => {
    const configWithPaydown: BudgetConfig = {
      ...baseConfig,
      creditCards: [
        {
          id: 'card-amex',
          name: 'Amex Gold',
          statementCloseDay: 18,
          paymentDueDay: 13,
          currentStatementBalance: 1200,
          autoPayFromChecking: true,
          extraPayments: [
            {
              id: 'extra-1',
              cardId: 'card-amex',
              date: '2026-03-05',
              amount: 400,
              reducesStatementAutopay: true,
            },
          ],
        },
      ],
    };

    const summary = calculateDailyForecast(configWithPaydown, 2026, 3);
    const day5 = summary.days[4];
    const day13 = summary.days[12];

    // Day 5: extra paydown outflow of $400
    const paydownOutflow = day5.outflows.find(o => o.category === 'credit_card_extra_payment');
    expect(paydownOutflow).toBeDefined();
    expect(paydownOutflow?.amount).toBe(400);

    // Day 13: upcoming autopay is reduced from $1200 to $800 ($1200 - $400)
    const autopayOutflow = day13.outflows.find(o => o.category === 'credit_card_autopay');
    expect(autopayOutflow).toBeDefined();
    expect(autopayOutflow?.amount).toBe(800);
  });

  it('correctly sets isToday and isPast relative to the current date even when asOfDate is yesterday', () => {
    // asOfDate is 2026-09-08 (yesterday), current date is 2026-09-09 (today)
    const configWithYesterdayAsOf: BudgetConfig = {
      ...baseConfig,
      account: {
        currentCheckingBalance: 3000,
        asOfDate: '2026-09-08',
        safeBufferAmount: 500,
      },
      bills: [],
      creditCards: [],
      autoDeposits: [],
    };

    const summary = calculateDailyForecast(configWithYesterdayAsOf, 2026, 9, '2026-09-09');

    const day8 = summary.days.find(d => d.date === '2026-09-08');
    const day9 = summary.days.find(d => d.date === '2026-09-09');
    const day10 = summary.days.find(d => d.date === '2026-09-10');

    // Day 8 (yesterday): isPast is true, isToday is false
    expect(day8?.isToday).toBe(false);
    expect(day8?.isPast).toBe(true);

    // Day 9 (today): isToday is true, isPast is false
    expect(day9?.isToday).toBe(true);
    expect(day9?.isPast).toBe(false);

    // Day 10 (tomorrow): isToday is false, isPast is false
    expect(day10?.isToday).toBe(false);
    expect(day10?.isPast).toBe(false);
  });
});


