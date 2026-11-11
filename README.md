# Expenses Dashboard

A **local-first personal finance dashboard** built with Next.js, FastAPI and SQLite. Record individual transactions, explore spending by month, and analyze your finances over time. No account or cloud service is required for local use.

> **Privacy:** Your real financial database is stored locally at `backend/data/expenses.db` and is intentionally excluded from Git. The two databases in `backend/samples/` contain **no personal information**: one is empty and the other contains synthetic example transactions.

## Features

- **Monthly dashboard:** income, spending, net cash flow, savings rate, category breakdown and a comparison with the previous six months.
- **Transaction management:** add, edit and delete transactions, with category-colored tags and a month selector.
- **Yearly insights:** monthly income/expense/cash-flow trends, annual category breakdown, yearly summary and investment contributions.
- **Separate transaction types:** `expense`, `income`, `investment` and `reimbursable`.
- **Historical import:** a script for converting the original color-coded Excel workbook to SQLite (optional and tailored to that workbook).
- **Demo mode:** prebuilt synthetic transactions for every month of 2026, or a blank database for starting from scratch.

### Reporting rules

Net cash flow and savings rate are currently calculated as **income minus ordinary expenses**. Investment contributions are reported separately and do **not** reduce this figure. Reimbursable expenses are stored but excluded from spending reports and pie charts. These metrics therefore describe the app's chosen reporting conventions, not an audited bank balance or portfolio performance.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Charts | Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite |
| Historical import | Python, openpyxl |

## Getting started

Requirements: **Python 3.11+**, **Node.js 20.9+** and npm. Instructions below use PowerShell on Windows; equivalent Python/npm commands work on other systems.

From the repository root:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd frontend
npm ci
cd ..
```

A fresh install needs **no preexisting database**. On first backend startup, SQLAlchemy creates `backend/data/expenses.db` with an empty `transactions` table.

Start the backend in one terminal:

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Start the frontend in another terminal:

```powershell
cd frontend
npm run dev -- --hostname 127.0.0.1
```

Open **http://localhost:3000**. API documentation is available at **http://127.0.0.1:8000/docs**.

On Windows, after installing dependencies, you can alternatively double-click `start_expenses.bat` in the repository root. It starts both services and opens the browser. The launcher assumes the virtual environment is at `.venv/` in the project root.

### Try the 2026 demo

The repository includes these **committed, intentionally synthetic** example databases:

- `backend/samples/empty.db` — database schema, no transactions.
- `backend/samples/demo.db` — 339 fake transactions covering January–December 2026, with income, expenses, investments and reimbursable expenses.

On a **fresh checkout, before starting the backend**, you can copy the demo into the active database location. This command deliberately **refuses to overwrite** any existing local database:

```powershell
if (Test-Path backend\data\expenses.db) {
    throw "A local database already exists. Back it up; do not overwrite personal data."
}
Copy-Item backend\samples\demo.db backend\data\expenses.db
```

Then start the app normally. Choose months from 2026 in the dashboard or open **Insights** to view the annual charts. For a blank start, simply don't copy a sample: the app will initialize an empty database automatically. Alternatively, use `backend/samples/empty.db` in the same way.

**Never replace an existing personal database with a demo database.** For a demo on a machine already in use, use a separate clone or explicitly back up your local database outside the repository first.

To regenerate either sample (without touching your personal database):

```powershell
python backend\scripts\seed_demo.py --kind empty --force
python backend\scripts\seed_demo.py --kind demo --force
```

The generator is deterministic and only writes inside `backend/samples/`.

## Project structure

```text
expenses-dashboard/
├── backend/
│   ├── app/                 # API, models, schemas, database connection
│   ├── data/                # Private, ignored local expenses.db
│   ├── samples/             # Published empty.db and synthetic demo.db
│   ├── scripts/             # Demo generator and historical Excel importer
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Monthly dashboard and /insights route
│   ├── components/          # Forms, cards, tables and Recharts charts
│   ├── lib/                 # API client, money formatting, categories
│   └── types/               # TypeScript API types
├── start_expenses.bat       # Optional Windows launcher
├── .gitignore
└── README.md
```

## Transaction categories and the Excel importer

Categories and their display colors are configured in `frontend/lib/categories.ts`. Only ordinary expenses appear in the spending pie; investments and reimbursable costs remain accessible as transactions and are treated separately.

The optional importer is **specific to the author's previous Excel layout** (monthly sheets, color-coded transaction cells, a legend on every sheet, and historical income cells). It is not a general-purpose Excel/CSV importer. Review the category mapping in `backend/scripts/import_history.py` before use.

```powershell
# Preview only: does not write to SQLite
python backend\scripts\import_history.py "path\to\Expenses.xlsx"

# Import after reviewing the preview and backing up your local DB
python backend\scripts\import_history.py "path\to\Expenses.xlsx" --commit
```

## Data privacy and publishing

- The active database **must remain** at `backend/data/expenses.db` (ignored by Git).
- `backend/samples/empty.db` and `backend/samples/demo.db` are the only intentionally tracked `.db` files.
- Real spreadsheets, local `.env` files, virtual environments and build outputs are ignored too.
- Before publishing, run `git status` and `git ls-files` to review exactly what will be committed. **`.gitignore` does not untrack files committed previously**, and it does not erase sensitive data from Git history.
- This is a **local development application, without authentication**. Do not expose either service to the public internet or deploy with real personal data without adding appropriate security controls.

## Possible next steps

- Time-range comparisons and deeper category trends.
- Dedicated investment and reimbursable-expense analysis.
- Transaction filtering and search.
- General-purpose CSV/Excel import and export.
- Authentication and a secure multi-user/deployment mode (not currently supported).

## License

No open-source license has been selected yet. Add a `LICENSE` file if you want to allow others to reuse or redistribute the code under defined terms.
