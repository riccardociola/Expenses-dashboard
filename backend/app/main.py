import datetime

from collections import defaultdict

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
    status,
)

from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas

from .database import (
    Base,
    engine,
    get_db,
)


# ============================================================
# Database
# ============================================================

Base.metadata.create_all(
    bind=engine,
)


# ============================================================
# FastAPI app
# ============================================================

app = FastAPI(
    title="Expenses Dashboard API",
)


# ============================================================
# CORS
#
# Allows the Next.js frontend running on port 3000
# to communicate with FastAPI running on port 8000.
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Helpers
# ============================================================

def shift_month(
    value: datetime.date,
    months: int,
) -> datetime.date:
    """
    Move a date by a whole number of months.

    The returned date is always the first
    day of the resulting month.
    """

    month_index = (
        value.year * 12
        + value.month
        - 1
        + months
    )

    year, month = divmod(
        month_index,
        12,
    )

    return datetime.date(
        year,
        month + 1,
        1,
    )


def month_bounds(
    year: int,
    month: int,
) -> tuple[
    datetime.date,
    datetime.date,
]:
    """
    Return:

        first day of selected month
        first day of following month
    """

    start_date = datetime.date(
        year,
        month,
        1,
    )

    end_date = shift_month(
        start_date,
        1,
    )

    return (
        start_date,
        end_date,
    )


# ============================================================
# Basic endpoints
# ============================================================

@app.get("/")
def root():
    return {
        "message":
            "Expenses Dashboard API",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


# ============================================================
# Transactions
# ============================================================

@app.post(
    "/transactions",
    response_model=schemas.TransactionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
):
    new_transaction = (
        models.Transaction(
            **transaction.model_dump(),
        )
    )

    db.add(
        new_transaction
    )

    db.commit()

    db.refresh(
        new_transaction
    )

    return new_transaction


@app.get(
    "/transactions",
    response_model=list[
        schemas.TransactionRead
    ],
)
def get_transactions(
    db: Session = Depends(get_db),
):
    return (
        db.query(
            models.Transaction
        )
        .order_by(
            models.Transaction.date.desc()
        )
        .all()
    )


@app.put(
    "/transactions/{transaction_id}",
    response_model=schemas.TransactionRead,
)
def update_transaction(
    transaction_id: int,
    updated_transaction:
        schemas.TransactionCreate,
    db: Session = Depends(get_db),
):
    transaction = (
        db.query(
            models.Transaction
        )
        .filter(
            models.Transaction.id
            == transaction_id
        )
        .first()
    )

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Transaction not found"
            ),
        )


    for (
        field,
        value,
    ) in (
        updated_transaction
        .model_dump()
        .items()
    ):
        setattr(
            transaction,
            field,
            value,
        )


    db.commit()

    db.refresh(
        transaction
    )

    return transaction


@app.delete(
    "/transactions/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
):
    transaction = (
        db.query(
            models.Transaction
        )
        .filter(
            models.Transaction.id
            == transaction_id
        )
        .first()
    )


    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Transaction not found"
            ),
        )


    db.delete(
        transaction
    )

    db.commit()

    return None


# ============================================================
# Monthly report
# ============================================================

@app.get(
    "/reports/monthly",
    response_model=schemas.MonthlyReport,
)
def get_monthly_report(
    year: int,
    month: int = Query(
        ge=1,
        le=12,
    ),
    db: Session = Depends(get_db),
):
    (
        start_date,
        end_date,
    ) = month_bounds(
        year,
        month,
    )


    # --------------------------------------------------------
    # Income
    # --------------------------------------------------------

    income = (
        db.query(
            func.sum(
                models.Transaction.amount
            )
        )
        .filter(
            models.Transaction.date
            >= start_date,

            models.Transaction.date
            < end_date,

            models.Transaction.transaction_type
            == "income",
        )
        .scalar()
        or 0.0
    )


    # --------------------------------------------------------
    # Normal expenses only
    #
    # Investments and reimbursable costs are deliberately
    # excluded.
    # --------------------------------------------------------

    expenses = (
        db.query(
            func.sum(
                models.Transaction.amount
            )
        )
        .filter(
            models.Transaction.date
            >= start_date,

            models.Transaction.date
            < end_date,

            models.Transaction.transaction_type
            == "expense",
        )
        .scalar()
        or 0.0
    )


    income = float(
        income
    )

    expenses = float(
        expenses
    )


    net_cash_flow = (
        income
        - expenses
    )


    savings_rate = (
        net_cash_flow
        / income
        * 100
        if income > 0
        else None
    )


    return {
        "year":
            year,

        "month":
            month,

        "income":
            round(
                income,
                2,
            ),

        "expenses":
            round(
                expenses,
                2,
            ),

        "net_cash_flow":
            round(
                net_cash_flow,
                2,
            ),

        "savings_rate":
            (
                round(
                    savings_rate,
                    2,
                )
                if savings_rate
                is not None
                else None
            ),
    }


