import { fmtDate } from '../utils/hijriDate';

/**
 * Barcode Printer Integration Module - تكامل طابعات الباركود
 * Supports: Zebra (ZPL), TSC, Honeywell, DYMO, Brother
 */

// Barcode printer configuration
const PRINTER_CONFIG = {
    labelWidth: 50,      // mm
    labelHeight: 25,     // mm
    dpi: 203,           // dots per inch
    darkness: 15,       // 0-30
    printSpeed: 4,      // inches/second
    encoding: 'utf-8',
};

// ZPL Command Generator (for Zebra printers)
class ZPLGenerator {
    constructor(config = {}) {
        this.config = { ...PRINTER_CONFIG, ...config };
    }

    // Generate ZPL for barcode label
    generateLabel(data) {
        const {
            barcode,
            title,
            date,
            organization,
            classificationName,
            referenceNumber,
        } = data;

        // Calculate positions based on DPI
        const dpi = this.config.dpi;
        const labelWidthDots = Math.round((this.config.labelWidth / 25.4) * dpi);
        const labelHeightDots = Math.round((this.config.labelHeight / 25.4) * dpi);

        // ZPL Commands
        let zpl = '';

        // Start format
        zpl += '^XA\n';

        // Label setup
        zpl += `^PW${labelWidthDots}\n`;      // Print width
        zpl += `^LL${labelHeightDots}\n`;      // Label length
        zpl += `^MD${this.config.darkness}\n`; // Media darkness
        zpl += '^PON\n';                        // Print orientation normal
        zpl += '^PR4\n';                        // Print rate

        // Arabic text support (using UTF-8)
        zpl += '^CI28\n';  // UTF-8 encoding

        // Organization name at top (Arabic)
        zpl += `^FO20,20^A@N,25,25,E:ARIALUNI.TTF^FD${organization || 'منصة مسارات'}^FS\n`;

        // Barcode (Code 128)
        zpl += `^FO20,60^BY2^BCN,80,Y,N,N^FD${barcode}^FS\n`;

        // Title
        zpl += `^FO20,160^A@N,20,20,E:ARIALUNI.TTF^FD${this.truncate(title, 30)}^FS\n`;

        // Classification
        if (classificationName) {
            zpl += `^FO20,185^A@N,18,18,E:ARIALUNI.TTF^FD${classificationName}^FS\n`;
        }

        // Reference number and date
        zpl += `^FO20,210^A0N,16,16^FD${referenceNumber || ''} | ${date}^FS\n`;

        // End format
        zpl += '^XZ\n';

        return zpl;
    }

    // Generate ZPL for simple barcode only
    generateSimpleBarcode(barcode, copies = 1) {
        let zpl = '^XA\n';
        zpl += `^PQ${copies}\n`;  // Quantity
        zpl += '^FO50,50^BY3^BCN,100,Y,N,N^FD' + barcode + '^FS\n';
        zpl += '^XZ\n';
        return zpl;
    }

    // Generate QR Code label
    generateQRLabel(data) {
        const { barcode, title, url } = data;

        let zpl = '^XA\n';
        zpl += `^PW${Math.round((this.config.labelWidth / 25.4) * this.config.dpi)}\n`;

        // QR Code
        zpl += `^FO20,20^BQN,2,5^FDQA,${url || barcode}^FS\n`;

        // Barcode text below
        zpl += `^FO20,180^A0N,20,20^FD${barcode}^FS\n`;

        // Title
        if (title) {
            zpl += `^FO20,210^A@N,18,18,E:ARIALUNI.TTF^FD${this.truncate(title, 25)}^FS\n`;
        }

        zpl += '^XZ\n';
        return zpl;
    }

    truncate(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    }
}

// ESC/POS Command Generator (for thermal printers)
class ESCPOSGenerator {
    constructor(config = {}) {
        this.config = { ...PRINTER_CONFIG, ...config };
    }

