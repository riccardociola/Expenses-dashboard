"use client";

import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  type PieLabelRenderProps,
  type PieSectorShapeProps,
} from "recharts";

import {
  getCategoryColor,
} from "@/lib/categories";

import {
  formatAmount,
} from "@/lib/format";

import {
  YearlyCategoryReport,
} from "@/types/report";


type AnnualCategoryChartProps = {
  data: YearlyCategoryReport[];
};


type ChartItem = {
  category: string;
  amount: number;
  fill: string;
};


function toNumber(
  value: unknown,
  fallback = 0,
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


export default function AnnualCategoryChart({
  data,
}: AnnualCategoryChartProps) {

  const chartData: ChartItem[] =
    data.map((item) => ({
      ...item,
      fill: getCategoryColor(
        item.category,
      ),
    }));


  const total =
    chartData.reduce(
      (sum, item) =>
        sum + item.amount,
      0,
    );


  function renderSlice(
    props: PieSectorShapeProps,
  ) {
    const index =
      toNumber(props.index);

    const item =
      chartData[index];


    if (!item) {
      return (
        <Sector {...props} />
      );
    }


    return (
      <Sector
        {...props}
        fill={item.fill}
        stroke="#ffffff"
        strokeWidth={2}
      />
    );
  }


  function renderLabel(
    props: PieLabelRenderProps,
  ) {
    const index =
      toNumber(props.index);

    const item =
      chartData[index];


    if (!item) {
      return null;
    }


    const x =
      toNumber(props.x);

    const y =
      toNumber(props.y);

    const cx =
      toNumber(props.cx);


    const textAnchor =
      x > cx
        ? "start"
        : x < cx
          ? "end"
          : "middle";


    const percentage =
      total > 0
        ? (
            item.amount /
            total
          ) * 100
        : 0;


    return (
      <text
        x={x}
        y={y}
        fill={item.fill}
        textAnchor={textAnchor}
        dominantBaseline="central"
        pointerEvents="none"
      >

        <tspan
          x={x}
          dy="-0.35em"
          fontSize={13}
          fontWeight={600}
        >
          {item.category}
          {" "}
          ({percentage.toFixed(1)}%)
        </tspan>


        <tspan
          x={x}
          dy="1.45em"
          fontSize={12}
          fontWeight={500}
        >
          {formatAmount(
            item.amount,
          )}
        </tspan>

      </text>
    );
  }


  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        <p className="text-center text-gray-500">
          No spending data for this year.
        </p>
      </div>
    );
  }


  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">

      <h2 className="text-lg font-semibold text-gray-900">
        Annual spending
      </h2>


      <div className="h-[430px] w-full">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <PieChart>

            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={125}
              paddingAngle={1}
              shape={renderSlice}
              label={renderLabel}
              labelLine={false}
            />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}