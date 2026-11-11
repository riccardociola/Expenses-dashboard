from __future__ import annotations

import argparse
import calendar
import re
import sys

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.cell.cell import Cell
from openpyxl.utils.datetime import from_excel


# ============================================================
# Make backend/app importable when running:
#
# python scripts/import_history.py ...
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(
        0,
        str(BACKEND_DIR),
    )


from app import models
from app.database import SessionLocal


# ============================================================
# Spreadsheet layout
# ============================================================

DATE_ROW = 1

FIRST_TRANSACTION_ROW = 2
LAST_TRANSACTION_ROW = 16

DAILY_TOTAL_ROW = 17

LEGEND_LABEL = "Legend"

OLD_INCOME_CELL = "D25"

NEW_INCOME_START = date(
    2025,
    3,
    1,
)


# ============================================================
# Historical category -> new application category
# ============================================================

CATEGORY_MAP: dict[
    str,
    tuple[str, str],
] = {
    "Cibo fuori": (
        "Restaurant",
        "expense",
    ),

    "Spesa": (
        "Grocery",
        "expense",
    ),

    "Extra": (
        "Extra",
        "expense",
    ),

    "Hobbies": (
        "Extra",
        "expense",
    ),

    "Abbonamenti": (
        "Subscriptions",
        "expense",
    ),

    "Psicologa": (
        "Psicologa",
        "expense",
    ),

    "Refund cost": (
        "Refund cost",
        "reimbursable",
    ),

    "Affitto": (
        "Rent",
        "expense",
    ),

    "Viaggi": (
        "Travel",
        "expense",
    ),

    "Occhiali": (
        "Subscriptions",
        "expense",
    ),

    "Investimenti": (
        "Investimenti",
        "investment",
    ),

    "Macchinina": (
        "Car",
        "expense",
    ),
}


# ============================================================
# Data structures
# ============================================================

@dataclass
class ImportedTransaction:
    date: date
    amount: float
    transaction_type: str
    category: str

    source_sheet: str
    source_cell: str

    description: str | None = None


@dataclass
class SheetResult:
    sheet_name: str

    transactions: list[
        ImportedTransaction
    ] = field(
        default_factory=list,
    )

    errors: list[str] = field(
        default_factory=list,
    )

    warnings: list[str] = field(
        default_factory=list,
    )

    daily_total_expected: float = 0.0
    daily_total_found: float = 0.0


# ============================================================
# Helpers
# ============================================================

def is_number(
    value: object,
) -> bool:
    return (
        isinstance(
            value,
            (int, float),
        )
        and not isinstance(
            value,
            bool,
        )
    )


def money(
    value: float,
) -> float:
    """
    Normalize money values to cents.
    """
    return round(
        float(value),
        2,
    )


def money_cents(
    value: float,
) -> int:
    """
    Integer representation used for
    duplicate detection.
    """
    return round(
        float(value) * 100
    )


# ============================================================
# Sheet-name parsing
# ============================================================

MONTHS = {
    name.lower(): number
    for number, name
    in enumerate(
        calendar.month_name
    )
    if name
}


def parse_sheet_month(
    sheet_name: str,
) -> date | None:
    """
    Convert:

        January 24
        September 26

    into the first day of that month.

    Non-month sheets such as "Appartamento"
    return None.
    """

    match = re.fullmatch(
        r"\s*([A-Za-z]+)\s+(\d{2})\s*",
        sheet_name,
    )

    if not match:
        return None

    month_name = (
        match
        .group(1)
        .lower()
    )

    month = MONTHS.get(
        month_name
    )

    if month is None:
        return None

    year = (
        2000
        + int(
            match.group(2)
        )
    )

    return date(
        year,
        month,
        1,
    )


# ============================================================
# Excel fill/color handling
# ============================================================

def fill_key(
    cell: Cell,
) -> tuple | None:
    """
    Produce a comparable representation
    of a cell's fill.

    We compare fill definitions rather than
    hard-coding RGB values because the
    spreadsheet legend changes colors
    between months.
    """

    fill = cell.fill

    if (
        fill is None
        or fill.fill_type is None
    ):
        return None

    color = fill.fgColor

    if color is None:
        return None

    color_type = color.type

    if color_type == "rgb":
        value = color.rgb

    elif color_type == "indexed":
        value = color.indexed

    elif color_type == "theme":
        value = color.theme

    elif color_type == "auto":
        value = color.auto

    else:
        value = None

    tint = (
        round(
            float(color.tint),
            6,
        )
        if color.tint is not None
        else 0.0
    )

    return (
        fill.fill_type,
        color_type,
        value,
        tint,
    )


