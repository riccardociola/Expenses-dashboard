"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteTransaction,
  updateTransaction,
} from "@/lib/api";

import {
  CATEGORIES,
  EXPENSE_CATEGORIES,
  getCategoryTagStyle,
} from "@/lib/categories";

import { formatAmount } from "@/lib/format";
import type { Transaction, TransactionType } from "@/types/transaction";


type TransactionTableProps = {
  transactions: Transaction[];
};


function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(`${date}T00:00:00Z`),
  );
}


export default function TransactionTable({
  transactions,
}: TransactionTableProps) {
  const router = useRouter();


  const [
    editingTransaction,
    setEditingTransaction,
  ] = useState<Transaction | null>(
    null,
  );


  const [amount, setAmount] =
    useState("");

  const [date, setDate] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    transactionType,
    setTransactionType,
  ] = useState<TransactionType>("expense");


  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<number | null>(
    null,
  );

  const [error, setError] =
    useState<string | null>(null);


  /*
   * Categories displayed in the Edit form.
   *
   * These now come from lib/categories.ts.
   */
  const categories = CATEGORIES.filter(
    (category) => category.kind === transactionType,
  );


  function startEditing(
    transaction: Transaction,
  ) {
    setEditingTransaction(
      transaction,
    );

    setDate(transaction.date);

    setAmount(
      String(transaction.amount),
    );

    setTransactionType(
      transaction.transaction_type,
    );

    setCategory(
      transaction.category,
    );

    setDescription(
      transaction.description ??
        "",
    );

    setError(null);
  }


  function cancelEditing() {
    setEditingTransaction(null);
    setError(null);
  }


  function handleTypeChange(
    type: TransactionType,
  ) {
    setTransactionType(type);

    const newCategories = CATEGORIES.filter(
      (category) => category.kind === type,
    );

    setCategory(
      newCategories[0]?.name ?? "",
    );
  }


  async function handleEditSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingTransaction) {
      return;
    }


    const numericAmount =
      Number(amount);


    if (
      !Number.isFinite(
        numericAmount,
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid amount.",
      );

      return;
    }


    if (!category) {
      setError(
        "Please select a category.",
      );

      return;
    }


    try {
      setIsSaving(true);
      setError(null);


      await updateTransaction(
        editingTransaction.id,
        {
          date,
          amount: numericAmount,
          transaction_type:
            transactionType,
          category,
          description:
            description.trim() === ""
              ? null
              : description.trim(),
        },
      );


      setEditingTransaction(
        null,
      );

      router.refresh();

    } catch {
      setError(
        "Unable to update transaction.",
      );

    } finally {
      setIsSaving(false);
    }
  }


  async function handleDelete(
    transaction: Transaction,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${
          transaction.description ??
          transaction.category
        }"?`,
      );


    if (!confirmed) {
      return;
    }


    try {
      setDeletingId(
        transaction.id,
      );

      setError(null);


      await deleteTransaction(
        transaction.id,
      );


      router.refresh();

    } catch {
      setError(
        "Unable to delete transaction.",
      );

    } finally {
      setDeletingId(null);
    }
  }


  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">

        <p className="text-gray-500">
          No transactions yet.
        </p>

      </div>
    );
  }


  return (
    <div className="space-y-4">

      {/* Edit form */}

      {editingTransaction && (

        <div className="rounded-xl border border-gray-200 bg-white p-6">

          <div className="mb-5">

            <h2 className="text-lg font-semibold text-gray-900">
              Edit transaction
            </h2>

            <p className="text-sm text-gray-500">
              Update transaction #
              {editingTransaction.id}
            </p>

          </div>


          <form
            onSubmit={
              handleEditSubmit
            }
            className="grid gap-5 md:grid-cols-2"
          >

            {/* Type */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Type
              </label>

              <select
                value={
                  transactionType
                }
                onChange={(event) =>
                  handleTypeChange(
                    event.target
                      .value as
                      TransactionType,
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-gray-900
                "
              >

                <option value="expense">
                  Expense
                </option>

                <option value="income">
                  Income
                </option>

                <option value="investment">
                  Investment
                </option>

                <option value="reimbursable">
                  Reimbursable expense
                </option>

              </select>

            </div>


            {/* Amount */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Amount
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value,
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  px-3
                  py-2.5
                  text-gray-900
                "
              />

            </div>


            {/* Category */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value,
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-gray-900
                "
              >

                {categories.map(
                  (
                    categoryDefinition,
                  ) => (

                    <option
                      key={
                        categoryDefinition.name
                      }
                      value={
                        categoryDefinition.name
                      }
                    >
                      {
                        categoryDefinition.name
                      }
                    </option>

                  ),
                )}

              </select>

            </div>


            {/* Date */}

            <div>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date
              </label>

              <input
                type="date"
                required
                value={date}
                onChange={(event) =>
                  setDate(
                    event.target.value,
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  px-3
                  py-2.5
                  text-gray-900
                "
              />

            </div>


            {/* Description */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  px-3
                  py-2.5
                  text-gray-900
                "
              />

            </div>


            {error && (

              <p className="text-sm text-red-600 md:col-span-2">
                {error}
              </p>

            )}


            {/* Buttons */}

            <div className="flex justify-end gap-3 md:col-span-2">

              <button
                type="button"
                onClick={
                  cancelEditing
                }
                className="
                  rounded-lg
                  border
                  border-gray-300
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  hover:bg-gray-50
                "
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={isSaving}
                className="
                  rounded-lg
                  bg-gray-900
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  hover:bg-gray-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {isSaving
                  ? "Saving..."
                  : "Save changes"}
              </button>

            </div>

          </form>

        </div>

      )}


      {error &&
        !editingTransaction && (

          <p className="text-sm text-red-600">
            {error}
          </p>

        )}


      {/* Transactions table */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

        <div className="border-b border-gray-200 px-6 py-4">

          <h2 className="text-lg font-semibold text-gray-900">
            Transactions
          </h2>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="bg-gray-50 text-gray-500">

              <tr>

                <th className="px-6 py-3 font-medium">
                  Date
                </th>

                <th className="px-6 py-3 font-medium">
                  Description
                </th>

                <th className="px-6 py-3 font-medium">
                  Category
                </th>

                <th className="px-6 py-3 text-right font-medium">
                  Amount
                </th>

                <th className="px-6 py-3 text-right font-medium">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {transactions.map(
                (transaction) => {

                  const categoryStyle =
                    getCategoryTagStyle(
                      transaction.category,
                    );


                  return (

                    <tr
                      key={
                        transaction.id
                      }
                      className="hover:bg-gray-50"
                    >

                      {/* Date */}

                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">

                        {formatDate(
                          transaction.date,
                        )}

                      </td>


                      {/* Description */}

                      <td className="px-6 py-4 font-medium text-gray-900">

                        {
                          transaction.description ??
                          "—"
                        }

                      </td>


                      {/* Category */}

                      <td className="px-6 py-4">

                        <span
                          style={
                            categoryStyle
                          }
                          className="
                            inline-flex
                            rounded-full
                            border
                            px-3
                            py-1
                            text-xs
                            font-semibold
                          "
                        >
                          {
                            transaction.category
                          }
                        </span>

                      </td>


                      {/* Amount */}

                      <td
                        className={`whitespace-nowrap px-6 py-4 text-right font-semibold ${
                          transaction.transaction_type ===
                          "income"
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >

                        {formatAmount(
                          transaction.amount,
                          transaction.transaction_type ===
                            "income"
                            ? "+"
                            : "-",
                        )}

                      </td>


                      {/* Actions */}

                      <td className="whitespace-nowrap px-6 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            startEditing(
                              transaction,
                            )
                          }
                          className="
                            mr-4
                            text-sm
                            font-medium
                            text-gray-600
                            hover:text-gray-900
                          "
                        >
                          Edit
                        </button>


                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            transaction.id
                          }
                          onClick={() =>
                            handleDelete(
                              transaction,
                            )
                          }
                          className="
                            text-sm
                            font-medium
                            text-red-600
                            hover:text-red-800
                            disabled:opacity-50
                          "
                        >
                          {deletingId ===
                          transaction.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>

                      </td>

                    </tr>

                  );
                },
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}