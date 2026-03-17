import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order, OrderItem, MenuItem } from '@/types';

// ─── Android WebView bridge type ─────────────────────────────────────────────
declare global {
    interface Window {
        Android?: {
            printESCPOS: (text: string) => void;
        };
    }
}

interface InvoiceData {
    order: Order;
    items: (OrderItem & { menu_item: MenuItem })[];
    restaurantName: string;
    tableNumber: string;
    address?: string;
    phone?: string;
    gstin?: string;
    receiptFooter?: string;
    billerName?: string;
    taxRate?: number;
}

// Helper: right-align key + value pair within 80mm width
const row = (doc: jsPDF, label: string, value: string, y: number, width: number) => {
    doc.text(label, 5, y);
    doc.text(value, width - 5, y, { align: 'right' });
};

export const generateInvoicePDF = async (data: InvoiceData) => {
    // ── Dynamic height calculation ───────────────────────────────────────
    // Estimate: header ~40mm + per-item ~5mm + totals ~25mm + footer ~12mm
    const headerMm = 42 + (data.address ? 4 : 0) + (data.phone ? 4 : 0) + (data.gstin ? 4 : 0) + (data.billerName ? 4 : 0);
    const itemsMm = data.items.length * 5 + 8; // table rows + header
    const totalsMm = 28;
    const footerMm = 14;
    const pageHeight = Math.max(120, headerMm + itemsMm + totalsMm + footerMm);

    const doc = new jsPDF({
        unit: 'mm',
        format: [80, pageHeight],
    });

    const W = doc.internal.pageSize.getWidth(); // 80mm
    const MARGIN = 4;
    const RIGHT = W - MARGIN;
    let y = 8;

    // ── Restaurant Header ────────────────────────────────────────────────
    try {
        const response = await fetch('/assets/logo.png');
        if (!response.ok) throw new Error('Logo not found');
        const blob = await response.blob();
        const base64data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        // 50mm wide, 25mm high, centered on 80mm paper (X = 15)
        doc.addImage(base64data, 'PNG', 15, y, 50, 25);
        y += 28; // Move down below logo
    } catch (err) {
        // Fallback to text if image fails
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(data.restaurantName || 'Restaurant', W / 2, y, { align: 'center' });
        y += 5;
    }

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');

    if (data.address) {
        y += 4.5;
        const wrapped = doc.splitTextToSize(data.address, W - 10);
        doc.text(wrapped, W / 2, y, { align: 'center' });
        y += (wrapped.length - 1) * 4;
    }
    if (data.phone) {
        y += 4;
        doc.text(`Tel: ${data.phone}`, W / 2, y, { align: 'center' });
    }
    if (data.gstin) {
        y += 4;
        doc.text(`GSTIN: ${data.gstin}`, W / 2, y, { align: 'center' });
    }

    // ── Divider ──────────────────────────────────────────────────────────
    y += 5;
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, RIGHT, y);

    // ── Bill Meta ────────────────────────────────────────────────────────
    y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bill #: ${data.order.id.slice(0, 8).toUpperCase()}`, MARGIN, y);
    doc.text(`Table: ${data.tableNumber}`, RIGHT, y, { align: 'right' });

    y += 4.5;
    const dateStr = new Date(data.order.created_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
    doc.text(`Date: ${dateStr}`, MARGIN, y);

    if (data.billerName) {
        y += 4;
        doc.text(`Billed by: ${data.billerName}`, MARGIN, y);
    }

    // ── Divider ──────────────────────────────────────────────────────────
    y += 5;
    doc.line(MARGIN, y, RIGHT, y);
    y += 2;

    // ── Items Table ──────────────────────────────────────────────────────
    autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Item', 'Qty', 'Rate', 'Amt']],
        body: data.items.map(item => [
            item.menu_item.name,
            item.quantity.toString(),
            (item.unit_price / 100).toFixed(2),
            (item.total_price / 100).toFixed(2),
        ]),
        theme: 'plain',
        styles: { fontSize: 7, cellPadding: { top: 1.2, bottom: 1.2, left: 0.5, right: 0.5 } },
        headStyles: { fontStyle: 'bold', lineWidth: { bottom: 0.2 }, lineColor: [0, 0, 0] },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 8, halign: 'center' },
            2: { cellWidth: 13, halign: 'right' },
            3: { cellWidth: 14, halign: 'right' },
        },
    });

    y = (doc as any).lastAutoTable.finalY + 3;

    // ── Totals ───────────────────────────────────────────────────────────
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, RIGHT, y);
    y += 4.5;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    row(doc, 'Subtotal:', `Rs. ${(data.order.subtotal / 100).toFixed(2)}`, y, W);

    y += 4;
    const taxLabel = data.taxRate !== undefined ? `Taxes and Charges (${data.taxRate}%):` : 'Taxes and Charges:';
    row(doc, taxLabel, `Rs. ${(data.order.tax_amount / 100).toFixed(2)}`, y, W);

    y += 2;
    doc.line(MARGIN, y, RIGHT, y);
    y += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    row(doc, 'TOTAL:', `Rs. ${(data.order.total_amount / 100).toFixed(2)}`, y, W);

    // ── Footer ───────────────────────────────────────────────────────────
    y += 8;
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, RIGHT, y);
    y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    const footer = data.receiptFooter || 'Thank you! Visit again.';
    const footerLines = doc.splitTextToSize(footer, W - 10);
    doc.text(footerLines, W / 2, y, { align: 'center' });

    return doc;
};