# ============================================================
# Find legend
# ============================================================

def find_legend_row(
    worksheet,
) -> int | None:

    for row in range(
        1,
        min(
            worksheet.max_row,
            50,
        )
        + 1,
    ):

        value = worksheet.cell(
            row=row,
            column=1,
        ).value

        if (
            isinstance(
                value,
                str,
            )
            and value.strip().lower()
            == LEGEND_LABEL.lower()
        ):
            return row

    return None


def build_legend(
    worksheet,
    result: SheetResult,
) -> dict[tuple, tuple[str, str]]:
    """
    Read the colored category cells below
    "Legend".

    Result:

        fill -> (
            canonical category,
            transaction type
        )
    """

    legend_row = find_legend_row(
        worksheet
    )

    if legend_row is None:
        result.errors.append(
            "Could not find the Legend."
        )

        return {}


    legend: dict[
        tuple,
        tuple[str, str],
    ] = {}


    found_category = False

    row = legend_row + 1


    while row <= worksheet.max_row:

        cell = worksheet.cell(
            row=row,
            column=1,
        )

        value = cell.value


        # Once categories have started,
        # the first blank row ends the legend.
        if value is None:

            if found_category:
                break

            row += 1
            continue


        if not isinstance(
            value,
            str,
        ):
            break


        source_category = (
            value.strip()
        )


        if (
            source_category
            not in CATEGORY_MAP
        ):

            if found_category:
                result.warnings.append(
                    f"{cell.coordinate}: "
                    f"unknown legend entry "
                    f"'{source_category}'. "
                    f"Legend parsing stopped."
                )

            break


        found_category = True


        category_info = (
            CATEGORY_MAP[
                source_category
            ]
        )


        color = fill_key(
            cell
        )


        if color is None:
            result.errors.append(
                f"{cell.coordinate}: "
                f"'{source_category}' "
                f"has no fill color."
            )

            row += 1
            continue


        if (
            color in legend
            and legend[color]
            != category_info
        ):
            result.errors.append(
                f"{cell.coordinate}: "
                f"the same fill color is assigned "
                f"to multiple categories."
            )

            row += 1
            continue


        legend[color] = (
            category_info
        )

        row += 1


    if not legend:
        result.errors.append(
            "No usable categories were "
            "found in the legend."
        )


    return legend


# ============================================================
# Date handling
# ============================================================

def get_cell_date(
    cell: Cell,
    workbook,
) -> date | None:

    value = cell.value


    if isinstance(
        value,
        datetime,
    ):
        return value.date()


    if isinstance(
        value,
        date,
    ):
        return value


    # Fallback for raw Excel serial numbers.
    if (
        is_number(value)
        and cell.is_date
    ):
        converted = from_excel(
            value,
            workbook.epoch,
        )

        if isinstance(
            converted,
            datetime,
        ):
            return converted.date()

        if isinstance(
            converted,
            date,
        ):
            return converted


    return None


# ============================================================
# Historical income
# ============================================================

def parse_old_income_formula(
    formula: object,
) -> float:
    """
    Before March 2025, D25 has formulas like:

        =2275-D21

        =2340.5+5.55-F21-440

        =2465.23+6.77-F23-B23-...

    The historical income is the positive
    numeric expression before the first '-'.

    Therefore:

        2275-D21
            -> 2275

        2340.5+5.55-F21
            -> 2346.05
    """

    if not isinstance(
        formula,
        str,
    ):
        raise ValueError(
            "Income cell does not "
            "contain a formula."
        )


    expression = (
        formula.strip()
    )


    if expression.startswith("="):
        expression = (
            expression[1:]
        )


    positive_part = (
        expression
        .split(
            "-",
            1,
        )[0]
    )


    terms = [
        term.strip()
        for term
        in positive_part.split("+")
    ]


    if not terms:
        raise ValueError(
            f"Could not parse formula: "
            f"{formula}"
        )


    values: list[float] = []


    for term in terms:

        if not re.fullmatch(
            r"\d+(?:\.\d+)?",
            term,
        ):
            raise ValueError(
                "Unexpected old income "
                f"formula format: {formula}"
            )

        values.append(
            float(term)
        )


    return money(
        sum(values)
    )


