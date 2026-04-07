import * as XLSX from "xlsx";

export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1"
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportTableToExcel(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  sheetName = "Sheet1"
) {
  const data = rows.map((row) => {
    const obj: Record<string, string | number> = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
  exportToExcel(data, filename, sheetName);
}
