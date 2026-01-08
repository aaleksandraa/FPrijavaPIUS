import jsPDF from 'jspdf';
import type { Student, Contract } from '../types';

// Brand color
const BRAND = { r: 217, g: 160, b: 120 };

// Helper functions
function dateOnly(d?: string): string {
  return (d ? new Date(d) : new Date()).toLocaleDateString('sr-RS');
}

interface PDFHelpers {
  pdf: jsPDF;
  pageW: number;
  pageH: number;
  margin: number;
  lineH: number;
  valueMaxW: number;
}

function createHelpers(pdf: jsPDF): PDFHelpers {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineH = 6.5;
  const valueMaxW = pageW - 2 * margin - 65;

  return { pdf, pageW, pageH, margin, lineH, valueMaxW };
}

function drawBox(h: PDFHelpers, y: number, height: number, fill = [248, 249, 250]) {
  h.pdf.setFillColor(fill[0], fill[1], fill[2]);
  h.pdf.rect(h.margin, y, h.pageW - 2 * h.margin, height, 'F');
}

function measureValue(h: PDFHelpers, val: string): number {
  const lines = h.pdf.splitTextToSize(val, h.valueMaxW);
  return lines.length * h.lineH + 2;
}

function drawKeyValue(h: PDFHelpers, label: string, value: string, y: number): number {
  h.pdf.setFont('helvetica', 'bold');
  h.pdf.text(label + ':', h.margin + 5, y);
  h.pdf.setFont('helvetica', 'normal');
  const lines = h.pdf.splitTextToSize(value, h.valueMaxW);
  h.pdf.text(lines, h.margin + 65, y);
  return y + (lines.length * h.lineH) + 2;
}

function drawSection(h: PDFHelpers, title: string, y: number): number {
  h.pdf.setFont('helvetica', 'bold');
  h.pdf.setFontSize(16);
  h.pdf.text(title, h.margin, y);
  h.pdf.setFontSize(11);
  return y + 10;
}