def find_salary(
    worksheet_values,
) -> float | None:
    """
    From March 2025 onwards the sheet
    contains:

        A19 = salary
        B19 = amount

    Search dynamically instead of relying
    strictly on row 19.
    """

    for row in range(
        1,
        min(
            worksheet_values.max_row,
            40,
        )
        + 1,
    ):

        label = (
            worksheet_values.cell(
                row=row,
                column=1,
            ).value
        )

        if (
            isinstance(
                label,
                str,
            )
            and label.strip().lower()
            == "salary"
        ):

            value = (
                worksheet_values.cell(
                    row=row,
                    column=2,
                ).value
            )


            if not is_number(
                value
            ):
                raise ValueError(
                    f"Salary value in "
                    f"B{row} is not numeric."
                )


            return money(
                float(value)
            )


    return None


# ============================================================
# Read one monthly worksheet
# ============================================================

def read_month(
    workbook_formulas,
    workbook_values,
    sheet_name: str,
) -> SheetResult:

    result = SheetResult(
        sheet_name=sheet_name
    )


    worksheet = (
        workbook_formulas[
            sheet_name
        ]
    )

    worksheet_values = (
        workbook_values[
            sheet_name
        ]
    )


    month_date = (
        parse_sheet_month(
            sheet_name
        )
    )


    if month_date is None:
        result.errors.append(
            "Could not determine "
            "month from sheet name."
        )

        return result


    # --------------------------------------------------------
    # Legend for this specific month
    # --------------------------------------------------------

    legend = build_legend(
        worksheet,
        result,
    )


    # --------------------------------------------------------
    # Individual transactions
    # --------------------------------------------------------

    date_columns: list[
        tuple[int, date]
    ] = []


    for column in range(
        1,
        worksheet.max_column + 1,
    ):

        header_cell = (
            worksheet.cell(
                row=DATE_ROW,
                column=column,
            )
        )


        transaction_date = (
            get_cell_date(
                header_cell,
                workbook_formulas,
            )
        )


        if transaction_date is None:
            continue


        # Make sure the header date belongs
        # to the month indicated by the sheet.
        if (
            transaction_date.year
            != month_date.year
            or transaction_date.month
            != month_date.month
        ):
            result.errors.append(
                f"{header_cell.coordinate}: "
                f"date {transaction_date} "
                f"does not match sheet "
                f"'{sheet_name}'."
            )

            continue


        date_columns.append(
            (
                column,
                transaction_date,
            )
        )


    if not date_columns:
        result.errors.append(
            "No dates were found in row 1."
        )

        return result


    # --------------------------------------------------------
    # Parse each expense cell
    # --------------------------------------------------------

    for (
        column,
        transaction_date,
    ) in date_columns:


        actual_daily_total = 0.0


        for row in range(
            FIRST_TRANSACTION_ROW,
            LAST_TRANSACTION_ROW + 1,
        ):

            cell = worksheet.cell(
                row=row,
                column=column,
            )


            value_cell = (
                worksheet_values.cell(
                    row=row,
                    column=column,
                )
            )


            # Normally transaction cells are
            # constants. If a formula exists,
            # use its cached value.
            if cell.data_type == "f":
                value = value_cell.value
            else:
                value = cell.value


            if value is None:
                continue


            if not is_number(
                value
            ):
                result.errors.append(
                    f"{cell.coordinate}: "
                    f"transaction value "
                    f"'{value}' is not numeric."
                )

                continue


            amount = money(
                float(value)
            )


            if amount <= 0:
                result.errors.append(
                    f"{cell.coordinate}: "
                    f"transaction amount "
                    f"must be positive, "
                    f"found {amount}."
                )

                continue


            color = fill_key(
                cell
            )


            if color is None:
                result.errors.append(
                    f"{cell.coordinate}: "
                    f"{amount:.2f} has no "
                    f"category color."
                )

                continue


            category_info = (
                legend.get(
                    color
                )
            )


            if category_info is None:
                result.errors.append(
                    f"{cell.coordinate}: "
                    f"{amount:.2f} uses a "
                    f"color that is not "
                    f"present in this "
                    f"month's legend."
                )

                continue


            (
                category,
                transaction_type,
            ) = category_info


            result.transactions.append(
                ImportedTransaction(
                    date=transaction_date,
                    amount=amount,
                    transaction_type=(
                        transaction_type
                    ),
                    category=category,
                    description=None,
                    source_sheet=(
                        sheet_name
                    ),
                    source_cell=(
                        cell.coordinate
                    ),
                )
            )


            actual_daily_total += (
                amount
            )


        # ----------------------------------------------------
        # Validate against row 17
        # ----------------------------------------------------

        total_cell = (
            worksheet_values.cell(
                row=DAILY_TOTAL_ROW,
                column=column,
            )
        )


        expected = (
            total_cell.value
        )


        if is_number(expected):

            expected = money(
                float(expected)
            )

            actual_daily_total = money(
                actual_daily_total
            )


            result.daily_total_expected += (
                expected
            )

            result.daily_total_found += (
                actual_daily_total
            )


            if (
                abs(
                    expected
                    - actual_daily_total
                )
                > 0.01
            ):
                result.errors.append(
                    f"{total_cell.coordinate}: "
                    f"daily total mismatch. "
                    f"Sheet says "
                    f"{expected:.2f}, "
                    f"import found "
                    f"{actual_daily_total:.2f}."
                )

        else:

            result.warnings.append(
                f"{total_cell.coordinate}: "
                f"no cached daily total "
                f"available for validation."
            )


    # --------------------------------------------------------
    # Monthly income
    # --------------------------------------------------------

    try:

        if month_date < NEW_INCOME_START:

            formula = (
                worksheet[
                    OLD_INCOME_CELL
                ].value
            )


            salary = (
                parse_old_income_formula(
                    formula
                )
            )

        else:

            salary = find_salary(
                worksheet_values
            )


            if salary is None:
                raise ValueError(
                    "Could not find the "
                    "'salary' row."
                )


        if salary <= 0:
            raise ValueError(
                f"Income must be positive, "
                f"found {salary}."
            )


        result.transactions.append(
            ImportedTransaction(
                date=month_date,
                amount=salary,
                transaction_type="income",
                category="Salary",
                description=None,
                source_sheet=sheet_name,
                source_cell=(
                    OLD_INCOME_CELL
                    if month_date
                    < NEW_INCOME_START
                    else "salary"
                ),
            )
        )


    except ValueError as error:

        result.errors.append(
            f"Income: {error}"
        )


    result.daily_total_expected = money(
        result.daily_total_expected
    )

    result.daily_total_found = money(
        result.daily_total_found
    )


    return result


