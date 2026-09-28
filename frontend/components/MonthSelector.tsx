import Link from "next/link";

type AvailableMonth = {
  year: number;
  month: number;
};

type MonthSelectorProps = {
  months: AvailableMonth[];
  selectedYear: number;
  selectedMonth: number;
};


function formatMonth(
  year: number,
  month: number,
) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(
      Date.UTC(year, month - 1, 1),
    ),
  );
}


export default function MonthSelector({
  months,
  selectedYear,
  selectedMonth,
}: MonthSelectorProps) {
  return (
    <details className="relative">

      <summary
        className="
          flex
          cursor-pointer
          list-none
          items-center
          gap-3
          rounded-lg
          px-2
          py-1
          text-3xl
          font-bold
          text-gray-900
          transition
          hover:bg-gray-100
          [&::-webkit-details-marker]:hidden
        "
      >
        {formatMonth(
          selectedYear,
          selectedMonth,
        )}

        <span className="text-lg text-gray-400">
          ▾
        </span>
      </summary>


      <div
        className="
          absolute
          left-0
          z-20
          mt-2
          w-56
          overflow-hidden
          rounded-xl
          border
          border-gray-200
          bg-white
          py-2
          shadow-lg
        "
      >

        {months.map((item) => {
          const isSelected =
            item.year === selectedYear &&
            item.month === selectedMonth;

          return (
            <Link
              key={`${item.year}-${item.month}`}
              href={`/?year=${item.year}&month=${item.month}`}
              className={`
                block
                px-4
                py-2.5
                text-sm
                transition
                ${
                  isSelected
                    ? "bg-gray-100 font-semibold text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              {formatMonth(
                item.year,
                item.month,
              )}
            </Link>
          );
        })}

      </div>

    </details>
  );
}