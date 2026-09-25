from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session

from . import models, schemas
from .database import Base, engine, get_db


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Expenses Dashboard API",
    version="0.1.0",
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