export type CategoryKind =
  | "expense"
  | "income"
  | "investment"
  | "reimbursable"
  | "derived";


export type CategoryDefinition = {
  name: string;
  kind: CategoryKind;
  color: string;
};


/*
 * Central definition of all transaction categories.
 *
 * This file should be the single source of truth for:
 *
 * - category names
 * - category colors
 * - transaction category types
 * - dropdown options
 * - pie-chart colors
 * - transaction-table tags
 */
export const CATEGORIES: CategoryDefinition[] = [

  // -----------------------------
  // Normal expenses
  // -----------------------------

  {
    name: "Grocery",
    kind: "expense",
    color: "#4F81BD",
  },

  {
    name: "Restaurant",
    kind: "expense",
    color: "#F28E2B",
  },

  {
    name: "Travel",
    kind: "expense",
    color: "#EDC948",
  },

  {
    name: "Car",
    kind: "expense",
    color: "#76B7B2",
  },

  {
    name: "Rent",
    kind: "expense",
    color: "#9C6ADE",
  },

  {
    name: "Subscriptions",
    kind: "expense",
    color: "#E88E8E",
  },

  {
    name: "Extra",
    kind: "expense",
    color: "#59A14F",
  },

  {
    name: "Psicologa",
    kind: "expense",
    color: "#D977AE",
  },


  // -----------------------------
  // Investments
  // -----------------------------

  {
    name: "Investimenti",
    kind: "investment",
    color: "#6366F1",
  },


  // -----------------------------
  // Reimbursable expenses
  // -----------------------------

  {
    name: "Refund cost",
    kind: "reimbursable",
    color: "#64748B",
  },


  // -----------------------------
  // Income
  // -----------------------------

  {
    name: "Salary",
    kind: "income",
    color: "#2E8B57",
  },

  {
    name: "Other Income",
    kind: "income",
    color: "#8CD17D",
  },


  // -----------------------------
  // Calculated / derived values
  // -----------------------------

  {
    name: "Savings",
    kind: "derived",
    color: "#6BAED6",
  },

];


/*
 * Category groups
 */

export const EXPENSE_CATEGORIES =
  CATEGORIES.filter(
    (category) =>
      category.kind === "expense",
  );


export const INCOME_CATEGORIES =
  CATEGORIES.filter(
    (category) =>
      category.kind === "income",
  );


export const INVESTMENT_CATEGORIES =
  CATEGORIES.filter(
    (category) =>
      category.kind === "investment",
  );


export const REIMBURSABLE_CATEGORIES =
  CATEGORIES.filter(
    (category) =>
      category.kind === "reimbursable",
  );


/*
 * Categories that correspond to transactions
 * entered by the user.
 *
 * "Savings" is excluded because it is calculated.
 */
export const TRANSACTION_CATEGORIES =
  CATEGORIES.filter(
    (category) =>
      category.kind !== "derived",
  );


/*
 * Return the configured color for a category.
 *
 * Unknown categories fall back to neutral gray.
 */
export function getCategoryColor(
  categoryName: string,
): string {
  return (
    CATEGORIES.find(
      (category) =>
        category.name === categoryName,
    )?.color ??
    "#6B7280"
  );
}


/*
 * Used by category badges in TransactionTable.
 *
 * The category color is used for the text,
 * with transparent versions for the
 * background and border.
 */
export function getCategoryTagStyle(
  categoryName: string,
) {
  const color =
    getCategoryColor(
      categoryName,
    );

  return {
    color,
    backgroundColor: `${color}1A`,
    borderColor: `${color}33`,
  };
}