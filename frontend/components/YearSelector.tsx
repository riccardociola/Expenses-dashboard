import Link from "next/link";


type YearSelectorProps = {
  years: number[];
  selectedYear: number;
};


export default function YearSelector({
  years,
  selectedYear,
}: YearSelectorProps) {
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
        {selectedYear}

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
          w-40
          overflow-hidden
          rounded-xl
          border
          border-gray-200
          bg-white
          py-2
          shadow-lg
        "
      >

        {years.map((year) => {

          const isSelected =
            year === selectedYear;

          return (
            <Link
              key={year}
              href={`/insights?year=${year}`}
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
              {year}
            </Link>
          );
        })}

      </div>

    </details>
  );
}