// ─── KOT PDF ─────────────────────────────────────────────────────────────────
export interface KOTData {
    orderId: string;
    tableNumber: string;
    waiterName: string;
    createdAt: string;
    items: { name: string; quantity: number; notes?: string }[];
}

export const generateKOTPDF = (data: KOTData) => {
    // Dynamic height: header ~45mm + items (6mm each, notes rows add 5mm) + footer ~10mm
    const itemRows = data.items.reduce((acc, item) => acc + 1 + (item.notes ? 1 : 0), 0);
    const pageHeight = Math.max(80, 45 + itemRows * 6 + 14);

    const doc = new jsPDF({ unit: 'mm', format: [80, pageHeight] });
    const width = doc.internal.pageSize.getWidth();
    let y = 8;

    // ── Title ──
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('KITCHEN ORDER TICKET', width / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.line(5, y, width - 5, y);

    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(data.tableNumber, 5, y);
    doc.text(`KOT# ${data.orderId.slice(0, 8).toUpperCase()}`, width - 5, y, { align: 'right' });

    y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Waiter: ${data.waiterName}`, 5, y);
    y += 4;
    doc.text(`Time: ${new Date(data.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`, 5, y);
    y += 4;
    doc.line(5, y, width - 5, y);
    y += 3;

    // ── Items ──
    autoTable(doc, {
        startY: y,
        margin: { left: 5, right: 5 },
        head: [['Item', 'Qty']],
        body: data.items.flatMap(item => {
            const rows: string[][] = [[item.name, item.quantity.toString()]];
            if (item.notes) rows.push([`  ↳ ${item.notes}`, '']);
            return rows;
        }),
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fontStyle: 'bold', lineWidth: 0.1, fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 4;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.line(5, finalY, width - 5, finalY);

    return doc;
};

/** Open KOT in a new tab and trigger the print dialog (desktop fallback) */
export const printKOT = (data: KOTData) => {
    const doc = generateKOTPDF(data);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
};

// ─── Bluetooth ESC/POS KOT Print (Android WebView) ───────────────────────────
/**
 * Prints KOT via Bluetooth thermal printer when running inside the Android WebView.
 * Calls window.Android.printESCPOS(text) which is handled by PrintBridge.kt.
 * Falls back to PDF print when running in a desktop browser.
 */
export const printKOTBluetooth = (data: KOTData) => {
    if (window.Android?.printESCPOS) {
        // Format as plain-text ESC/POS layout (48-char wide for 80mm paper)
        const L = (text: string) => text + '\n';
        const divider = '================================\n';
        const thinLine = '--------------------------------\n';
        const center = (text: string, width = 32) => {
            const pad = Math.max(0, Math.floor((width - text.length) / 2));
            return ' '.repeat(pad) + text + '\n';
        };

        let out = '';
        out += divider;
        out += center('KITCHEN ORDER TICKET');
        out += divider;
        out += L(`Table  : ${data.tableNumber}`);
        out += L(`KOT #  : ${data.orderId.slice(0, 8).toUpperCase()}`);
        out += L(`Waiter : ${data.waiterName}`);
        out += L(`Time   : ${new Date(data.createdAt).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true,
        })}`);
        out += thinLine;
        out += L('ITEM                       QTY');
        out += thinLine;

        for (const item of data.items) {
            const name = item.name.length > 23 ? item.name.substring(0, 22) + '…' : item.name.padEnd(23);
            const qty = `x${item.quantity}`;
            out += L(`${name}  ${qty}`);
            if (item.notes) {
                out += L(`  > ${item.notes}`);
            }
        }

        out += divider;
        out += '\n\n\n'; // Feed before cut

        window.Android.printESCPOS(out);
    } else {
        // Fallback for desktop browser
        printKOT(data);
    }
};
