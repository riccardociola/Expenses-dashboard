from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# backend/
BACKEND_DIR = Path(__file__).resolve().parent.parent

# backend/data/
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DATABASE_PATH = DATA_DIR / "expenses.db"

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()