import { formatAmount } from "@/lib/format";
import { YearlyReport } from "@/types/report";


type YearSummaryCardsProps = {
  report: YearlyReport;
};


export default function YearSummaryCards({
  report,
}: YearSummaryCardsProps) {

  const positiveCashFlow =
    report.net_cash_flow >= 0;


  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

      {/* Income */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">

        <p className="text-sm text-gray-500">
          Annual income
        </p>

        <p className="mt-2 text-2xl font-semibold text-green-600">
          {formatAmount(
            report.income,
            "+",
          )}
        </p>

      </div>


      {/* Spending */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">

        <p className="text-sm text-gray-500">
          Annual spending
        </p>

        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {formatAmount(
            report.expenses,
            "-",
          )}
        </p>

      </div>


      {/* Cash flow */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">

        <p className="text-sm text-gray-500">
          Net cash flow
        </p>

        <p
          className={`mt-2 text-2xl font-semibold ${
            positiveCashFlow
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {formatAmount(
            Math.abs(
              report.net_cash_flow,
            ),
            positiveCashFlow
              ? "+"
              : "-",
          )}
        </p>

        {report.savings_rate !== null && (

          <p className="mt-1 text-sm text-gray-500">
            {report.savings_rate.toFixed(1)}
            % of income
          </p>

        )}

      </div>


      {/* Investments */}

      <div className="rounded-xl border border-gray-200 bg-white p-5">

        <p className="text-sm text-gray-500">
          Investments
        </p>

        <p className="mt-2 text-2xl font-semibold text-indigo-600">
          {formatAmount(
            report.investments,
          )}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Tracked separately from spending
        </p>

      </div>

    </div>
  );
}