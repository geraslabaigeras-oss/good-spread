// Generates fictional demo documents into public/demo-docs/. Run: pnpm demo-docs
import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFPage } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'demo-docs');
const INK = rgb(0.08, 0.08, 0.07);
const GREY = rgb(0.45, 0.45, 0.42);
const LINE = rgb(0.85, 0.84, 0.8);

type Ctx = { page: PDFPage; font: PDFFont; bold: PDFFont; y: number };

async function doc(build: (c: Ctx) => void, file: string) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(file.replace('.pdf', ''));
  pdf.setAuthor('DEMO — fictional document');
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const c: Ctx = { page, font, bold, y: 780 };
  build(c);
  // Visible watermark
  page.drawText('DEMO — fictional document', { x: 70, y: 260, size: 46, font: bold, color: rgb(0.85, 0.2, 0.15), opacity: 0.18, rotate: degrees(35) });
  page.drawText('DEMO — fictional document. Not a real booking, company or person.', { x: 50, y: 30, size: 9, font, color: rgb(0.75, 0.2, 0.15) });
  fs.writeFileSync(path.join(OUT, file), await pdf.save());
  console.log('wrote', file);
}

function title(c: Ctx, t: string, sub: string) {
  c.page.drawText(t, { x: 50, y: c.y, size: 22, font: c.bold, color: INK });
  c.y -= 20;
  c.page.drawText(sub, { x: 50, y: c.y, size: 11, font: c.font, color: GREY });
  c.y -= 18;
  c.page.drawLine({ start: { x: 50, y: c.y }, end: { x: 545, y: c.y }, thickness: 0.7, color: LINE });
  c.y -= 30;
}

function row(c: Ctx, k: string, v: string, big = false) {
  c.page.drawText(k, { x: 50, y: c.y, size: 10, font: c.font, color: GREY });
  c.page.drawText(v, { x: 210, y: c.y, size: big ? 16 : 12, font: big ? c.bold : c.font, color: INK });
  c.y -= big ? 28 : 22;
}

function para(c: Ctx, t: string) {
  c.y -= 6;
  c.page.drawText(t, { x: 50, y: c.y, size: 10, font: c.font, color: GREY, maxWidth: 495, lineHeight: 14 });
  c.y -= 30;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  await doc((c) => {
    title(c, 'Demo Air — Booking change', 'Schedule change notice · Booking ref DMO7Q2 · DEMO');
    row(c, 'Passenger', 'IEVA DEMO');
    row(c, 'Flight', 'DA 645', true);
    row(c, 'Route', 'MXP Milan Malpensa -> VNO Vilnius');
    row(c, 'Date', '21 Nov 2026');
    row(c, 'Departs', '07:55 (local time)');
    row(c, 'Arrives', '10:45 (local time)', true);
    c.y -= 6;
    row(c, 'Previous flight', 'DA 641 · departs 04:55 · arrives 07:40 (cancelled)');
    para(c, 'Your original flight DA 641 has been cancelled. You have been rebooked on DA 645 at no extra cost. Please arrive at the airport 2 hours before departure. All times are local.');
  }, 'flight_DA645_change.pdf');

  await doc((c) => {
    title(c, 'Milan agency (demo) — Booking confirmation', 'Talent booking · Ref MA-2026-1121 · DEMO');
    row(c, 'Talent', 'Ieva');
    row(c, 'Client', 'Vetra outerwear (demo brand)');
    row(c, 'Job', 'Jacket campaign (demo), Vilnius');
    row(c, 'Date', '21 Nov 2026');
    row(c, 'Day rate', 'EUR 600 (1 day, up to 15:00)', true);
    row(c, 'Overtime', 'EUR 75 per hour, billed in 15 min');
    row(c, 'Usage', 'Web + social, 12 months');
    row(c, 'Agency commission', '20% (charged to client)');
    para(c, 'Travel MXP-VNO and transfer to studio arranged by the production. Please confirm call time 24 h in advance.');
  }, 'agency_confirmation_ieva.pdf');

  await doc((c) => {
    title(c, 'Demo studio, Vilnius — Quote', 'Studio hire quote · Q-1121 · DEMO');
    row(c, 'Date', '21 Nov 2026');
    row(c, 'Hours', '7 hours, 08:00–15:00', true);
    row(c, 'Rate', 'EUR 60 per hour');
    row(c, 'Total', 'EUR 420', true);
    row(c, 'Overtime', 'EUR 60 per hour after 15:00');
    row(c, 'Studio opens / closes', '07:00 / 18:00');
    para(c, 'Includes cyclorama, basic lighting kit, hair and makeup station. Address: Demo address, Vilnius.');
  }, 'studio_quote.pdf');
}

main();
