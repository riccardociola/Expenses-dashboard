import AddTransaction from "@/components/AddTransaction";
import CategoryChart from "@/components/CategoryCharts";
import MonthSelector from "@/components/MonthSelector";
import SpendingInsight from "@/components/SpendingInsight";
import SummaryCards from "@/components/SummaryCards";
import TransactionTable from "@/components/TransactionTable";

import Link from "next/link";

import {
  getCategoryReport,
  getMonthlyReport,
  getSpendingInsight,
  getTransactions,
} from "@/lib/api";


type HomeProps = {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
};


export default async function Home({
  searchParams,
}: HomeProps) {
  const params = await searchParams;


  /*
   * Fetch all transactions first.
   *
   * We use these to determine which
   * months actually contain data.
   */
  const allTransactions =
    await getTransactions();


  /*
   * Extract unique YYYY-MM combinations.
   */
  const monthKeys = Array.from(
    new Set(
      allTransactions.map(
        (transaction) =>
          transaction.date.slice(0, 7),
      ),
    ),
  )
    .sort()
    .reverse();


  const availableMonths =
    monthKeys.map((key) => {
      const [year, month] =
        key.split("-").map(Number);

      return {
        year,
        month,
      };
    });


  /*
   * Default month:
   *
   * 1. Current month, if it contains transactions
   * 2. Otherwise latest month with transactions
   * 3. Otherwise current month
   */
  const today = new Date();

  const currentYear =
    today.getFullYear();

  const currentMonth =
    today.getMonth() + 1;


  const currentMonthExists =
    availableMonths.some(
      (item) =>
        item.year === currentYear &&
        item.month === currentMonth,
    );


  const fallbackMonth =
    currentMonthExists
      ? {
          year: currentYear,
          month: currentMonth,
        }
      : availableMonths[0] ?? {
          year: currentYear,
          month: currentMonth,
        };


  /*
   * Read requested month from URL.
   */
  const requestedYear =
    Number(params.year);

  const requestedMonth =
    Number(params.month);


  /*
   * Only accept a URL month if
   * transactions actually exist there.
   */
  const requestedMonthExists =
    availableMonths.some(
      (item) =>
        item.year === requestedYear &&
        item.month === requestedMonth,
    );


  const selectedYear =
    requestedMonthExists
      ? requestedYear
      : fallbackMonth.year;


  const selectedMonth =
    requestedMonthExists
      ? requestedMonth
      : fallbackMonth.month;


  /*
   * Only show transactions belonging
   * to the selected month.
   */
  const transactions =
    allTransactions.filter(
      (transaction) => {
        const [
          transactionYear,
          transactionMonth,
        ] = transaction.date
          .slice(0, 7)
          .split("-")
          .map(Number);

        return (
          transactionYear ===
            selectedYear &&
          transactionMonth ===
            selectedMonth
        );
      },
    );


  /*
   * Fetch all reports for the
   * selected month.
   */
  const [
    monthlyReport,
    categoryReport,
    spendingInsight,
  ] = await Promise.all([
    getMonthlyReport(
      selectedYear,
      selectedMonth,
    ),

    getCategoryReport(
      selectedYear,
      selectedMonth,
    ),

    getSpendingInsight(
      selectedYear,
      selectedMonth,
    ),
  ]);


  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">

      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

          <div>

            <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
              Overview
            </p>


            <MonthSelector
              months={availableMonths}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />


            <p className="mt-1 text-gray-500">
              Personal finance overview
            </p>

          </div>


          <div className="flex items-center gap-3">

            <Link
              href="/insights"
              className="
                rounded-lg
                border
                border-gray-300
                bg-white
                px-4
                py-2.5
                text-sm
                font-medium
                text-gray-700
                transition
                hover:bg-gray-50
              "
            >
              Insights
            </Link>


            <AddTransaction />

          </div>

        </div>


        {/* Summary */}

        <div className="mb-8">

          <SummaryCards
            report={monthlyReport}
          />

        </div>


        {/* Chart + spending insight */}

        <div
          className="
            mb-8
            grid
            items-stretch
            gap-6
            lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]
          "
        >

          <CategoryChart
            data={categoryReport}
            income={monthlyReport.income}
          />


          <SpendingInsight
            insight={spendingInsight}
          />

        </div>


        {/* Selected month's transactions */}

        <TransactionTable
          transactions={transactions}
        />

      </div>

    </main>
  );
}