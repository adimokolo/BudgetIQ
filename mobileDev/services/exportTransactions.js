import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/*
|--------------------------------------------------------------------------
| ESCAPE CSV CELL
|--------------------------------------------------------------------------
*/

function escapeCell(cell) {
  const str = String(cell ?? "");

  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/*
|--------------------------------------------------------------------------
| EXPORT CSV
|--------------------------------------------------------------------------
*/

export async function exportTransactionsToCsv(transactions, currency = "NGN") {
  if (!transactions || transactions.length === 0) {
    throw new Error("There are no transactions to export.");
  }

  const header = [
    "Date",
    "Type",
    "Category",
    "Description",
    `Amount (${currency})`,
  ];

  const rows = transactions.map((t) => [
    formatDate(t.occurred_on),
    t.type,
    t.category_name || "Uncategorized",
    t.description || "",
    Number(t.amount || 0).toFixed(2),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\n");

  const today = new Date().toISOString().slice(0, 10);

  const fileUri =
    FileSystem.cacheDirectory + `budgetiq-transactions-${today}.csv`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const sharingAvailable = await Sharing.isAvailableAsync();

  if (!sharingAvailable) {
    throw new Error("File sharing is not available on this device.");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "text/csv",
    dialogTitle: "Export BudgetIQ Transactions",
    UTI: "public.comma-separated-values-text",
  });
}

/*
|--------------------------------------------------------------------------
| EXPORT PDF
|--------------------------------------------------------------------------
*/

export async function exportTransactionsToPdf(transactions, currency = "NGN") {
  if (!transactions || transactions.length === 0) {
    throw new Error("There are no transactions to export.");
  }

  const today = new Date().toISOString().slice(0, 10);

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const net = income - expense;

  /*
  |--------------------------------------------------------------------------
  | TABLE
  |--------------------------------------------------------------------------
  */

  const tableRows = transactions
    .map((t) => {
      const isIncome = t.type === "income";

      return `
        <tr>

          <td>
            ${formatDate(t.occurred_on)}
          </td>

          <td>
            ${isIncome ? "Income" : "Expense"}
          </td>

          <td>
            ${t.category_name || "Uncategorized"}
          </td>

          <td>
            ${t.description || "—"}
          </td>

          <td
            class="amount ${isIncome ? "income" : "expense"}"
          >
            ${isIncome ? "+" : "-"}${Number(t.amount || 0).toFixed(2)}
          </td>

        </tr>
      `;
    })
    .join("");

  /*
  |--------------------------------------------------------------------------
  | PDF HTML
  |--------------------------------------------------------------------------
  */

  const html = `
    <!DOCTYPE html>

    <html>

      <head>

        <meta charset="UTF-8" />

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 32px;
            color: #1E293B;
            background: #FFFFFF;
          }

          .title {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 6px;
          }

          .date {
            font-size: 11px;
            color: #787878;
            margin-bottom: 18px;
          }

          .summary {
            font-size: 13px;
            font-weight: 600;
            color: #1E293B;
            margin-bottom: 16px;
          }

          .income-summary {
            color: #16A34A;
          }

          .expense-summary {
            color: #EC4899;
          }

          .net-summary {
            color: #1E293B;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 10px;
          }

          thead {
            background-color: #0F71B4;
            color: #FFFFFF;
          }

          th {
            padding: 9px 7px;
            text-align: left;
            font-weight: 700;
          }

          td {
            padding: 8px 7px;
            border-bottom: 1px solid #E5E7EB;
            vertical-align: middle;
          }

          tr:nth-child(even) {
            background-color: #F8FAFC;
          }

          .amount {
            text-align: right;
            font-weight: 700;
          }

          .income {
            color: #16A34A;
          }

          .expense {
            color: #EC4899;
          }

          .footer {
            margin-top: 24px;
            font-size: 9px;
            color: #94A3B8;
            text-align: center;
          }

        </style>

      </head>

      <body>

        <div class="title">
          BudgetIQ - Transactions
        </div>

        <div class="date">
          Exported ${today}
        </div>

        <div class="summary">

          Income:

          <span class="income-summary">
            ${currency} ${income.toFixed(2)}
          </span>

          &nbsp;&nbsp;

          Expense:

          <span class="expense-summary">
            ${currency} ${expense.toFixed(2)}
          </span>

          &nbsp;&nbsp;

          Net:

          <span class="net-summary">
            ${currency} ${net.toFixed(2)}
          </span>

        </div>

        <table>

          <thead>

            <tr>

              <th>Date</th>

              <th>Type</th>

              <th>Category</th>

              <th>Description</th>

              <th style="text-align:right;">
                Amount (${currency})
              </th>

            </tr>

          </thead>

          <tbody>

            ${tableRows}

          </tbody>

        </table>

        <div class="footer">
          BudgetIQ — Spend with insight, not guesswork.
        </div>

      </body>

    </html>
  `;

  /*
  |--------------------------------------------------------------------------
  | CREATE PDF
  |--------------------------------------------------------------------------
  */

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  /*
  |--------------------------------------------------------------------------
  | SHARE PDF
  |--------------------------------------------------------------------------
  */

  const sharingAvailable = await Sharing.isAvailableAsync();

  if (!sharingAvailable) {
    throw new Error("File sharing is not available on this device.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Export BudgetIQ Transactions",
    UTI: "com.adobe.pdf",
  });
}
