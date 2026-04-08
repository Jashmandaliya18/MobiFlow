/**
 * Report Writer (SRS §3.1.3, §3.1.5, §3.1.8 — PDF/CSV exports)
 *
 * Small, dependency-light helpers that take a row definition and either
 * stream CSV text or a PDF document back through an Express `res`. Every
 * report in the system passes through here so formatting stays consistent.
 *
 * Usage:
 *   writeCsv(res, {
 *     filename: 'inventory-2026-04-08.csv',
 *     columns: [
 *       { header: 'Item', accessor: (r) => r.item_name },
 *       { header: 'Qty',  accessor: (r) => r.quantity },
 *     ],
 *     rows: items,
 *   });
 *
 *   writePdf(res, {
 *     filename: 'inventory-2026-04-08.pdf',
 *     title: 'Inventory Report',
 *     subtitle: 'Generated 2026-04-08 14:02',
 *     summary: [ ['Total items', 42], ['Low stock', 3] ],
 *     columns: [...],
 *     rows: items,
 *   });
 */

const PDFDocument = require('pdfkit');

/** Escape one CSV field per RFC 4180. */
const csvField = (value) => {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : String(value);
  // Quote if the value contains a comma, quote, newline, or leading/trailing space.
  if (/[",\n\r]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

/**
 * Stream a CSV file to the client.
 */
function writeCsv(res, { filename, columns, rows }) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Header row
  res.write(columns.map((c) => csvField(c.header)).join(',') + '\r\n');

  for (const row of rows) {
    const line = columns.map((c) => csvField(c.accessor(row))).join(',');
    res.write(line + '\r\n');
  }

  res.end();
}

/**
 * Stream a PDF file to the client. Uses pdfkit; small tables render natively,
 * long tables paginate automatically.
 */
function writePdf(res, { filename, title, subtitle, summary = [], columns, rows }) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);

  // --- Title block ---
  doc.fillColor('#111111').font('Helvetica-Bold').fontSize(18).text(title, { align: 'left' });
  if (subtitle) {
    doc.moveDown(0.2);
    doc.fillColor('#555555').font('Helvetica').fontSize(9).text(subtitle);
  }
  doc.moveDown(0.8);

  // --- Summary block (two-column key/value list) ---
  if (summary.length) {
    doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text('Summary');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10).fillColor('#222222');
    for (const [label, value] of summary) {
      doc.text(`${label}: `, { continued: true })
         .font('Helvetica-Bold').text(String(value))
         .font('Helvetica');
    }
    doc.moveDown(0.8);
  }

  // --- Table ---
  doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text('Details');
  doc.moveDown(0.4);

  const tableTop = doc.y;
  const pageLeft = doc.page.margins.left;
  const pageRight = doc.page.width - doc.page.margins.right;
  const tableWidth = pageRight - pageLeft;
  const colCount = columns.length;
  // Equal-width columns keep the layout predictable without dependency on data.
  const colWidth = tableWidth / colCount;
  const rowHeight = 18;

  const drawHeaderRow = (y) => {
    doc.rect(pageLeft, y, tableWidth, rowHeight).fill('#1e1b4b');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    columns.forEach((c, i) => {
      doc.text(String(c.header), pageLeft + i * colWidth + 6, y + 5, {
        width: colWidth - 12,
        ellipsis: true,
        lineBreak: false,
      });
    });
    doc.fillColor('#111111').font('Helvetica').fontSize(9);
  };

  drawHeaderRow(tableTop);
  let y = tableTop + rowHeight;

  const pageBottom = doc.page.height - doc.page.margins.bottom - rowHeight;

  rows.forEach((row, idx) => {
    if (y > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeaderRow(y);
      y += rowHeight;
    }

    // Zebra striping for readability.
    if (idx % 2 === 0) {
      doc.rect(pageLeft, y, tableWidth, rowHeight).fill('#f4f4fb').fillColor('#111111');
    }

    columns.forEach((c, i) => {
      const raw = c.accessor(row);
      const value = raw === null || raw === undefined ? '' : String(raw);
      doc.fillColor('#111111').font('Helvetica').fontSize(9).text(
        value,
        pageLeft + i * colWidth + 6,
        y + 5,
        { width: colWidth - 12, ellipsis: true, lineBreak: false }
      );
    });

    y += rowHeight;
  });

  // --- Footer ---
  doc.fontSize(8).fillColor('#888888').text(
    `MobiFlow • ${rows.length} record${rows.length === 1 ? '' : 's'} • Generated ${new Date().toISOString()}`,
    pageLeft,
    doc.page.height - doc.page.margins.bottom - 12,
    { width: tableWidth, align: 'center' }
  );

  doc.end();
}

/** Timestamp suffix for filenames, e.g. `2026-04-08_14-02-31`. */
const tsSuffix = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

module.exports = { writeCsv, writePdf, tsSuffix };
