import datetime

from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

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