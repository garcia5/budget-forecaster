import type {
  BudgetConfig,
  DailyForecast,
  ForecastTransaction,
  MonthlyForecastSummary,
  IncomeSource,
  StaticBill,
} from "../types/budget";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function formatDate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y, month: m, day: d };
}

export function getDayDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T00:00:00");
  const d2 = new Date(dateStr2 + "T00:00:00");
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function isBankHoliday(year: number, month: number, day: number): boolean {
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 4 = Thu, ..., 6 = Sat

  // Fixed-date US Federal Reserve holidays (if falling on Sunday, observed the following Monday)
  const fixedHolidays = [
    { m: 1, d: 1 }, // New Year's Day
    { m: 6, d: 19 }, // Juneteenth National Independence Day
    { m: 7, d: 4 }, // Independence Day
    { m: 11, d: 11 }, // Veterans Day
    { m: 12, d: 25 }, // Christmas Day
  ];

  for (const h of fixedHolidays) {
    if (month === h.m && day === h.d) {
      return true;
    }
    if (month === h.m && day === h.d + 1 && dayOfWeek === 1) {
      return true;
    }
  }

  // Floating Monday holidays
  if (dayOfWeek === 1) {
    // Birthday of Martin Luther King, Jr. (3rd Monday in January)
    if (month === 1 && day >= 15 && day <= 21) return true;
    // Washington's Birthday / Presidents' Day (3rd Monday in February)
    if (month === 2 && day >= 15 && day <= 21) return true;
    // Memorial Day (Last Monday in May)
    if (month === 5 && day >= 25 && day <= 31) return true;
    // Labor Day (1st Monday in September)
    if (month === 9 && day >= 1 && day <= 7) return true;
    // Columbus Day / Indigenous Peoples' Day (2nd Monday in October)
    if (month === 10 && day >= 8 && day <= 14) return true;
  }

  // Thanksgiving Day (4th Thursday in November)
  if (month === 11 && dayOfWeek === 4 && day >= 22 && day <= 28) {
    return true;
  }

  return false;
}

export function isBusinessDay(year: number, month: number, day: number): boolean {
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  if (isBankHoliday(year, month, day)) return false;
  return true;
}

