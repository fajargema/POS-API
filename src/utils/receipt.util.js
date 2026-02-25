const PDFDocument = require('pdfkit');

/**
 * Generates a receipt PDF buffer for an order.
 * @param {Object} order - The order object with items, cashier, etc.
 * @param {Object} storeSettings - Store settings (name, address, phone, footer).
 * @returns {Promise<Buffer>} The PDF as a buffer.
 */
const generateReceiptPDF = (order, storeSettings) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: [226.77, 600], // ~80mm width (thermal receipt), auto height
                margins: { top: 20, bottom: 20, left: 15, right: 15 }
            });

            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = 226.77 - 30; // width minus margins
            const receiptNo = `RCP-${String(order.receiptNumber).padStart(5, '0')}`;
            const dateStr = new Date(order.createdAt).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: false
            });

            // ──── HEADER ────
            doc.fontSize(14).font('Helvetica-Bold')
                .text(storeSettings.name, { align: 'center' });

            if (storeSettings.address) {
                doc.fontSize(7).font('Helvetica')
                    .text(storeSettings.address, { align: 'center' });
            }
            if (storeSettings.phone) {
                doc.fontSize(7).font('Helvetica')
                    .text(storeSettings.phone, { align: 'center' });
            }

            doc.moveDown(0.5);
            drawDashedLine(doc, pageWidth);
            doc.moveDown(0.3);

            // ──── RECEIPT INFO ────
            doc.fontSize(8).font('Helvetica');
            doc.text(`Receipt:  ${receiptNo}`);
            doc.text(`Date:     ${dateStr}`);
            doc.text(`Cashier:  ${order.cashier?.name || 'N/A'}`);
            doc.text(`Status:   ${order.status}`);

            doc.moveDown(0.3);
            drawDashedLine(doc, pageWidth);
            doc.moveDown(0.3);

            // ──── ITEMS TABLE ────
            doc.fontSize(8).font('Helvetica-Bold');
            const colItem = 15;
            const colQty = 120;
            const colTotal = 160;

            doc.text('Item', colItem, doc.y, { continued: false });
            const headerY = doc.y - doc.currentLineHeight();
            doc.text('Qty', colQty, headerY);
            doc.text('Total', colTotal, headerY);

            doc.moveDown(0.2);
            doc.font('Helvetica').fontSize(7);

            let subtotal = 0;
            for (const item of order.items) {
                const productName = item.product?.name || 'Unknown';
                const lineTotal = item.price * item.quantity;
                subtotal += lineTotal;

                // Product name (may wrap)
                const y = doc.y;
                doc.text(truncate(productName, 18), colItem, y);
                doc.text(`${item.quantity} x ${formatCurrency(item.price)}`, colQty, y);
                doc.text(formatCurrency(lineTotal), colTotal, y);
                doc.moveDown(0.1);
            }

            doc.moveDown(0.3);
            drawDashedLine(doc, pageWidth);
            doc.moveDown(0.3);

            // ──── TOTALS ────
            doc.fontSize(8).font('Helvetica');
            const labelX = 15;
            const valueX = 140;

            doc.text('Subtotal:', labelX, doc.y);
            doc.text(formatCurrency(subtotal), valueX, doc.y - doc.currentLineHeight(), { align: 'right', width: pageWidth - valueX + 15 });

            if (order.discountAmount > 0) {
                const discountLabel = order.discountCode
                    ? `Discount (${order.discountCode}):`
                    : 'Discount:';
                doc.text(discountLabel, labelX, doc.y);
                doc.text(`-${formatCurrency(order.discountAmount)}`, valueX, doc.y - doc.currentLineHeight(), { align: 'right', width: pageWidth - valueX + 15 });
            }

            doc.moveDown(0.2);
            drawDashedLine(doc, pageWidth);
            doc.moveDown(0.2);

            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('TOTAL:', labelX, doc.y);
            doc.text(formatCurrency(order.totalAmount), valueX, doc.y - doc.currentLineHeight(), { align: 'right', width: pageWidth - valueX + 15 });

            doc.moveDown(0.5);
            drawDashedLine(doc, pageWidth);
            doc.moveDown(0.5);

            // ──── FOOTER ────
            doc.fontSize(8).font('Helvetica')
                .text(storeSettings.footer, { align: 'center' });

            doc.moveDown(0.3);
            doc.fontSize(6).font('Helvetica')
                .text(`Order ID: ${order.id}`, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

// ── Helper functions ──

function drawDashedLine(doc, width) {
    const y = doc.y;
    const x = 15;
    doc.save()
        .moveTo(x, y)
        .lineTo(x + width, y)
        .dash(3, { space: 2 })
        .stroke('#999999')
        .undash()
        .restore();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function truncate(str, maxLen) {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 1) + '…';
}

module.exports = { generateReceiptPDF };
