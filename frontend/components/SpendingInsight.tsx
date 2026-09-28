import {
  getCategoryColor,
} from "@/lib/categories";

import { formatAmount } from "@/lib/format";

import {
  SpendingInsight as SpendingInsightType,
} from "@/types/report";


type SpendingInsightProps = {
  insight: SpendingInsightType;
};


export default function SpendingInsight({
  insight,
}: SpendingInsightProps) {

  const isLower =
    insight.difference < 0;

  const absoluteDifference =
    Math.abs(insight.difference);


  /*
   * Show only the most relevant categories
   * to keep this card compact.
   */
  const categories =
    insight.categories.slice(0, 5);


  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-6">

      <div>

        <h2 className="text-lg font-semibold text-gray-900">
          Spending insight
        </h2>

        <p className="text-sm text-gray-500">
          Compared with your previous
          6-month average
        </p>

      </div>


      <div className="mt-6">

        <p className="text-sm text-gray-500">
          This month
        </p>

        <p className="mt-1 text-3xl font-semibold text-gray-900">
          {formatAmount(
            insight.current_expenses,
          )}
        </p>


        {insight.six_month_average > 0 && (

          <p
            className={`mt-2 text-sm font-medium ${
              isLower
                ? "text-green-600"
                : "text-red-600"
            }`}
          >

            {isLower
              ? `${formatAmount(
                  absoluteDifference,
                )} less`
              : `${formatAmount(
                  absoluteDifference,
                )} more`}

            {" than average"}

          </p>

        )}

      </div>


      <div className="mt-5 rounded-lg bg-gray-50 p-4">

        <p className="text-xs text-gray-500">
          6-month average
        </p>

        <p className="mt-1 text-lg font-semibold text-gray-900">
          {formatAmount(
            insight.six_month_average,
          )}
        </p>

        {insight.difference_percentage !==
          null && (

          <p className="mt-1 text-xs text-gray-500">

            {Math.abs(
              insight.difference_percentage,
            ).toFixed(1)}
            %

            {isLower
              ? " below average"
              : " above average"}

          </p>

        )}

      </div>


      <div className="mt-6 space-y-5">

        {categories.map((item) => {

          const maxValue =
            Math.max(
              item.current,
              item.average,
              1,
            );


          const currentWidth =
            (
              item.current /
              maxValue
            ) * 100;


          const averageWidth =
            (
              item.average /
              maxValue
            ) * 100;


          const color =
            getCategoryColor(
              item.category,
            );


          return (

            <div key={item.category}>

              <div className="mb-2 flex items-center justify-between gap-3">

                <span
                  className="text-sm font-semibold"
                  style={{
                    color,
                  }}
                >
                  {item.category}
                </span>


                <span className="text-xs text-gray-500">

                  {formatAmount(
                    item.current,
                  )}

                  {" / "}

                  {formatAmount(
                    item.average,
                  )}

                </span>

              </div>


              <div className="space-y-1">

                {/* Current month */}

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                  <div
                    className="h-full rounded-full"
                    style={{
                      width:
                        `${currentWidth}%`,
                      backgroundColor:
                        color,
                    }}
                  />

                </div>


                {/* Six-month average */}

                <div className="h-1 overflow-hidden rounded-full bg-gray-100">

                  <div
                    className="h-full rounded-full bg-gray-400"
                    style={{
                      width:
                        `${averageWidth}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          );
        })}

      </div>


      <div className="mt-5 flex items-center gap-4 text-xs text-gray-500">

        <span className="flex items-center gap-1.5">

          <span className="h-2 w-4 rounded-full bg-gray-900" />

          Current

        </span>

        <span className="flex items-center gap-1.5">

          <span className="h-1 w-4 rounded-full bg-gray-400" />

          6-month average

        </span>

      </div>

    </div>
  );
}