# ============================================================
# Read entire workbook
# ============================================================

def read_workbook(
    file_path: Path,
) -> list[SheetResult]:

    # One workbook keeps formulas.
    workbook_formulas = (
        load_workbook(
            file_path,
            data_only=False,
        )
    )


    # The second gives cached formula values,
    # needed for row-17 validation and salary.
    workbook_values = (
        load_workbook(
            file_path,
            data_only=True,
        )
    )


    results: list[
        SheetResult
    ] = []


    for sheet_name in (
        workbook_formulas.sheetnames
    ):

        month = parse_sheet_month(
            sheet_name
        )


        # Ignore sheets such as Appartamento.
        if month is None:
            print(
                f"Skipping non-month sheet: "
                f"{sheet_name}"
            )

            continue


        result = read_month(
            workbook_formulas,
            workbook_values,
            sheet_name,
        )

        results.append(
            result
        )


    return results


# ============================================================
# Console report
# ============================================================

def print_sheet_summary(
    result: SheetResult,
) -> None:

    print()
    print(
        "=" * 60
    )

    print(
        result.sheet_name
    )

    print(
        "=" * 60
    )


    counts: Counter[str] = (
        Counter()
    )

    totals: defaultdict[
        str,
        float,
    ] = defaultdict(float)


    for transaction in (
        result.transactions
    ):

        counts[
            transaction.transaction_type
        ] += 1

        totals[
            transaction.transaction_type
        ] += transaction.amount


    print(
        f"Normal expenses: "
        f"{counts['expense']:4d}  "
        f"{totals['expense']:10.2f} €"
    )

    print(
        f"Investments:     "
        f"{counts['investment']:4d}  "
        f"{totals['investment']:10.2f} €"
    )

    print(
        f"Reimbursable:    "
        f"{counts['reimbursable']:4d}  "
        f"{totals['reimbursable']:10.2f} €"
    )

    print(
        f"Income:          "
        f"{counts['income']:4d}  "
        f"{totals['income']:10.2f} €"
    )


    print()

    print(
        "Daily-total validation: "
        f"{result.daily_total_found:.2f} € "
        f"/ "
        f"{result.daily_total_expected:.2f} €"
    )


    if result.warnings:

        print()

        print("Warnings:")

        for warning in (
            result.warnings
        ):
            print(
                f"  - {warning}"
            )


    if result.errors:

        print()

        print("ERRORS:")

        for error in (
            result.errors
        ):
            print(
                f"  - {error}"
            )


# ============================================================
# Duplicate handling
# ============================================================

