"""Build the two *synthetic* SQLite examples shipped with this project.

Run from the repository root:

    python backend/scripts/seed_demo.py --kind empty
    python backend/scripts/seed_demo.py --kind demo

These commands only touch backend/samples/. They never modify the user's
private backend/data/expenses.db database.
"""

from __future__ import annotations

import argparse
import calendar
import random
import sys
from datetime import date, datetime
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base  # noqa: E402
from app.models import Transaction  # noqa: E402

SAMPLE_DIR = BACKEND_DIR / "samples"
DEMO_YEAR = 2026
SEED = 2026


def generate_transactions() -> list[Transaction]:
    """Generate reproducible illustrative records for every 2026 month."""
    randomizer = random.Random(SEED)
    rows: list[Transaction] = []

    def add(month: int, day: int, category: str, kind: str,
            amount: float, description: str) -> None:
        rows.append(Transaction(
            date=date(DEMO_YEAR, month, day),
            amount=round(amount, 2),
            transaction_type=kind,
            category=category,
            description=description,
            created_at=datetime(DEMO_YEAR, month, day, 12),
        ))

    for month in range(1, 13):
        last_day = calendar.monthrange(DEMO_YEAR, month)[1]

        # Synthetic income and consistent monthly commitments.
        salary = 2975 + (month % 4) * 85
        add(month, 1, "Salary", "income", salary, "Example monthly salary")
        if month in (3, 7, 11):
            add(month, 14, "Other Income", "income", 120 + month * 12,
                "Example freelance payment")

        add(month, 2, "Rent", "expense", 845, "Apartment rent")
        add(month, 3, "Subscriptions", "expense", 12.99, "Music subscription")
        add(month, 4, "Subscriptions", "expense", 18.50, "Cloud storage and software")

        # Grocery shopping, cafes/restaurants and discretionary purchases.
        for _ in range(9):
            day = randomizer.randint(1, last_day)
            add(month, day, "Grocery", "expense",
                randomizer.uniform(23, 78),
                randomizer.choice(["Supermarket", "Local market", "Groceries"]))
        for _ in range(6):
            day = randomizer.randint(1, last_day)
            add(month, day, "Restaurant", "expense",
                randomizer.uniform(9, 56),
                randomizer.choice(["Coffee and snacks", "Dinner out", "Lunch" ]))
        for _ in range(4):
            day = randomizer.randint(1, last_day)
            add(month, day, "Extra", "expense",
                randomizer.uniform(11, 110),
                randomizer.choice(["Household purchase", "Books", "Activities"]))
        for _ in range(2):
            day = randomizer.randint(1, last_day)
            add(month, day, "Car", "expense",
                randomizer.uniform(29, 94),
                "Transport and fuel")
        if month % 2 == 0:
            add(month, 18, "Psicologa", "expense", 60,
                "Example appointment")

        # Seasonal spending makes charts visibly change month to month.
        if month in (2, 4, 6, 8, 9, 12):
            add(month, 21, "Travel", "expense",
                95 + (month * 31), "Trip and accommodation")
            add(month, 22, "Travel", "expense",
                randomizer.uniform(35, 115), "Travel tickets")

        # Investments and reimbursable expenses are separate from spending.
        add(month, 10, "Investimenti", "investment",
            240 + (month % 3) * 80, "Example monthly contribution")
        if month in (1, 3, 5, 7, 9, 11):
            add(month, 16, "Refund cost", "reimbursable",
                30 + month * 9, "Example reimbursable work expense")

    # Stable ordering and reproducible primary key assignments.
    rows.sort(key=lambda row: (row.date, row.transaction_type, row.category, row.description))
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--kind", choices=("empty", "demo"), default="demo")
    parser.add_argument("--force", action="store_true",
                        help="Overwrite the chosen example database (never the private database)")
    args = parser.parse_args()

    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    output = SAMPLE_DIR / ("demo.db" if args.kind == "demo" else "empty.db")
    if output.exists():
        if not args.force:
            parser.error(f"{output} already exists. Pass --force to regenerate it.")
        output.unlink()

    engine = create_engine(f"sqlite:///{output.as_posix()}")
    try:
        Base.metadata.create_all(bind=engine)
        count = 0
        if args.kind == "demo":
            rows = generate_transactions()
            with Session(engine) as session:
                session.add_all(rows)
                session.commit()
            count = len(rows)
    finally:
        engine.dispose()

    print(f"Created {output} with {count} synthetic transactions.")
    print("Personal database at backend/data/expenses.db was not accessed or modified.")


if __name__ == "__main__":
    main()
