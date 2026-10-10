const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generates an invoice PDF for a completed order and returns the file path.
function generateInvoice({ order, user, product, symbol }) {
  const fileName = `invoice-${order.id}.pdf`;
  const filePath = path.join(__dirname, 'invoices', fileName);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text('Made By Shaswat', { align: 'left' });
  doc.fontSize(10).fillColor('#555').text('AI Creative Studio', { align: 'left' });
  doc.moveDown(2);

  doc.fillColor('#000').fontSize(16).text(`Invoice #${order.id}`);
  doc.fontSize(10).fillColor('#555').text(`Date: ${order.completed_at || order.created_at}`);
  doc.moveDown(1);

  doc.fillColor('#000').fontSize(12).text('Billed to:');
  doc.fontSize(11).fillColor('#333').text(user.name);
  doc.text(user.email);
  doc.text(user.country || '');
  doc.moveDown(1);

  doc.fillColor('#000').fontSize(12).text('Item:');
  doc.fontSize(11).fillColor('#333').text(product.title);
  doc.text(product.description || '');
  doc.moveDown(1);

  doc.fillColor('#000').fontSize(12).text(
    `Amount: ${symbol}${order.amount_local.toFixed(2)} ${order.currency}  (= $${order.amount_usd.toFixed(2)} USD)`
  );
  doc.moveDown(2);

  doc.fontSize(10).fillColor('#888').text('Thank you for buying from Made By Shaswat.', { align: 'left' });

  doc.end();
  return `/invoices/${fileName}`;
}

module.exports = { generateInvoice };
