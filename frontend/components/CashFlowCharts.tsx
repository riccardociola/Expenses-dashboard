"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  YearlyMonthReport,
} from "@/types/report";


type CashFlowChartProps = {
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


export default function CashFlowChart({
  data,
}: CashFlowChartProps) {

  const chartData =
    data.map((item) => ({
      ...item,
      name:
        MONTH_NAMES[
          item.month
        ],
    }));


  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">

      <div className="mb-6">

        <h2 className="text-lg font-semibold text-gray-900">
          Cash flow over time
        </h2>

      </div>


      <div className="h-[380px] w-full">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 10,
              bottom: 5,
            }}
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
              tick={{
                fill: "#6B7280",
                fontSize: 12,
              }}
            />


            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#6B7280",
                fontSize: 12,
              }}
              tickFormatter={(value) =>
                `${value} €`
              }
            />


            <Tooltip />

            <Legend />


            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#2E8B57"
              strokeWidth={2.5}
              dot={false}
            />


            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#E76F51"
              strokeWidth={2.5}
              dot={false}
            />


            <Line
              type="monotone"
              dataKey="net_cash_flow"
              name="Net cash flow"
              stroke="#4F81BD"
              strokeWidth={2.5}
              dot={false}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}