    generateLabel(data) {
        const { barcode, title, organization } = data;

        // ESC/POS commands as hex string
        let commands = [];

        // Initialize printer
        commands.push('\x1B\x40');  // ESC @

        // Set Arabic code page
        commands.push('\x1B\x74\x16');  // Set code page Arabic

        // Center alignment
        commands.push('\x1B\x61\x01');

        // Organization name
        commands.push(organization || 'منصة مسارات');
        commands.push('\n');

        // Barcode setup
        commands.push('\x1D\x68\x50');  // Barcode height = 80
        commands.push('\x1D\x77\x02');  // Barcode width = 2
        commands.push('\x1D\x48\x02');  // HRI below barcode

        // Print Code 128 barcode
        commands.push('\x1D\x6B\x49');  // Code 128
        commands.push(String.fromCharCode(barcode.length));
        commands.push(barcode);

        commands.push('\n');

        // Title
        if (title) {
            commands.push(this.truncate(title, 32));
            commands.push('\n');
        }

        // Feed and cut
        commands.push('\n\n\n');
        commands.push('\x1D\x56\x00');  // Cut paper

        return commands.join('');
    }

    truncate(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    }
}

// Browser Print API Integration
class BrowserPrintService {
    constructor() {
        this.printer = null;
        this.isConnected = false;
    }

    // Check if Web Bluetooth is available
    isSupported() {
        return 'bluetooth' in navigator || 'usb' in navigator;
    }

    // Connect to Zebra printer via Browser Print
    async connectZebra() {
        if (typeof window === 'undefined') return false;

        // Check for Zebra Browser Print
        if (window.BrowserPrint) {
            return new Promise((resolve, reject) => {
                window.BrowserPrint.getDefaultDevice('printer', (printer) => {
                    if (printer) {
                        this.printer = printer;
                        this.isConnected = true;
                        resolve(true);
                    } else {
                        reject(new Error('No Zebra printer found'));
                    }
                }, (error) => {
                    reject(new Error('Zebra Browser Print error: ' + error));
                });
            });
        }

        return false;
    }

    // Print ZPL directly
    async printZPL(zpl) {
        if (this.printer && this.isConnected) {
            return new Promise((resolve, reject) => {
                this.printer.send(zpl,
                    () => resolve(true),
                    (error) => reject(new Error('Print error: ' + error))
                );
            });
        }
        throw new Error('Printer not connected');
    }