def transaction_key(
    transaction,
) -> tuple:
    """
    Multiset-style duplicate detection.

    This is better than simply checking
    whether date/category/amount exists,
    because two genuinely identical
    transactions may occur on the same day.

    Example:

        8.00 Restaurant
        8.00 Restaurant

    should still result in two transactions.
    """

    return (
        transaction.date,
        money_cents(
            transaction.amount
        ),
        transaction.transaction_type,
        transaction.category,
        transaction.description,
    )


def get_existing_transactions(
    db,
) -> Counter:

    counter: Counter = Counter()


    rows = (
        db.query(
            models.Transaction
        )
        .all()
    )


    for row in rows:

        counter[
            transaction_key(
                row
            )
        ] += 1


    return counter


# ============================================================
# Database import
# ============================================================

def import_transactions(
    results: list[SheetResult],
) -> tuple[int, int]:

    imported = [
        transaction

        for result in results

        for transaction
        in result.transactions
    ]


    imported.sort(
        key=lambda transaction: (
            transaction.date,
            transaction.source_sheet,
            transaction.source_cell,
        )
    )


    db = SessionLocal()


    inserted = 0
    skipped = 0


    try:

        existing = (
            get_existing_transactions(
                db
            )
        )


        for transaction in imported:

            key = transaction_key(
                transaction
            )


            # Multiset logic:
            #
            # If one identical transaction
            # already exists, consume one
            # existing occurrence.
            #
            # A second identical historical
            # transaction can still be inserted.
            if existing[key] > 0:

                existing[key] -= 1

                skipped += 1

                continue


            db.add(
                models.Transaction(
                    date=transaction.date,
                    amount=transaction.amount,
                    transaction_type=(
                        transaction.transaction_type
                    ),
                    category=(
                        transaction.category
                    ),
                    description=(
                        transaction.description
                    ),
                )
            )


            inserted += 1


        db.commit()


    except Exception:

        db.rollback()

        raise


    finally:

        db.close()


    return (
        inserted,
        skipped,
    )


# ============================================================
# Main
# ============================================================

def main() -> None:

    parser = argparse.ArgumentParser(
        description=(
            "Import historical transactions "
            "from the Expenses Excel workbook."
        )
    )


    parser.add_argument(
        "file",
        type=Path,
        help=(
            "Path to Expenses.xlsx"
        ),
    )


    parser.add_argument(
        "--commit",
        action="store_true",
        help=(
            "Actually insert transactions "
            "into the database. "
            "Without this option the script "
            "performs a dry run only."
        ),
    )


    args = parser.parse_args()


    file_path = (
        args.file.expanduser().resolve()
    )


    if not file_path.exists():

        raise SystemExit(
            f"File does not exist:\n"
            f"{file_path}"
        )


    print()
    print(
        f"Reading:\n{file_path}"
    )


    print()
    print(
        "Mode: "
        + (
            "COMMIT"
            if args.commit
            else "DRY RUN"
        )
    )


    results = read_workbook(
        file_path
    )


    for result in results:
        print_sheet_summary(
            result
        )


    all_errors = [
        error

        for result in results

        for error in result.errors
    ]


    all_warnings = [
        warning

        for result in results

        for warning in result.warnings
    ]


    all_transactions = [
        transaction

        for result in results

        for transaction
        in result.transactions
    ]


    print()
    print(
        "=" * 60
    )

    print(
        "IMPORT SUMMARY"
    )

    print(
        "=" * 60
    )


    print(
        f"Monthly sheets: "
        f"{len(results)}"
    )

    print(
        f"Transactions found: "
        f"{len(all_transactions)}"
    )

    print(
        f"Warnings: "
        f"{len(all_warnings)}"
    )

    print(
        f"Errors: "
        f"{len(all_errors)}"
    )


    if all_errors:

        print()

        print(
            "Import cannot be committed "
            "because validation errors "
            "were found."
        )

        raise SystemExit(1)


    if not args.commit:

        print()

        print(
            "Dry run completed successfully."
        )

        print(
            "No database changes were made."
        )

        print()

        print(
            "After checking the results, "
            "run again with --commit."
        )

        return


    print()

    print(
        "Writing transactions "
        "to database..."
    )


    inserted, skipped = (
        import_transactions(
            results
        )
    )


    print()

    print(
        "Import completed successfully."
    )

    print(
        f"Inserted: {inserted}"
    )

    print(
        f"Already present / skipped: "
        f"{skipped}"
    )


if __name__ == "__main__":
    main()