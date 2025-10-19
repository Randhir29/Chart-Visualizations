import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Exports multiple dashboard datasets into a single Excel file with multiple sheets.
 * @param {Object} sheets - Object with sheet names as keys and data arrays as values.
 * @param {string} filename - Base filename (without extension).
 * @param {Object} options - Optional config: { includeTimestamp: boolean, columnMap: { [sheetName]: { oldKey: newKey } } }
 */
export const exportDashboardToExcel = (sheets, filename = 'DashboardExport', options = {}) => {
  if (!sheets || typeof sheets !== 'object') return;

  const { includeTimestamp = true, columnMap = {} } = options;
  const workbook = XLSX.utils.book_new();

  Object.entries(sheets).forEach(([sheetName, data]) => {
    if (!Array.isArray(data) || data.length === 0) return;

    // Optional column renaming
    const mappedData = columnMap[sheetName]
      ? data.map(row => {
          const mappedRow = {};
          Object.entries(columnMap[sheetName]).forEach(([oldKey, newKey]) => {
            mappedRow[newKey] = row[oldKey];
          });
          return mappedRow;
        })
      : data;

    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const timestamp = includeTimestamp ? `_${new Date().toISOString().slice(0, 10)}` : '';
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `${filename}${timestamp}.xlsx`);
};