# ============================================================
# Monthly category report
# ============================================================

@app.get(
    "/reports/categories",
    response_model=list[
        schemas.CategoryReport
    ],
)
def get_category_report(
    year: int,
    month: int = Query(
        ge=1,
        le=12,
    ),
    db: Session = Depends(get_db),
):
    (
        start_date,
        end_date,
    ) = month_bounds(
        year,
        month,
    )


    categories = (
        db.query(
            models.Transaction.category,

            func.sum(
                models.Transaction.amount
            ).label(
                "amount"
            ),
        )
        .filter(
            models.Transaction.date
            >= start_date,

            models.Transaction.date
            < end_date,

            # Only ordinary expenses
            models.Transaction.transaction_type
            == "expense",
        )
        .group_by(
            models.Transaction.category
        )
        .order_by(
            func.sum(
                models.Transaction.amount
            ).desc()
        )
        .all()
    )


    return [
        {
            "category":
                category,

            "amount":
                round(
                    float(amount),
                    2,
                ),
        }

        for (
            category,
            amount,
        ) in categories
    ]


# ============================================================
# Spending insight
#
# Compare selected month with the six complete
# calendar months immediately before it.
# ============================================================

@app.get(
    "/reports/spending-insight",
    response_model=schemas.SpendingInsight,
)
def get_spending_insight(
    year: int,
    month: int = Query(
        ge=1,
        le=12,
    ),
    db: Session = Depends(get_db),
):
    current_start = (
        datetime.date(
            year,
            month,
            1,
        )
    )

    current_end = shift_month(
        current_start,
        1,
    )

    history_start = shift_month(
        current_start,
        -6,
    )


    # --------------------------------------------------------
    # Current month expenses
    # --------------------------------------------------------

    current_rows = (
        db.query(
            models.Transaction.date,
            models.Transaction.category,
            models.Transaction.amount,
        )
        .filter(
            models.Transaction.date
            >= current_start,

            models.Transaction.date
            < current_end,

            models.Transaction.transaction_type
            == "expense",
        )
        .all()
    )


    current_total = 0.0

    current_categories = (
        defaultdict(float)
    )


    for (
        _,
        category,
        amount,
    ) in current_rows:

        value = float(
            amount
        )

        current_total += (
            value
        )

        current_categories[
            category
        ] += value


    # --------------------------------------------------------
    # Previous six complete months
    # --------------------------------------------------------

    history_rows = (
        db.query(
            models.Transaction.date,
            models.Transaction.category,
            models.Transaction.amount,
        )
        .filter(
            models.Transaction.date
            >= history_start,

            models.Transaction.date
            < current_start,

            models.Transaction.transaction_type
            == "expense",
        )
        .all()
    )


    monthly_totals = {
        (
            shift_month(
                current_start,
                -i,
            ).year,

            shift_month(
                current_start,
                -i,
            ).month,
        ): 0.0

        for i in range(
            1,
            7,
        )
    }


    history_categories = (
        defaultdict(float)
    )


    for (
        transaction_date,
        category,
        amount,
    ) in history_rows:

        value = float(
            amount
        )


        key = (
            transaction_date.year,
            transaction_date.month,
        )


        monthly_totals[
            key
        ] += value


        history_categories[
            category
        ] += value


    six_month_average = (
        sum(
            monthly_totals.values()
        )
        / 6
    )


    difference = (
        current_total
        - six_month_average
    )


    difference_percentage = (
        difference
        / six_month_average
        * 100
        if six_month_average > 0
        else None
    )


    # --------------------------------------------------------
    # Category comparison
    # --------------------------------------------------------

    category_names = (
        set(
            current_categories
        )
        |
        set(
            history_categories
        )
    )


    categories = [
        {
            "category":
                category,

            "current":
                round(
                    current_categories[
                        category
                    ],
                    2,
                ),

            "average":
                round(
                    history_categories[
                        category
                    ]
                    / 6,
                    2,
                ),
        }

        for category
        in category_names
    ]


    categories.sort(
        key=lambda item:
            item["current"],
        reverse=True,
    )


    return {
        "current_expenses":
            round(
                current_total,
                2,
            ),

        "six_month_average":
            round(
                six_month_average,
                2,
            ),

        "difference":
            round(
                difference,
                2,
            ),

        "difference_percentage":
            (
                round(
                    difference_percentage,
                    2,
                )
                if difference_percentage
                is not None
                else None
            ),

        "categories":
            categories,
    }


