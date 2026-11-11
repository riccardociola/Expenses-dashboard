import {
  Transaction,
  TransactionCreate,
} from "@/types/transaction";

import {
  CategoryReport,
  MonthlyReport,
  SpendingInsight,
  YearlyReport,
} from "@/types/report";

const API_URL = "http://127.0.0.1:8000";


export async function getTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${API_URL}/transactions`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  return response.json();
}


export async function addTransaction(
  transaction: TransactionCreate,
): Promise<Transaction> {
  const response = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    throw new Error("Failed to add transaction");
  }

  return response.json();
}


export async function updateTransaction(
  id: number,
  transaction: TransactionCreate,
): Promise<Transaction> {
  const response = await fetch(
    `${API_URL}/transactions/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update transaction");
  }

  return response.json();
}


export async function deleteTransaction(
  id: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/transactions/${id}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to delete transaction");
  }
}


export async function getMonthlyReport(
  year: number,
  month: number,
): Promise<MonthlyReport> {
  const response = await fetch(
    `${API_URL}/reports/monthly?year=${year}&month=${month}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch monthly report");
  }

  return response.json();
}


export async function getCategoryReport(
  year: number,
  month: number,
): Promise<CategoryReport[]> {
  const response = await fetch(
    `${API_URL}/reports/categories?year=${year}&month=${month}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch category report");
  }

  return response.json();
}


export async function getSpendingInsight(
  year: number,
  month: number,
): Promise<SpendingInsight> {
  const response = await fetch(
    `${API_URL}/reports/spending-insight?year=${year}&month=${month}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch spending insight",
    );
  }

  return response.json();
}


export async function getYearlyReport(
  year: number,
): Promise<YearlyReport> {
  const response = await fetch(
    `${API_URL}/reports/yearly?year=${year}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch yearly report",
    );
  }

  return response.json();
}