export function getNextBusinessDay(dateStr: string): string {
  const { year, month, day } = parseDateString(dateStr);
  const cur = new Date(year, month - 1, day);
  while (!isBusinessDay(cur.getFullYear(), cur.getMonth() + 1, cur.getDate())) {
    cur.setDate(cur.getDate() + 1);
  }
  return formatDate(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
}

interface NominalDateInfo {
  year: number;
  month: number;
  day: number;
  dateStr: string;
  daysInMonth: number;
}

export function getNominalDatesForBusinessDay(
  year: number,
  month: number,
  day: number,
): NominalDateInfo[] {
  if (!isBusinessDay(year, month, day)) {
    return [];
  }

  const dates: NominalDateInfo[] = [
    {
      year,
      month,
      day,
      dateStr: formatDate(year, month, day),
      daysInMonth: getDaysInMonth(year, month),
    },
  ];

  const cur = new Date(year, month - 1, day);
  while (true) {
    cur.setDate(cur.getDate() - 1);
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const d = cur.getDate();
    if (!isBusinessDay(y, m, d)) {
      dates.unshift({
        year: y,
        month: m,
        day: d,
        dateStr: formatDate(y, m, d),
        daysInMonth: getDaysInMonth(y, m),
      });
    } else {
      break;
    }
  }

  return dates;
}

export function isIncomeScheduled(
  income: IncomeSource,
  dateStr: string,
  dayNumber: number,
  daysInMonth: number,
): boolean {
  if (!income.active) return false;
  const { schedule } = income;

  switch (schedule.type) {
    case "biweekly": {
      if (!schedule.anchorDate) return false;
      const diff = getDayDifference(dateStr, schedule.anchorDate);
      return ((diff % 14) + 14) % 14 === 0;
    }
    case "semi-monthly": {
      const days = schedule.daysOfMonth || [15, -1];
      return days.some((d) => {
        if (d === -1) return dayNumber === daysInMonth;
        if (d < 0) return dayNumber === daysInMonth + d + 1;
        return dayNumber === d;
      });
    }
    case "monthly": {
      const targetDay = schedule.dayOfMonth ?? 1;
      const effectiveDay = Math.min(targetDay, daysInMonth);
      return dayNumber === effectiveDay;
    }
    case "exact-dates": {
      return (schedule.exactDates || []).includes(dateStr);
    }
    default:
      return false;
  }
}

export function isBillScheduled(bill: StaticBill, dayNumber: number, daysInMonth: number): boolean {
  if (!bill.active) return false;
  const effectiveDay = Math.min(bill.dayOfMonth, daysInMonth);
  return dayNumber === effectiveDay;
}

export function calculateDailyForecast(
  config: BudgetConfig,
  targetYear: number,
  targetMonth: number,
  currentDateStr?: string,
): MonthlyForecastSummary {
  const { account, incomes, bills, creditCards, autoDeposits, transactions = [] } = config;
  const asOf = account.asOfDate;
  const asOfParts = parseDateString(asOf);
  const todayStr = currentDateStr || getTodayDateString();

  const asOfDateObj = new Date(asOf + "T00:00:00");
  const targetMonthStartObj = new Date(targetYear, targetMonth - 1, 1);
  const targetMonthDays = getDaysInMonth(targetYear, targetMonth);

  function getDayTransactions(year: number, month: number, day: number) {
    const dateStr = formatDate(year, month, day);
    const daysInCurrentMonth = getDaysInMonth(year, month);
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    const inflows: ForecastTransaction[] = [];
    const outflows: ForecastTransaction[] = [];
    const nominalDatesForBusinessDay = getNominalDatesForBusinessDay(year, month, day);

    // 1. Incomes (shifted to next business day if weekend or holiday)
    for (const inc of incomes) {
      for (const nom of nominalDatesForBusinessDay) {
        if (isIncomeScheduled(inc, nom.dateStr, nom.day, nom.daysInMonth)) {
          inflows.push({
            id: `inc-${inc.id}-${nom.dateStr}`,
            name: inc.name,
            amount: inc.amount,
            category: "income",
            meta: {
              scheduledDate: nom.dateStr,
            },
          });
        }
      }
    }

    // 2. Static ACH Bills
    for (const bill of bills) {
      if (isBillScheduled(bill, day, daysInCurrentMonth)) {
        outflows.push({
          id: `bill-${bill.id}-${dateStr}`,
          name: bill.name,
          amount: bill.amount,
          category: "bill",
          meta: { category: bill.category },
        });
      }
    }

    // 3. Credit Cards
    for (const card of creditCards) {
      // Extra paydowns
      for (const payment of card.extraPayments || []) {
        if (payment.date === dateStr) {
          outflows.push({
            id: `cc-extra-${payment.id}`,
            name: `${card.name} (Extra Paydown)`,
            amount: payment.amount,
            category: "credit_card_extra_payment",
            meta: {
              cardId: card.id,
              cardName: card.name,
              note: payment.note,
              reducesStatementAutopay: payment.reducesStatementAutopay,
            },
          });
        }
      }

      // Autopay on statement payment due day (shifted to next business day if weekend or holiday)
      if (card.autoPayFromChecking) {
        for (const nom of nominalDatesForBusinessDay) {
          const effectiveDueDay = Math.min(card.paymentDueDay, nom.daysInMonth);
          if (nom.day === effectiveDueDay) {
            let payAmount = card.currentStatementBalance;

            // Extra paydowns that reduce statement autopay
            const qualifyingExtraPayments = (card.extraPayments || []).filter((p) => {
              if (!p.reducesStatementAutopay) return false;
              const pDate = new Date(p.date + "T00:00:00");
              const dueDate = new Date(nom.year, nom.month - 1, effectiveDueDay);
              const diffDays = (dueDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24);
              return diffDays >= 0 && diffDays <= 31;
            });
            const totalReduced = qualifyingExtraPayments.reduce((sum, p) => sum + p.amount, 0);

            // Card transactions in this cycle that roll into statement autopay
            const qualifyingCardTransactions = transactions.filter((tx) => {
              if (tx.accountType !== "credit_card" || tx.cardId !== card.id) return false;
              const tDate = new Date(tx.date + "T00:00:00");
              const dueDate = new Date(nom.year, nom.month - 1, effectiveDueDay);
              const diffDays = (dueDate.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24);
              return diffDays >= 0 && diffDays <= 31;
            });
            const cardCharges = qualifyingCardTransactions
              .filter((tx) => tx.type === "outflow")
              .reduce((sum, tx) => sum + tx.amount, 0);
            const cardRefunds = qualifyingCardTransactions
              .filter((tx) => tx.type === "inflow")
              .reduce((sum, tx) => sum + tx.amount, 0);
            const netCardSpend = cardCharges - cardRefunds;

            payAmount = Math.max(0, payAmount + netCardSpend - totalReduced);

            if (payAmount > 0) {
              outflows.push({
                id: `cc-autopay-${card.id}-${nom.dateStr}`,
                name: `${card.name} Statement Autopay`,
                amount: payAmount,
                category: "credit_card_autopay",
                meta: {
                  cardId: card.id,
                  cardName: card.name,
                  originalStatementBalance: card.currentStatementBalance,
                  cardChargesAdded: netCardSpend,
                  reducedBy: totalReduced,
                  scheduledDate: nom.dateStr,
                },
              });
            }
          }
        }
      }
    }

    // 4. Auto-Deposits (shifted to next business day if weekend or holiday)
    for (const ad of autoDeposits) {
      if (!ad.active) continue;

      for (const nom of nominalDatesForBusinessDay) {
        let triggers = false;
        if (ad.scheduleType === "monthly") {
          const targetDay = ad.dayOfMonth ?? 1;
          const effectiveDay = Math.min(targetDay, nom.daysInMonth);
          triggers = nom.day === effectiveDay;
        } else if (ad.scheduleType === "semi-monthly") {
          const days = ad.daysOfMonth || [15, -1];
          triggers = days.some((d) => {
            if (d === -1) return nom.day === nom.daysInMonth;
            if (d < 0) return nom.day === nom.daysInMonth + d + 1;
            return nom.day === d;
          });
        } else if (ad.scheduleType === "biweekly") {
          if (ad.anchorDate) {
            const diff = getDayDifference(nom.dateStr, ad.anchorDate);
            triggers = ((diff % 14) + 14) % 14 === 0;
          }
        } else if (ad.scheduleType === "per-paycheck") {
          triggers = incomes.some((inc) =>
            isIncomeScheduled(inc, nom.dateStr, nom.day, nom.daysInMonth),
          );
        }

        if (triggers) {
          const nomMonthKey = `${nom.year}-${String(nom.month).padStart(2, "0")}`;
          const override =
            ad.overrides[dateStr] ||
            ad.overrides[nom.dateStr] ||
            ad.overrides[nomMonthKey] ||
            ad.overrides[monthKey];
          const isSkipped = override?.skipped === true;
          const amount = isSkipped ? 0 : (override?.overrideAmount ?? ad.defaultAmount);

          outflows.push({
            id: `ad-${ad.id}-${nom.dateStr}`,
            name: ad.name,
            amount,
            category: "auto_deposit",
            isSkipped,
            meta: {
              depositId: ad.id,
              defaultAmount: ad.defaultAmount,
              isOverridden: override?.overrideAmount !== undefined,
              scheduledDate: nom.dateStr,
            },
          });
        }
      }
    }

    // 5. Ad-hoc account transactions (checking & credit cards)
    const dayTransactions = transactions.filter((tx) => tx.date === dateStr);
    for (const tx of dayTransactions) {
      if (tx.accountType === "checking") {
        if (tx.type === "inflow") {
          inflows.push({
            id: `tx-${tx.id}`,
            name: tx.name,
            amount: tx.amount,
            category: "checking_inflow",
            meta: { transaction: tx, accountType: "checking" },
          });
        } else {
          outflows.push({
            id: `tx-${tx.id}`,
            name: tx.name,
            amount: tx.amount,
            category: "checking_outflow",
            meta: { transaction: tx, accountType: "checking" },
          });
        }
      } else if (tx.accountType === "credit_card") {
        const card = creditCards.find((c) => c.id === tx.cardId);
        const cardName = card ? card.name : "Credit Card";
        if (tx.type === "outflow") {
          outflows.push({
            id: `tx-${tx.id}`,
            name: `${cardName}: ${tx.name}`,
            amount: tx.amount,
            category: "credit_card_charge",
            meta: { transaction: tx, accountType: "credit_card", cardId: tx.cardId, cardName },
          });
        } else {
          inflows.push({
            id: `tx-${tx.id}`,
            name: `${cardName}: ${tx.name}`,
            amount: tx.amount,
            category: "credit_card_credit",
            meta: { transaction: tx, accountType: "credit_card", cardId: tx.cardId, cardName },
          });
        }
      }
    }

    // Net daily change on cash in checking account:
    // Only includes checking cashflows (income, checking inflows, bills, card autopay/extra paydown, auto-deposits, checking outflows)
    // Credit card charges/credits on day D do not withdraw cash from checking on day D; they are paid via autopay
    const checkingInflows = inflows
      .filter((i) => i.category !== "credit_card_credit")
      .reduce((sum, i) => sum + i.amount, 0);

    const checkingOutflows = outflows
      .filter((o) => !o.isSkipped && o.category !== "credit_card_charge")
      .reduce((sum, o) => sum + o.amount, 0);

    const netChange = checkingInflows - checkingOutflows;

    return { inflows, outflows, netChange };
  }

  let balanceAtTargetMonthDay1 = account.currentCheckingBalance;

  if (targetMonthStartObj.getTime() > asOfDateObj.getTime()) {
    let curDate = new Date(asOfDateObj);
    let curBalance = account.currentCheckingBalance;

    while (curDate.getTime() < targetMonthStartObj.getTime()) {
      const y = curDate.getFullYear();
      const m = curDate.getMonth() + 1;
      const d = curDate.getDate();

      const { netChange } = getDayTransactions(y, m, d);
      curBalance += netChange;

      curDate.setDate(curDate.getDate() + 1);
    }
    balanceAtTargetMonthDay1 = curBalance;
  } else if (targetYear === asOfParts.year && targetMonth === asOfParts.month) {
    let curBalance = account.currentCheckingBalance;
    for (let d = asOfParts.day - 1; d >= 1; d--) {
      const { netChange } = getDayTransactions(targetYear, targetMonth, d);
      curBalance -= netChange;
    }
    balanceAtTargetMonthDay1 = curBalance;
  } else {
    let curDate = new Date(asOfDateObj);
    let curBalance = account.currentCheckingBalance;

    while (curDate.getTime() >= targetMonthStartObj.getTime()) {
      curDate.setDate(curDate.getDate() - 1);
      const y = curDate.getFullYear();
      const m = curDate.getMonth() + 1;
      const d = curDate.getDate();
      const { netChange } = getDayTransactions(y, m, d);
      curBalance -= netChange;
    }
    balanceAtTargetMonthDay1 = curBalance;
  }

  const dailyForecasts: DailyForecast[] = [];
  let runningBalance = balanceAtTargetMonthDay1;

  let lowestBalance = Infinity;
  let lowestBalanceDate = "";
  let highestBalance = -Infinity;
  let highestBalanceDate = "";

  let totalInflows = 0;
  let totalBills = 0;
  let totalCreditCardPayments = 0;
  let totalAutoDeposits = 0;
  let totalCheckingInflows = 0;
  let totalCheckingOutflows = 0;

  for (let day = 1; day <= targetMonthDays; day++) {
    const dateStr = formatDate(targetYear, targetMonth, day);
    const dateObj = new Date(targetYear, targetMonth - 1, day);
    const dayOfWeek = DAYS_OF_WEEK[dateObj.getDay()];
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;

    const { inflows, outflows, netChange } = getDayTransactions(targetYear, targetMonth, day);

    const startingBalance = runningBalance;
    const endingBalance = startingBalance + netChange;
    runningBalance = endingBalance;

    for (const inf of inflows) {
      if (inf.category !== "credit_card_credit") {
        totalInflows += inf.amount;
        if (inf.category === "checking_inflow") {
          totalCheckingInflows += inf.amount;
        }
      }
    }

    for (const out of outflows) {
      if (out.isSkipped) continue;
      if (out.category === "bill") totalBills += out.amount;
      else if (
        out.category.startsWith("credit_card_autopay") ||
        out.category === "credit_card_extra_payment"
      ) {
        totalCreditCardPayments += out.amount;
      } else if (out.category === "auto_deposit") {
        totalAutoDeposits += out.amount;
      } else if (out.category === "checking_outflow") {
        totalCheckingOutflows += out.amount;
      }
    }

    dailyForecasts.push({
      date: dateStr,
      dayNumber: day,
      dayOfWeek,
      isToday,
      isPast,
      startingBalance,
      inflows,
      outflows,
      netDailyChange: netChange,
      endingBalance,
    });
  }

  // Calculate lowest and highest projected balances:
  // Exclude past dates (only consider current date and forward, where isPast is false).
  // Current checking balance is only relevant for the current date and forward.
  // If all days in the viewed month are in the past, fall back to that month's days.
  const activeDays = dailyForecasts.filter((d) => !d.isPast);
  const evaluationDays = activeDays.length > 0 ? activeDays : dailyForecasts;

  for (const day of evaluationDays) {
    if (day.endingBalance < lowestBalance) {
      lowestBalance = day.endingBalance;
      lowestBalanceDate = day.date;
    }
    if (day.endingBalance > highestBalance) {
      highestBalance = day.endingBalance;
      highestBalanceDate = day.date;
    }
  }

  const projectedEndingBalance =
    dailyForecasts[dailyForecasts.length - 1]?.endingBalance ?? runningBalance;
  const netCashflow =
    totalInflows -
    (totalBills + totalCreditCardPayments + totalAutoDeposits + totalCheckingOutflows);

  return {
    year: targetYear,
    month: targetMonth,
    monthName: MONTH_NAMES[targetMonth - 1],
    startingBalance: balanceAtTargetMonthDay1,
    projectedEndingBalance,
    lowestProjectedBalance: lowestBalance === Infinity ? balanceAtTargetMonthDay1 : lowestBalance,
    lowestBalanceDate: lowestBalanceDate || formatDate(targetYear, targetMonth, 1),
    highestProjectedBalance:
      highestBalance === -Infinity ? balanceAtTargetMonthDay1 : highestBalance,
    highestBalanceDate: highestBalanceDate || formatDate(targetYear, targetMonth, 1),
    totalInflows,
    totalBills,
    totalCreditCardPayments,
    totalAutoDeposits,
    totalCheckingInflows,
    totalCheckingOutflows,
    netCashflow,
    days: dailyForecasts,
  };
}
