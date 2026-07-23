const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
const path = require('path');
const fs = require('fs');
const { generateTableReportPDF } = require('./pdfService');

const generateExcelReport = async ({ title, columns, rows, fileName }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 30));
  sheet.addRow(columns).font = { bold: true };
  rows.forEach((r) => sheet.addRow(r));
  sheet.columns.forEach((col) => (col.width = 22));

  const filePath = path.join(__dirname, '..', 'uploads', fileName);
  await workbook.xlsx.writeFile(filePath);
  return `/uploads/${fileName}`;
};

const generateCSVReport = async ({ columns, rows, fileName }) => {
  const parser = new Parser({ fields: columns });
  const objRows = rows.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
  const csv = parser.parse(objRows);
  const filePath = path.join(__dirname, '..', 'uploads', fileName);
  fs.writeFileSync(filePath, csv);
  return `/uploads/${fileName}`;
};

// Unified entry point used by reportController
const generateReport = async ({ type, format, columns, rows, title }) => {
  const timestamp = Date.now();
  const fileName = `${type}-report-${timestamp}.${format === 'excel' ? 'xlsx' : format}`;

  if (format === 'pdf') return generateTableReportPDF({ title, columns, rows, fileName });
  if (format === 'excel') return generateExcelReport({ title, columns, rows, fileName });
  if (format === 'csv') return generateCSVReport({ columns, rows, fileName });
  throw new Error('Unsupported report format');
};

module.exports = { generateReport };
