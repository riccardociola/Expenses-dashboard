from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TransactionCreate(BaseModel):
    date: date
    amount: float = Field(gt=0)
    transaction_type: Literal["expense", "income"]
    category: str
    description: str | None = None


class TransactionRead(TransactionCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MonthlyReport(BaseModel):
    year: int
    month: int
    income: float
    expenses: float
    net_cash_flow: float
    savings_rate: float | None


class CategoryReport(BaseModel):
    category: str
    amount: float