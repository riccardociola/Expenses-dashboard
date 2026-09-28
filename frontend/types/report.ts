export type MonthlyReport = {
  year: number;
  month: number;
  income: number;
  expenses: number;
  net_cash_flow: number;
  savings_rate: number | null;
};