    // Print using browser print dialog
    async printWithDialog(content, options = {}) {
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>طباعة الباركود</title>
                <style>
                    @page {
                        size: ${options.width || 50}mm ${options.height || 25}mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 5mm;
                        font-family: 'IBM Plex Sans Arabic', Arial, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .org-name {
                        font-size: 10pt;
                        font-weight: bold;
                        margin-bottom: 2mm;
                    }
                    .barcode-container {
                        margin: 2mm 0;
                    }
                    .barcode-text {
                        font-family: 'Libre Barcode 128', monospace;
                        font-size: 36pt;
                        letter-spacing: 0;
                    }
                    .barcode-number {
                        font-size: 8pt;
                        margin-top: 1mm;
                    }
                    .title {
                        font-size: 8pt;
                        margin-top: 1mm;
                        max-width: 45mm;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .info {
                        font-size: 6pt;
                        color: #666;
                        margin-top: 1mm;
                    }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet">
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for fonts to load
        await new Promise(resolve => setTimeout(resolve, 500));

        printWindow.print();
        printWindow.close();
    }
}

// Main Barcode Printer Service
export class BarcodePrinterService {
    constructor() {
        this.zplGenerator = new ZPLGenerator();
        this.escposGenerator = new ESCPOSGenerator();
        this.browserPrint = new BrowserPrintService();
        this.printerType = 'browser'; // zebra, escpos, browser
    }

    // Initialize and detect printer
    async initialize() {
        try {
            const connected = await this.browserPrint.connectZebra();
            if (connected) {
                this.printerType = 'zebra';
                return { success: true, type: 'zebra', message: 'Zebra printer connected' };
            }
        } catch (error) {
            console.log('Zebra not available, using browser printing');
        }

        this.printerType = 'browser';
        return { success: true, type: 'browser', message: 'Using browser print dialog' };
    }

    // Print barcode label
    async printLabel(data, options = {}) {
        const {
            barcode,
            title,
            date = fmtDate(new Date()),
            organization = 'منصة مسارات',
            classificationName,
            referenceNumber,
            copies = 1,
        } = data;

        const labelData = {
            barcode,
            title,
            date,
            organization,
            classificationName,
            referenceNumber,
        };

        try {
            switch (this.printerType) {
                case 'zebra':
                    const zpl = this.zplGenerator.generateLabel(labelData);
                    for (let i = 0; i < copies; i++) {
                        await this.browserPrint.printZPL(zpl);
                    }
                    return { success: true, method: 'zebra' };

                case 'escpos':
                    // For ESC/POS printers (future implementation)
                    throw new Error('ESC/POS printing not yet implemented');

                case 'browser':
                default:
                    const htmlContent = this.generateHTMLLabel(labelData);
                    await this.browserPrint.printWithDialog(htmlContent, {
                        width: options.labelWidth || 50,
                        height: options.labelHeight || 30,
                    });
                    return { success: true, method: 'browser' };
            }
        } catch (error) {
            console.error('Print error:', error);
            throw error;
        }
    }

    // Generate HTML label content
    generateHTMLLabel(data) {
        const {
            barcode,
            title,
            date,
            organization,
            classificationName,
            referenceNumber,
        } = data;

        return `
            <div class="org-name">${organization}</div>
            <div class="barcode-container">
                <div class="barcode-text">*${barcode}*</div>
                <div class="barcode-number">${barcode}</div>
            </div>
            <div class="title">${title || ''}</div>
            ${classificationName ? `<div class="info">${classificationName}</div>` : ''}
            <div class="info">${referenceNumber || ''} | ${date}</div>
        `;
    }

    // Print simple barcode
    async printSimpleBarcode(barcode, copies = 1) {
        return this.printLabel({ barcode }, { copies });
    }

    // Generate barcode image (Canvas-based)
    generateBarcodeImage(barcode, options = {}) {
        const {
            width = 200,
            height = 80,
            format = 'CODE128',
        } = options;

        if (typeof document === 'undefined') return null;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Simple Code 128 barcode rendering
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Draw barcode bars
        const barWidth = width / (barcode.length * 11 + 35);
        let x = 10;

        // Start pattern
        ctx.fillStyle = 'black';
        ctx.fillRect(x, 5, barWidth * 2, height - 25);
        x += barWidth * 3;

        // Encode each character
        for (let char of barcode) {
            const code = char.charCodeAt(0);
            const pattern = this.getCode128Pattern(code);

            for (let i = 0; i < pattern.length; i++) {
                if (pattern[i] === '1') {
                    ctx.fillRect(x, 5, barWidth, height - 25);
                }
                x += barWidth;
            }
        }

        // End pattern
        ctx.fillRect(x, 5, barWidth * 2, height - 25);

        // Draw text below barcode
        ctx.fillStyle = 'black';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(barcode, width / 2, height - 5);

        return canvas.toDataURL('image/png');
    }

    // Simple Code 128 pattern (simplified)
    getCode128Pattern(charCode) {
        // Simplified encoding - in real implementation use full Code 128 table
        const base = (charCode - 32) % 103;
        let pattern = '';
        const weights = [1, 2, 1, 2, 3, 1, 3, 2, 1, 2, 1];

        for (let i = 0; i < 11; i++) {
            pattern += ((base >> (10 - i)) & 1) ? '1' : '0';
        }

        return pattern;
    }

    // Get ZPL code for direct printing
    getZPL(data) {
        return this.zplGenerator.generateLabel(data);
    }

    // Preview label (returns HTML)
    previewLabel(data) {
        return this.generateHTMLLabel(data);
    }
}

// Singleton instance
export const barcodePrinter = new BarcodePrinterService();
export default barcodePrinter;
