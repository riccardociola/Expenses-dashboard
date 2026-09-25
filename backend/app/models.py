from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)

    date: Mapped[date] = mapped_column(Date)

    amount: Mapped[float] = mapped_column(Float)

    transaction_type: Mapped[str] = mapped_column(String)

    category: Mapped[str] = mapped_column(String)

    description: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )