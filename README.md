# Budget Forecaster

A lightweight, local daily budget forecasting tool to project how your money will shake out across each day and at the end of every month.

## Features

- **Daily Balance Projection**: Walk day-by-day through any month to see roughly how much will be left in your checking account on any given day.
- **Visuals**:
  - Interactive balance trend curve (with custom safe buffer line and hover transactions).
  - Monthly calendar view with transaction badges and color-coded daily health indicators.
  - Chronological daily transaction ledger with net daily change and running balances.
- **Flexible Income Schedules**: Supports biweekly cadences with anchor dates, semi-monthly schedules (e.g. 15th and last day of the month), fixed monthly dates, or specific custom dates.
- **Static ACH Bills**: Direct ACH bank deductions scheduled on specific days of the month.
- **Credit Card Statements & Autopay**: Deducts statement balances from checking on the card's payment due date.
- **Extra Credit Card Paydowns**: Record or schedule extra payments of any amount on any date, with an option to reduce upcoming statement autopay or treat as an additional paydown.
- **Skippable & Tweakable Auto-Deposits**: Scheduled transfers to savings/investments (per-paycheck, monthly, biweekly). Skip or tweak amounts for any specific occurrence or month with 1 click.
- **Minimal Ongoing Maintenance**: Only update your checking balance and credit card statement balances when statements close.
- **Local & Private**: Saves automatically to your browser (`localStorage`) with 1-click JSON backup export and import.

## Getting Started

### Development
```bash
npm install
npm run dev
```

### Run Tests
```bash
npm test
```

### Build Production Bundle
```bash
npm run build
npm run preview
```
