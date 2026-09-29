import Link from "next/link";

import AnnualCategoryChart from "@/components/AnnualCategoryChart";
import CashFlowChart from "@/components/CashFlowCharts";
import InvestmentChart from "@/components/InvestmentChart";
import YearSelector from "@/components/YearSelector";
import YearSummaryCards from "@/components/YearSummaryCards";

import {
  getTransactions,
  getYearlyReport,
} from "@/lib/api";


type InsightsPageProps = {
  searchParams: Promise<{
    year?: string;
  }>;
};


export default async function InsightsPage({
  searchParams,
}: InsightsPageProps) {

  const params =
    await searchParams;


  /*
   * We use the transaction history to
   * determine which years are available.
   */
  const transactions =
    await getTransactions();


  const availableYears =
    Array.from(
      new Set(
        transactions.map(
          (transaction) =>
            Number(
              transaction.date.slice(
                0,
                4,
              ),
            ),
        ),
      ),
    )
      .sort(
        (a, b) => b - a,
      );


  const currentYear =
    new Date().getFullYear();


  const requestedYear =
    Number(params.year);


  const requestedYearExists =
    availableYears.includes(
      requestedYear,
    );


  const currentYearExists =
    availableYears.includes(
      currentYear,
    );


  const selectedYear =
    requestedYearExists
      ? requestedYear
      : currentYearExists
        ? currentYear
        : availableYears[0] ??
          currentYear;


  const yearlyReport =
    await getYearlyReport(
      selectedYear,
    );


  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">

      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

          <div>

            <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
              Analysis
            </p>


            <YearSelector
              years={availableYears}
              selectedYear={
                selectedYear
              }
            />


            <p className="mt-1 text-gray-500">
              Yearly overview and long-term trends
            </p>

          </div>


          <Link
            href="/"
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
            ← Dashboard
          </Link>

        </div>


        {/* Annual summary */}

        <div className="mb-8">

          <YearSummaryCards
            report={
              yearlyReport
            }
          />

        </div>


        {/* Cash flow */}

        <div className="mb-8">

          <CashFlowChart
            data={
              yearlyReport.months
            }
          />

        </div>


        {/* Spending + Investments */}

        <div
          className="
            grid
            gap-6
            xl:grid-cols-2
          "
        >

          <AnnualCategoryChart
            data={
              yearlyReport.categories
            }
          />


          <InvestmentChart
            data={
              yearlyReport.months
            }
          />

        </div>

      </div>

    </main>
  );
}