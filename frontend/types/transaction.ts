export type TransactionType =
  | "expense"
  | "income"
  | "investment"
  | "reimbursable";

export type Transaction = {
  id: number;
  date: string;
  amount: number;
  transaction_type: TransactionType;
  category: string;
  description: string | null;
  created_at: string;
};

export type TransactionCreate = {
  date: string;
  amount: number;
  transaction_type: TransactionType;
  category: string;
  description: string | null;
};