# ============================================================
# Yearly report
#
# Used by the Insights page.
#
# Normal expenses:
#     transaction_type == "expense"
#
# Investments:
#     transaction_type == "investment"
#
# Reimbursable expenses:
#     ignored for now
#
# Investments are NOT subtracted from income when
# calculating net cash flow.
# ============================================================

@app.get(
    "/reports/yearly",
    response_model=schemas.YearlyReport,
)
def get_yearly_report(
    year: int,
    db: Session = Depends(get_db),
):
    start_date = datetime.date(
        year,
        1,
        1,
    )

    end_date = datetime.date(
        year + 1,
        1,
        1,
    )


    transactions = (
        db.query(
            models.Transaction
        )
        .filter(
            models.Transaction.date
            >= start_date,

            models.Transaction.date
            < end_date,
        )
        .all()
    )


    # --------------------------------------------------------
    # Monthly containers
    # --------------------------------------------------------

    monthly_data = {
        month: {
            "income": 0.0,
            "expenses": 0.0,
            "investments": 0.0,
        }

        for month in range(
            1,
            13,
        )
    }


    category_totals: dict[
        str,
        float,
    ] = {}


    total_income = 0.0
    total_expenses = 0.0
    total_investments = 0.0


    months_with_data: set[
        int
    ] = set()


    # --------------------------------------------------------
    # Aggregate transactions
    # --------------------------------------------------------

    for transaction in (
        transactions
    ):
        month = (
            transaction.date.month
        )

        amount = float(
            transaction.amount
        )


        months_with_data.add(
            month
        )


        # ----------------------------------------------------
        # Income
        # ----------------------------------------------------

        if (
            transaction.transaction_type
            == "income"
        ):
            total_income += amount

            monthly_data[
                month
            ]["income"] += amount


        # ----------------------------------------------------
        # Normal expenses
        # ----------------------------------------------------

        elif (
            transaction.transaction_type
            == "expense"
        ):
            total_expenses += amount

            monthly_data[
                month
            ]["expenses"] += amount


            category_totals[
                transaction.category
            ] = (
                category_totals.get(
                    transaction.category,
                    0.0,
                )
                + amount
            )


        # ----------------------------------------------------
        # Investments
        # ----------------------------------------------------

        elif (
            transaction.transaction_type
            == "investment"
        ):
            total_investments += (
                amount
            )

            monthly_data[
                month
            ]["investments"] += amount


        # ----------------------------------------------------
        # Reimbursable
        #
        # Deliberately ignored for now.
        # ----------------------------------------------------

        elif (
            transaction.transaction_type
            == "reimbursable"
        ):
            pass


    # --------------------------------------------------------
    # Annual summary
    # --------------------------------------------------------

    net_cash_flow = (
        total_income
        - total_expenses
    )


    savings_rate = (
        net_cash_flow
        / total_income
        * 100
        if total_income > 0
        else None
    )


    # --------------------------------------------------------
    # Only return months up to the latest month for
    # which at least one transaction exists.
    #
    # This avoids showing future months as zero when
    # looking at the current year.
    # --------------------------------------------------------

    last_month = (
        max(
            months_with_data
        )
        if months_with_data
        else 0
    )


    months = []


    for month in range(
        1,
        last_month + 1,
    ):
        income = (
            monthly_data[
                month
            ]["income"]
        )

        expenses = (
            monthly_data[
                month
            ]["expenses"]
        )

        investments = (
            monthly_data[
                month
            ]["investments"]
        )


        months.append(
            {
                "month":
                    month,

                "income":
                    round(
                        income,
                        2,
                    ),

                "expenses":
                    round(
                        expenses,
                        2,
                    ),

                "net_cash_flow":
                    round(
                        income
                        - expenses,
                        2,
                    ),

                "investments":
                    round(
                        investments,
                        2,
                    ),
            }
        )


    # --------------------------------------------------------
    # Annual spending categories
    #
    # Only normal expenses are included.
    # --------------------------------------------------------

    categories = [
        {
            "category":
                category,

            "amount":
                round(
                    amount,
                    2,
                ),
        }

        for (
            category,
            amount,
        ) in (
            category_totals.items()
        )
    ]


    categories.sort(
        key=lambda item:
            item["amount"],
        reverse=True,
    )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "year":
            year,

        "income":
            round(
                total_income,
                2,
            ),

        "expenses":
            round(
                total_expenses,
                2,
            ),

        "net_cash_flow":
            round(
                net_cash_flow,
                2,
            ),

        "savings_rate":
            (
                round(
                    savings_rate,
                    2,
                )
                if savings_rate
                is not None
                else None
            ),

        "investments":
            round(
                total_investments,
                2,
            ),

        "months":
            months,

        "categories":
            categories,
    }