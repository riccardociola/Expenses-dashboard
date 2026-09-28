import { MonthlyReport } from "@/types/report";

import { formatAmount } from "@/lib/format";

type SummaryCardsProps = {
  report: MonthlyReport;
};


export default function SummaryCards({
  report,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">
          Income
        </p>

        {/* Income */}
        <p className="mt-2 text-2xl font-semibold text-gray-900">
         {formatAmount(report.income, "+")}
        </p>
      </div>


      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">
          Expenses
        </p>

        {/* Expenses */}
        <p className="mt-2 text-2xl font-semibold text-gray-900">
         {formatAmount(report.expenses, "-")}
        </p>

        {report.income > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            {(
              (report.expenses / report.income) *
              100
            ).toFixed(1)}
            % of income
          </p>
        )}
      </div>


      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">
          Net savings
        </p>

        <p
          className={`mt-2 text-2xl font-semibold ${
            report.net_cash_flow >= 0
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {formatAmount(
            report.net_cash_flow,
            report.net_cash_flow >= 0 ? "+" : "-",
        )}
        </p>
      </div>


      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">
          Savings rate
        </p>

        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {report.savings_rate !== null
            ? `${report.savings_rate.toFixed(1)}%`
            : "—"}
        </p>

        {report.savings_rate !== null && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500"
              style={{
                width: `${Math.min(
                  Math.max(report.savings_rate, 0),
                  100,
                )}%`,
              }}
            />
          </div>
        )}
      </div>

    </div>
  );
}