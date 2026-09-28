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


class CategorySpendingInsight(BaseModel):
    category: str
    current: float
    average: float


class SpendingInsight(BaseModel):
    current_expenses: float
    six_month_average: float
    difference: float
    difference_percentage: float | None
    categories: list[CategorySpendingInsight]