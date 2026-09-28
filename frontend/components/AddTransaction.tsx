"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { addTransaction } from "@/lib/api";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/categories";


function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


export default function AddTransaction() {
  const router = useRouter();

  const [isOpen, setIsOpen] =
    useState(false);

  const [
    transactionType,
    setTransactionType,
  ] = useState<
    "expense" | "income"
  >("expense");

  const [amount, setAmount] =
    useState("");

  const [category, setCategory] =
    useState(
      EXPENSE_CATEGORIES[0]?.name ??
        "",
    );

  const [date, setDate] =
    useState(getToday());

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);


  const categories =
    transactionType === "expense"
      ? EXPENSE_CATEGORIES
      : INCOME_CATEGORIES;


  function handleTypeChange(
    type: "expense" | "income",
  ) {
    setTransactionType(type);

    const newCategories =
      type === "expense"
        ? EXPENSE_CATEGORIES
        : INCOME_CATEGORIES;

    setCategory(
      newCategories[0]?.name ?? "",
    );
  }


  function resetForm() {
    setTransactionType("expense");

    setCategory(
      EXPENSE_CATEGORIES[0]?.name ??
        "",
    );

    setAmount("");
    setDescription("");
    setDate(getToday());

    setError(null);
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

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
      setIsSubmitting(true);


      await addTransaction({
        date,
        amount: numericAmount,
        transaction_type:
          transactionType,
        category,
        description:
          description.trim() === ""
            ? null
            : description.trim(),
      });


      resetForm();

      setIsOpen(false);

      router.refresh();

    } catch {
      setError(
        "Unable to save the transaction.",
      );

    } finally {
      setIsSubmitting(false);
    }
  }


  function handleCancel() {
    resetForm();

    setIsOpen(false);
  }


  return (
    <div>

      <button
        type="button"
        onClick={() =>
          setIsOpen(
            (current) => !current,
          )
        }
        className="
          rounded-lg
          bg-gray-900
          px-4
          py-2.5
          text-sm
          font-medium
          text-white
          transition
          hover:bg-gray-700
        "
      >
        + Add transaction
      </button>


      {isOpen && (

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">

          <div className="mb-6">

            <h2 className="text-lg font-semibold text-gray-900">
              Add transaction
            </h2>

            <p className="text-sm text-gray-500">
              Add a new income or expense
            </p>

          </div>


          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-2"
          >

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
                      | "expense"
                      | "income",
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

              </select>

            </div>


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
                placeholder="0.00"
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
                placeholder="e.g. Supermarket"
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


            <div className="flex justify-end gap-3 md:col-span-2">

              <button
                type="button"
                onClick={
                  handleCancel
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
                  transition
                  hover:bg-gray-50
                "
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={
                  isSubmitting
                }
                className="
                  rounded-lg
                  bg-gray-900
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-gray-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {isSubmitting
                  ? "Saving..."
                  : "Add transaction"}
              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  );
}