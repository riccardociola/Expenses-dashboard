import AddTransaction from "@/components/AddTransaction";
import SummaryCards from "@/components/SummaryCards";
import TransactionTable from "@/components/TransactionTable";

import {
  getMonthlyReport,
  getTransactions,
} from "@/lib/api";

export default async function Home() {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const [transactions, monthlyReport] =
    await Promise.all([
      getTransactions(),
      getMonthlyReport(year, month),
    ]);

  const monthName = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(today);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">

      <div className="mx-auto max-w-6xl">

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
              Overview
            </p>

            <h1 className="text-3xl font-bold text-gray-900">
              {monthName}
            </h1>

            <p className="mt-1 text-gray-500">
              Personal finance overview
            </p>
          </div>

          <AddTransaction />

        </div>


        <div className="mb-8">
          <SummaryCards report={monthlyReport} />
        </div>


        <TransactionTable
          transactions={transactions}
        />

      </div>

    </main>
  );
}