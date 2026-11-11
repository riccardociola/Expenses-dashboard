export function formatAmount(
  amount: number,
  sign?: "+" | "-",
) {
  const formatted = new Intl.NumberFormat("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (sign) {
    return `${sign}${formatted} €`;
  }

  return `${formatted} €`;
}