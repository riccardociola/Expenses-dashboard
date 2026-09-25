from fastapi import FastAPI

from .database import Base, engine
from . import models


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