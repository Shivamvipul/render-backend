const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generates a simple ticket PDF with embedded QR code image (data URL) and returns the file path
const generateTicketPDF = async ({ ticketId, eventTitle, userName, tierName, venue, startDate, qrCodeDataUrl }) => {
  const fileName = `ticket-${ticketId}.pdf`;
  const filePath = path.join(__dirname, '..', 'uploads', fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('Event Ticket', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(eventTitle, { align: 'center' });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Ticket ID: ${ticketId}`);
    doc.text(`Attendee: ${userName}`);
    doc.text(`Tier: ${tierName}`);
    doc.text(`Venue: ${venue}`);
    doc.text(`Date: ${new Date(startDate).toLocaleString()}`);
    doc.moveDown();

    if (qrCodeDataUrl) {
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      doc.image(imgBuffer, { fit: [180, 180], align: 'center' });
    }

    doc.end();
    stream.on('finish', () => resolve(`/uploads/${fileName}`));
    stream.on('error', reject);
  });
};

// Generates a generic tabular report as PDF (used by reportService)
const generateTableReportPDF = async ({ title, columns, rows, fileName }) => {
  const filePath = path.join(__dirname, '..', 'uploads', fileName);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();

    const colWidth = 500 / columns.length;
    doc.fontSize(10).font('Helvetica-Bold');
    columns.forEach((col, i) => doc.text(col, 30 + i * colWidth, doc.y, { width: colWidth, continued: i < columns.length - 1 }));
    doc.moveDown(0.5);
    doc.font('Helvetica');

    rows.forEach((row) => {
      const y = doc.y;
      row.forEach((cell, i) => doc.text(String(cell), 30 + i * colWidth, y, { width: colWidth, continued: i < row.length - 1 }));
      doc.moveDown(0.5);
    });

    doc.end();
    stream.on('finish', () => resolve(`/uploads/${fileName}`));
    stream.on('error', reject);
  });
};

module.exports = { generateTicketPDF, generateTableReportPDF };
