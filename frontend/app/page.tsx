import { getTransactions } from "@/lib/api";
import TransactionTable from "@/components/TransactionTable";
import AddTransaction from "@/components/AddTransaction";

export default async function Home() {
  const transactions = await getTransactions();

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Expenses Dashboard
            </h1>

            <p className="mt-1 text-gray-500">
              Personal finance overview
            </p>
          </div>
        </div>

        <div className="mb-6">
          <AddTransaction />
        </div>

        <TransactionTable
          transactions={transactions}
        />

      </div>
    </main>
  );
}