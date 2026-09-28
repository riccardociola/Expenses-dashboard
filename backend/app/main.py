import datetime

from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from collections import defaultdict

from . import models, schemas
from .database import Base, engine, get_db

from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Expenses Dashboard API",
    version="0.1.0",
)

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


@app.get("/")
def root():
    return {"message": "Expenses Dashboard API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


def shift_month(
    date: datetime.date,
    months: int,
) -> datetime.date:
    month_index = (
        date.year * 12
        + date.month
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


@app.post(
    "/transactions",
    response_model=schemas.TransactionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
):
    new_transaction = models.Transaction(
        **transaction.model_dump()
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


@app.get(
    "/transactions",
    response_model=list[schemas.TransactionRead],
)
def get_transactions(
    db: Session = Depends(get_db),
):
    transactions = (
        db.query(models.Transaction)
        .order_by(models.Transaction.date.desc())
        .all()
    )

    return transactions


@app.delete(
    "/transactions/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
):
    transaction = (
        db.query(models.Transaction)
        .filter(models.Transaction.id == transaction_id)
        .first()
    )

    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    db.delete(transaction)
    db.commit()


@app.put(
    "/transactions/{transaction_id}",
    response_model=schemas.TransactionRead,
)
def update_transaction(
    transaction_id: int,
    updated_transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
):
    transaction = (
        db.query(models.Transaction)
        .filter(models.Transaction.id == transaction_id)
        .first()
    )

    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )

    for field, value in updated_transaction.model_dump().items():
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)

    return transaction


@app.get(
    "/reports/monthly",
    response_model=schemas.MonthlyReport,
)
def get_monthly_report(
    year: int,
    month: int = Query(ge=1, le=12),
    db: Session = Depends(get_db),
):
    start_date = datetime.date(year, month, 1)

    if month == 12:
        end_date = datetime.date(year + 1, 1, 1)
    else:
        end_date = datetime.date(year, month + 1, 1)

    income = (
        db.query(func.sum(models.Transaction.amount))
        .filter(
            models.Transaction.date >= start_date,
            models.Transaction.date < end_date,
            models.Transaction.transaction_type == "income",
        )
        .scalar()
        or 0.0
    )

    expenses = (
        db.query(func.sum(models.Transaction.amount))
        .filter(
            models.Transaction.date >= start_date,
            models.Transaction.date < end_date,
            models.Transaction.transaction_type == "expense",
        )
        .scalar()
        or 0.0
    )

    net_cash_flow = income - expenses

    savings_rate = (
        net_cash_flow / income * 100
        if income > 0
        else None
    )

    return {
        "year": year,
        "month": month,
        "income": income,
        "expenses": expenses,
        "net_cash_flow": net_cash_flow,
        "savings_rate": savings_rate,
    }


@app.get(
    "/reports/categories",
    response_model=list[schemas.CategoryReport],
)
def get_category_report(
    year: int,
    month: int = Query(ge=1, le=12),
    db: Session = Depends(get_db),
):
    start_date = datetime.date(year, month, 1)

    if month == 12:
        end_date = datetime.date(year + 1, 1, 1)
    else:
        end_date = datetime.date(year, month + 1, 1)

    categories = (
        db.query(
            models.Transaction.category,
            func.sum(models.Transaction.amount).label("amount"),
        )
        .filter(
            models.Transaction.date >= start_date,
            models.Transaction.date < end_date,
            models.Transaction.transaction_type == "expense",
        )
        .group_by(models.Transaction.category)
        .order_by(func.sum(models.Transaction.amount).desc())
        .all()
    )

    return [
        {
            "category": category,
            "amount": float(amount),
        }
        for category, amount in categories
    ]


@app.get(
    "/reports/spending-insight",
    response_model=schemas.SpendingInsight,
)
def get_spending_insight(
    year: int,
    month: int = Query(ge=1, le=12),
    db: Session = Depends(get_db),
):
    current_start = datetime.date(
        year,
        month,
        1,
    )

    current_end = shift_month(
        current_start,
        1,
    )

    history_start = shift_month(
        current_start,
        -6,
    )


    # -----------------------------
    # Current month
    # -----------------------------

    current_rows = (
        db.query(
            models.Transaction.date,
            models.Transaction.category,
            models.Transaction.amount,
        )
        .filter(
            models.Transaction.date >= current_start,
            models.Transaction.date < current_end,
            models.Transaction.transaction_type == "expense",
        )
        .all()
    )


    current_total = 0.0
    current_categories = defaultdict(float)

    for _, category, amount in current_rows:
        amount = float(amount)

        current_total += amount
        current_categories[category] += amount


    # -----------------------------
    # Previous six months
    # -----------------------------

    history_rows = (
        db.query(
            models.Transaction.date,
            models.Transaction.category,
            models.Transaction.amount,
        )
        .filter(
            models.Transaction.date >= history_start,
            models.Transaction.date < current_start,
            models.Transaction.transaction_type == "expense",
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
        for i in range(1, 7)
    }


    history_categories = defaultdict(float)


    for transaction_date, category, amount in history_rows:
        amount = float(amount)

        key = (
            transaction_date.year,
            transaction_date.month,
        )

        monthly_totals[key] += amount

        history_categories[category] += amount


    six_month_average = (
        sum(monthly_totals.values())
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


    # -----------------------------
    # Category comparison
    # -----------------------------

    category_names = (
        set(current_categories)
        | set(history_categories)
    )


    categories = [
        {
            "category": category,
            "current": current_categories[
                category
            ],
            "average": (
                history_categories[
                    category
                ]
                / 6
            ),
        }
        for category in category_names
    ]


    categories.sort(
        key=lambda item:
            item["current"],
        reverse=True,
    )


    return {
        "current_expenses":
            current_total,

        "six_month_average":
            six_month_average,

        "difference":
            difference,

        "difference_percentage":
            difference_percentage,

        "categories":
            categories,
    }