export type Transaction = {
  id: number;
  date: string;
  amount: number;
  transaction_type: "expense" | "income";
  category: string;
  description: string | null;
  created_at: string;
};

export type TransactionCreate = {
  date: string;
  amount: number;
  transaction_type: "expense" | "income";
  category: string;
  description: string | null;
};