export async function generateStudentPDF(student: Student, contract?: Contract): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const h = createHelpers(pdf);

  // Header
  pdf.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  pdf.rect(0, 0, h.pageW, 38, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.text('PIUS ACADEMY', h.margin, 24);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.text('Detalji studenta i ugovor', h.margin, 32);

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  let y = 55;

  // Student Data Section
  y = drawSection(h, 'PODACI O STUDENTU', y);
  const studentPairs: [string, string][] = [
    ['Ime i prezime', `${student.first_name} ${student.last_name}`],
    ['Email', student.email],
    ['Telefon', student.phone],
    ['Adresa', `${student.address}, ${student.postal_code} ${student.city}, ${student.country}`],
    ['Broj ličnog dokumenta', student.id_document_number || 'N/A'],
    ['Paket', student.package_type === 'pius-plus' ? 'PIUS PLUS (1.800€)' : 'PIUS PRO (2.500€)'],
    ['Tip lica', student.entity_type === 'individual' ? 'Fizičko lice' : 'Pravno lice'],
    ['Način plaćanja', student.payment_method === 'full' ? 'Plaćanje u cjelosti' : 'Plaćanje na rate'],
    ['Status', student.status === 'enrolled' ? 'Upisan' : student.status === 'contract_signed' ? 'Ugovor potpisan' : 'Završen'],
    ['Datum registracije', dateOnly(student.enrolled_at)]
  ];

  let boxHeight = 8;
  studentPairs.forEach(([, v]) => { boxHeight += measureValue(h, v); });
  drawBox(h, y - 4, boxHeight + 8);

  let yy = y + 8;
  studentPairs.forEach(([k, v]) => { yy = drawKeyValue(h, k, v, yy); });
  y = yy + 10;

  // Company Data Section (if applicable)
  if (student.entity_type === 'company') {
    y = drawSection(h, 'PODACI O FIRMI', y);
    const companyPairs: [string, string][] = [
      ['Naziv firme', student.company_name || 'N/A'],
      ['PDV broj', student.vat_number || 'N/A'],
      ['Adresa firme', `${student.company_address || 'N/A'}, ${student.company_postal_code || ''} ${student.company_city || ''}, ${student.company_country || ''}`.trim()],
      ['Registracijski broj', student.company_registration || 'N/A'],
    ];

    let compH = 8;
    companyPairs.forEach(([, v]) => { compH += measureValue(h, v); });
    drawBox(h, y - 4, compH + 8);

    yy = y + 8;
    companyPairs.forEach(([k, v]) => { yy = drawKeyValue(h, k, v, yy); });
    y = yy + 10;
  }

  // Payment Plan Section (if installments)
  if (student.payment_method === 'installments') {
    y = drawSection(h, 'PLAN PLAĆANJA', y);
    const isPlus = student.package_type === 'pius-plus';
    const planPairs: [string, string][] = isPlus
      ? [
          ['Prva rata', '400€ (uplata u roku od 24h od datuma potpisivanja ugovora)'],
          ['Druga rata', '500€ (do 01.11.2025)'],
          ['Treća rata', '900€ (do 01.12.2025)'],
          ['UKUPNO', '1.800€'],
        ]
      : [
          ['Prva rata', '500€ (uplata u roku od 24h od datuma potpisivanja ugovora)'],
          ['Druga rata', '1.000€ (do 01.11.2025)'],
          ['Treća rata', '1.000€ (do 01.12.2025)'],
          ['UKUPNO', '2.500€'],
        ];

    let planH = 8;
    planPairs.forEach(([, v]) => { planH += measureValue(h, v); });
    drawBox(h, y - 4, planH + 8, [245, 236, 229]);

    yy = y + 8;
    planPairs.forEach(([k, v]) => { yy = drawKeyValue(h, k, v, yy); });
    y = yy + 12;
  }

  // Payment Details Section
  y = drawSection(h, 'PODACI ZA UPLATU', y);
  const paymentPairs: [string, string][] = [
    ['Primalac', 'Željka Radičanin'],
    ['Banka', 'Raiffeisen Regionalbank Mödling eGen (mbH)'],
    ['IBAN', 'AT31 3225 0000 0196 4659'],
    ['BIC', 'RLNWATWWGTD'],
  ];

  let payH = 8;
  paymentPairs.forEach(([, v]) => { payH += measureValue(h, v); });
  drawBox(h, y - 4, payH + 8);

  yy = y + 8;
  paymentPairs.forEach(([k, v]) => { yy = drawKeyValue(h, k, v, yy); });
  y = yy;

  // Contract Info Section
  if (contract) {
    y += 12;
    y = drawSection(h, 'INFORMACIJE O UGOVORU', y);
    const infoPairs: [string, string][] = [
      ['ID ugovora', contract.id.substring(0, 8) + '...'],
      ['Tip ugovora', contract.contract_type === 'individual' ? 'Fizičko lice' : 'Pravno lice'],
      ...(contract.signed_at ? [['Datum potpisivanja', dateOnly(contract.signed_at)] as [string, string]] : []),
    ];

    let infoH = 8;
    infoPairs.forEach(([, v]) => { infoH += measureValue(h, v); });
    drawBox(h, y - 4, infoH + 8);

    yy = y + 8;
    infoPairs.forEach(([k, v]) => { yy = drawKeyValue(h, k, v, yy); });
  }

  // Contract Content Page
  if (contract && contract.contract_content) {
    pdf.addPage();

    // Header
    pdf.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    pdf.rect(0, 0, h.pageW, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('SADRŽAJ UGOVORA', h.margin, 18);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    // Remove signature line from content
    const cleanContent = contract.contract_content.replace(/^\s*Potpis kupca.*$/gmi, '');
    const lines = pdf.splitTextToSize(cleanContent, h.pageW - 2 * h.margin);

    let cy = 42;
    lines.forEach((ln: string) => {
      if (cy > h.pageH - 30) {
        pdf.addPage();
        pdf.setFillColor(BRAND.r, BRAND.g, BRAND.b);
        pdf.rect(0, 0, h.pageW, 25, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('SADRŽAJ UGOVORA (nastavak)', h.margin, 18);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        cy = 35;
      }
      pdf.text(ln, h.margin, cy);
      cy += 6.2;
    });

    // Digital Signature
    cy += 16;
    if (cy > h.pageH - 60) {
      pdf.addPage();
      cy = 40;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('DIGITALNI POTPIS:', h.margin, cy);
    cy += 10;

    if (contract.signature_data) {
      try {
        pdf.addImage(contract.signature_data, 'PNG', h.margin, cy, 60, 22);
      } catch (e) {
        console.error('Error adding signature image:', e);
      }
      cy += 28;
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Potpisano: ${dateOnly(contract.signed_at)}`, h.margin, cy);
  }

  // Footer on all pages
  const genDate = dateOnly();
  const pages = (pdf.internal as any).getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFillColor(248, 249, 250);
    pdf.rect(0, h.pageH - 18, h.pageW, 18, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`PIUS ACADEMY - Strana ${i} od ${pages}`, h.margin, h.pageH - 8);
    pdf.text(`Generisano: ${genDate}`, h.pageW - h.margin - 50, h.pageH - 8);
  }

  // Save PDF
  const pkg = student.package_type === 'pius-plus' ? 'PIUS_PLUS' : 'PIUS_PRO';
  const fname = `${pkg}_${student.first_name}_${student.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fname);
}
