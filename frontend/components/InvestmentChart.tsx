"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  YearlyMonthReport,
} from "@/types/report";


type InvestmentChartProps = {
  data: YearlyMonthReport[];
};


const MONTH_NAMES = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];


export default function InvestmentChart({
  data,
}: InvestmentChartProps) {

  const chartData =
    data.map((item) => ({
      name:
        MONTH_NAMES[
          item.month
        ],
      investments:
        item.investments,
    }));


  const hasInvestments =
    chartData.some(
      (item) =>
        item.investments > 0,
    );


  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">

      <h2 className="text-lg font-semibold text-gray-900">
        Investments
      </h2>


      {!hasInvestments ? (

        <div className="flex h-[430px] items-center justify-center">

          <p className="text-gray-500">
            No investments recorded this year.
          </p>

        </div>

      ) : (

        <div className="h-[430px] w-full">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={chartData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />


              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
              />


              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  `${value} €`
                }
              />


              <Tooltip />


              <Bar
                dataKey="investments"
                name="Investments"
                fill="#6366F1"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      )}

    </div>
  );
}