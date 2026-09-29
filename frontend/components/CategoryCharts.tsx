"use client";

import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  type PieLabelRenderProps,
  type PieSectorShapeProps,
} from "recharts";

import { getCategoryColor } from "@/lib/categories";
import { formatAmount } from "@/lib/format";
import { CategoryReport } from "@/types/report";


type CategoryChartProps = {
  data: CategoryReport[];
  income: number;
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


export default function CategoryChart({
  data,
  income,
}: CategoryChartProps) {

  /*
   * Total expenses for the month.
   */
  const totalExpenses = data.reduce(
    (sum, item) => sum + item.amount,
    0,
  );


  /*
   * Savings are automatically calculated.
   */
  const savings = Math.max(
    0,
    income - totalExpenses,
  );


  /*
   * Build the pie-chart data.
   */
  const chartData: ChartItem[] = [
    ...data.map((item) => ({
      ...item,
      fill: getCategoryColor(
        item.category,
      ),
    })),

    ...(savings > 0
      ? [
          {
            category: "Savings",
            amount: savings,
            fill: getCategoryColor(
              "Savings",
            ),
          },
        ]
      : []),
  ];


  /*
   * Total value represented by the pie.
   *
   * If expenses < income:
   *
   * expenses + savings = income
   */
  const pieTotal = chartData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );


  /*
   * Custom sector.
   *
   * Geometry is still entirely calculated
   * by Recharts. We only provide the color.
   */
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


  /*
   * Custom label content.
   *
   * IMPORTANT:
   *
   * We DO NOT calculate x/y coordinates here.
   *
   * Recharts decides where the label belongs
   * and passes x/y to us.
   *
   * We only format the label:
   *
   * Grocery (18.4%)
   * 245.30 €
   */
  function renderCategoryLabel(
    props: PieLabelRenderProps,
  ) {
    const index =
      toNumber(props.index);

    const item =
      chartData[index];

    if (!item) {
      return null;
    }


    /*
     * These positions come directly
     * from Recharts.
     */
    const x =
      toNumber(props.x);

    const y =
      toNumber(props.y);

    const cx =
      toNumber(props.cx);


    /*
     * Make the text extend AWAY from
     * the pie instead of back over it.
     *
     * Recharts still determines x/y.
     * We only choose text direction.
     */
    const textAnchor =
      x > cx
        ? "start"
        : x < cx
          ? "end"
          : "middle";


    const percentage =
      pieTotal > 0
        ? (
            item.amount /
            pieTotal
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

        {/* Category + percentage */}

        <tspan
          x={x}
          dy="-0.35em"
          fontSize={14}
          fontWeight={600}
        >
          {item.category}
          {" "}
          ({percentage.toFixed(1)}%)
        </tspan>


        {/* Amount */}

        <tspan
          x={x}
          dy="1.45em"
          fontSize={13}
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
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">

        <p className="text-gray-500">
          No expenses for this month.
        </p>

      </div>
    );
  }


  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">

      <div className="mb-2">

        <h2 className="text-lg font-semibold text-gray-900">
          Monthly spending
        </h2>

      </div>


      <div className="h-[560px] w-full">

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

              outerRadius={175}

              paddingAngle={1}

              shape={renderSlice}

              /*
               * Recharts determines the
               * label positions.
               */
              label={renderCategoryLabel}

              /*
               * No gray connector lines.
               */
              labelLine={false}
            />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}