export type MonthlyReport = {
  year: number;
  month: number;
  income: number;
  expenses: number;
  net_cash_flow: number;
  savings_rate: number | null;
};


export type CategoryReport = {
  category: string;
  amount: number;
};


export type CategorySpendingInsight = {
  category: string;
  current: number;
  average: number;
};


export type SpendingInsight = {
  current_expenses: number;
  six_month_average: number;
  difference: number;
  difference_percentage: number | null;
  categories: CategorySpendingInsight[];
};