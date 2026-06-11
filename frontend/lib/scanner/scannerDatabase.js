/**
 * قاعدة بيانات الماسحات الضوئية الشهيرة
 * Scanner Database - Popular Scanner Library
 *
 * يحتوي على معلومات الماسحات الشهيرة للتعرف التلقائي عليها
 */

// قائمة الشركات المصنعة للماسحات
export const SCANNER_MANUFACTURERS = {
    CANON: {
        id: 'canon',
        name: 'Canon',
        nameAr: 'كانون',
        logo: '/images/scanners/canon.png',
        website: 'https://www.canon.com',
        driverUrl: 'https://www.canon.com/support/software',
    },
    HP: {
        id: 'hp',
        name: 'HP (Hewlett-Packard)',
        nameAr: 'إتش بي',
        logo: '/images/scanners/hp.png',
        website: 'https://www.hp.com',
        driverUrl: 'https://support.hp.com/drivers',
    },
    EPSON: {
        id: 'epson',
        name: 'Epson',
        nameAr: 'إبسون',
        logo: '/images/scanners/epson.png',
        website: 'https://www.epson.com',
        driverUrl: 'https://epson.com/Support/sl/s',
    },
    BROTHER: {
        id: 'brother',
        name: 'Brother',
        nameAr: 'برذر',
        logo: '/images/scanners/brother.png',
        website: 'https://www.brother.com',
        driverUrl: 'https://support.brother.com/g/b/productsearch.aspx',
    },
    FUJITSU: {
        id: 'fujitsu',
        name: 'Fujitsu',
        nameAr: 'فوجيتسو',
        logo: '/images/scanners/fujitsu.png',
        website: 'https://www.fujitsu.com',
        driverUrl: 'https://www.fujitsu.com/global/support/products/computing/peripheral/scanners/',
    },
    KODAK: {
        id: 'kodak',
        name: 'Kodak Alaris',
        nameAr: 'كوداك',
        logo: '/images/scanners/kodak.png',
        website: 'https://www.alarisworld.com',
        driverUrl: 'https://www.alarisworld.com/go/scanners',
    },
    XEROX: {
        id: 'xerox',
        name: 'Xerox',
        nameAr: 'زيروكس',
        logo: '/images/scanners/xerox.png',
        website: 'https://www.xerox.com',
        driverUrl: 'https://www.xerox.com/support',
    },
    SAMSUNG: {
        id: 'samsung',
        name: 'Samsung',
        nameAr: 'سامسونج',
        logo: '/images/scanners/samsung.png',
        website: 'https://www.samsung.com',
        driverUrl: 'https://www.samsung.com/support',
    },
    RICOH: {
        id: 'ricoh',
        name: 'Ricoh',
        nameAr: 'ريكو',
        logo: '/images/scanners/ricoh.png',
        website: 'https://www.ricoh.com',
        driverUrl: 'https://www.ricoh.com/support',
    },
    PLUSTEK: {
        id: 'plustek',
        name: 'Plustek',
        nameAr: 'بلوستك',
        logo: '/images/scanners/plustek.png',
        website: 'https://www.plustek.com',
        driverUrl: 'https://www.plustek.com/support',
    },
    AVISION: {
        id: 'avision',
        name: 'Avision',
        nameAr: 'أفيجن',
        logo: '/images/scanners/avision.png',
        website: 'https://www.avision.com',
        driverUrl: 'https://www.avision.com/support',
    },
    PANASONIC: {
        id: 'panasonic',
        name: 'Panasonic',
        nameAr: 'باناسونيك',
        logo: '/images/scanners/panasonic.png',
        website: 'https://www.panasonic.com',
        driverUrl: 'https://www.panasonic.com/support',
    },
    MICROTEK: {
        id: 'microtek',
        name: 'Microtek',
        nameAr: 'مايكروتك',
        logo: '/images/scanners/microtek.png',
        website: 'https://www.microtek.com',
        driverUrl: 'https://www.microtek.com/support',
    },
    MUSTEK: {
        id: 'mustek',
        name: 'Mustek',
        nameAr: 'موستك',
        logo: '/images/scanners/mustek.png',
        website: 'https://www.mustek.com',
        driverUrl: 'https://www.mustek.com/support',
    },
    VISIONEER: {
        id: 'visioneer',
        name: 'Visioneer',
        nameAr: 'فيجنير',
        logo: '/images/scanners/visioneer.png',
        website: 'https://www.visioneer.com',
        driverUrl: 'https://www.visioneer.com/support',
    },
};

// أنواع الماسحات
export const SCANNER_TYPES = {
    FLATBED: { id: 'flatbed', name: 'Flatbed', nameAr: 'ماسح مسطح' },
    SHEETFED: { id: 'sheetfed', name: 'Sheet-fed', nameAr: 'ماسح ورقي' },
    DOCUMENT: { id: 'document', name: 'Document Scanner', nameAr: 'ماسح مستندات' },
    PORTABLE: { id: 'portable', name: 'Portable', nameAr: 'ماسح محمول' },
    MULTIFUNCTION: { id: 'multifunction', name: 'Multifunction', nameAr: 'طابعة متعددة الوظائف' },
    HANDHELD: { id: 'handheld', name: 'Handheld', nameAr: 'ماسح يدوي' },
    DRUM: { id: 'drum', name: 'Drum Scanner', nameAr: 'ماسح أسطواني' },
    OVERHEAD: { id: 'overhead', name: 'Overhead', nameAr: 'ماسح علوي' },
    NETWORK: { id: 'network', name: 'Network Scanner', nameAr: 'ماسح شبكي' },
};

// قاعدة بيانات الماسحات الشهيرة
export const SCANNER_DATABASE = [
    // ============ Canon Scanners ============
    {
        id: 'canon-lide-400',
        manufacturer: 'canon',
        model: 'CanoScan LiDE 400',
        type: 'flatbed',
        maxDPI: 4800,
        colorDepth: 48,
        adf: false,
        duplex: false,
        dailyDuty: 0,
        speed: 8,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Photo'],
        features: ['Auto Document Fix', 'USB Powered', 'Slim Design'],
        keywords: ['lide', '400', 'canoscan'],
        recommended: true,
    },
    {
        id: 'canon-lide-300',
        manufacturer: 'canon',
        model: 'CanoScan LiDE 300',
        type: 'flatbed',
        maxDPI: 2400,
        colorDepth: 48,
        adf: false,
        duplex: false,
        dailyDuty: 0,
        speed: 10,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter'],
        features: ['USB Powered', 'Slim Design'],
        keywords: ['lide', '300', 'canoscan'],
    },
    {
        id: 'canon-dr-c225ii',
        manufacturer: 'canon',
        model: 'imageFORMULA DR-C225 II',
        type: 'document',
        maxDPI: 600,
        colorDepth: 24,
        adf: true,
        adfCapacity: 30,
        duplex: true,
        dailyDuty: 1500,
        speed: 25,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Legal', 'Business Card'],
        features: ['Auto Deskew', 'Blank Page Skip', 'Passport Scanning'],
        keywords: ['dr-c225', 'imageformula', 'document'],
        recommended: true,
    },
    {
        id: 'canon-dr-c230',
        manufacturer: 'canon',
        model: 'imageFORMULA DR-C230',
        type: 'document',
        maxDPI: 600,
        colorDepth: 24,
        adf: true,
        adfCapacity: 60,
        duplex: true,
        dailyDuty: 3500,
        speed: 30,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Compact Design', 'ID Card Scanning'],
        keywords: ['dr-c230', 'imageformula'],
    },
    {
        id: 'canon-dr-m260',
        manufacturer: 'canon',
        model: 'imageFORMULA DR-M260',
        type: 'document',
        maxDPI: 600,
        colorDepth: 24,
        adf: true,
        adfCapacity: 80,
        duplex: true,
        dailyDuty: 7000,
        speed: 60,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal', 'Long Paper'],
        features: ['High Speed', 'Heavy Duty', 'Ultrasonic Double Feed Detection'],
        keywords: ['dr-m260', 'imageformula', 'workgroup'],
        recommended: true,
    },
    {
        id: 'canon-dr-g2140',
        manufacturer: 'canon',
        model: 'imageFORMULA DR-G2140',
        type: 'document',
        maxDPI: 600,
        colorDepth: 24,
        adf: true,
        adfCapacity: 500,
        duplex: true,
        dailyDuty: 50000,
        speed: 140,
        interface: ['USB 3.0', 'Ethernet'],
        paperSizes: ['A4', 'A3', 'Letter', 'Legal'],
        features: ['Production Scanner', 'Large Volume', 'Enterprise'],
        keywords: ['dr-g2140', 'production', 'enterprise'],
    },
    {
        id: 'canon-p-215ii',
        manufacturer: 'canon',
        model: 'imageFORMULA P-215II',
        type: 'portable',
        maxDPI: 600,
        colorDepth: 24,
        adf: true,
        adfCapacity: 20,
        duplex: true,
        dailyDuty: 500,
        speed: 15,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Card'],
        features: ['Portable', 'USB Powered', 'Card Scanning'],
        keywords: ['p-215', 'portable', 'mobile'],
    },

    // ============ HP Scanners ============
    {
        id: 'hp-scanjet-pro-2500',
        manufacturer: 'hp',
        model: 'ScanJet Pro 2500 f1',
        type: 'flatbed',
        maxDPI: 1200,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 1500,
        speed: 20,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Flatbed + ADF', 'Compact'],
        keywords: ['scanjet', 'pro', '2500', 'f1'],
        recommended: true,
    },
    {
        id: 'hp-scanjet-pro-3000',
        manufacturer: 'hp',
        model: 'ScanJet Pro 3000 s4',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 4000,
        speed: 40,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['High Speed', 'Small Footprint'],
        keywords: ['scanjet', 'pro', '3000', 's4'],
    },
    {
        id: 'hp-scanjet-pro-4500',
        manufacturer: 'hp',
        model: 'ScanJet Pro 4500 fn1',
        type: 'sheetfed',
        maxDPI: 1200,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 4000,
        speed: 30,
        interface: ['USB 3.0', 'Ethernet', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Network Ready', 'Touchscreen'],
        keywords: ['scanjet', 'pro', '4500', 'fn1'],
        recommended: true,
    },
    {
        id: 'hp-scanjet-enterprise-5000',
        manufacturer: 'hp',
        model: 'ScanJet Enterprise Flow 5000 s5',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 80,
        duplex: true,
        dailyDuty: 6000,
        speed: 65,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Enterprise', 'High Volume', 'Auto Crop'],
        keywords: ['scanjet', 'enterprise', '5000', 's5'],
    },
    {
        id: 'hp-scanjet-enterprise-7000',
        manufacturer: 'hp',
        model: 'ScanJet Enterprise Flow 7000 s3',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 100,
        duplex: true,
        dailyDuty: 7500,
        speed: 75,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal', 'A3'],
        features: ['Enterprise', 'Production', 'Large Capacity'],
        keywords: ['scanjet', 'enterprise', '7000', 's3'],
    },
    {
        id: 'hp-scanjet-pro-n4000',
        manufacturer: 'hp',
        model: 'ScanJet Pro N4000 snw1',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 4000,
        speed: 40,
        interface: ['USB 3.0', 'Ethernet', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Network', 'Cloud Ready'],
        keywords: ['scanjet', 'pro', 'n4000'],
    },

    // ============ Epson Scanners ============
    {
        id: 'epson-perfection-v39',
        manufacturer: 'epson',
        model: 'Perfection V39',
        type: 'flatbed',
        maxDPI: 4800,
        colorDepth: 48,
        adf: false,
        duplex: false,
        dailyDuty: 0,
        speed: 10,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Photo'],
        features: ['USB Powered', 'Slim', 'ReadyScan LED'],
        keywords: ['perfection', 'v39'],
    },
    {
        id: 'epson-perfection-v600',
        manufacturer: 'epson',
        model: 'Perfection V600 Photo',
        type: 'flatbed',
        maxDPI: 6400,
        colorDepth: 48,
        adf: false,
        duplex: false,
        dailyDuty: 0,
        speed: 12,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Film', '35mm'],
        features: ['Film Scanning', 'Photo Restoration', 'Digital ICE'],
        keywords: ['perfection', 'v600', 'photo'],
        recommended: true,
    },
    {
        id: 'epson-ds-530ii',
        manufacturer: 'epson',
        model: 'WorkForce DS-530 II',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 4000,
        speed: 35,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal', 'Plastic Cards'],
        features: ['Workgroup', 'Ultrasonic Detection'],
        keywords: ['workforce', 'ds-530', 'ds530'],
        recommended: true,
    },
    {
        id: 'epson-ds-570w',
        manufacturer: 'epson',
        model: 'WorkForce DS-570W',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 4000,
        speed: 35,
        interface: ['USB 3.0', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Wireless', 'Mobile Scanning'],
        keywords: ['workforce', 'ds-570w', 'wireless'],
    },
    {
        id: 'epson-ds-780n',
        manufacturer: 'epson',
        model: 'WorkForce DS-780N',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 100,
        duplex: true,
        dailyDuty: 5000,
        speed: 45,
        interface: ['USB 3.0', 'Ethernet'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Network', 'Touchscreen', 'Scan to Cloud'],
        keywords: ['workforce', 'ds-780n', 'network'],
    },
    {
        id: 'epson-ds-870',
        manufacturer: 'epson',
        model: 'WorkForce DS-870',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 100,
        duplex: true,
        dailyDuty: 7000,
        speed: 65,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['High Speed', 'Document Management'],
        keywords: ['workforce', 'ds-870'],
    },
    {
        id: 'epson-es-580w',
        manufacturer: 'epson',
        model: 'RapidReceipt RR-600W',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 100,
        duplex: true,
        dailyDuty: 4000,
        speed: 35,
        interface: ['USB 3.0', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Receipts'],
        features: ['Receipt Scanning', 'Auto OCR'],
        keywords: ['rapidreceipt', 'rr-600w', 'receipt'],
    },

    // ============ Brother Scanners ============
    {
        id: 'brother-ads-1700w',
        manufacturer: 'brother',
        model: 'ADS-1700W',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 20,
        duplex: true,
        dailyDuty: 1000,
        speed: 25,
        interface: ['USB 2.0', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'ID Card'],
        features: ['Compact', 'Touchscreen', 'Cloud Ready'],
        keywords: ['ads-1700w', 'compact'],
        recommended: true,
    },
    {
        id: 'brother-ads-2700w',
        manufacturer: 'brother',
        model: 'ADS-2700W',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 3000,
        speed: 35,
        interface: ['USB 2.0', 'Ethernet', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Network', 'Touchscreen', 'Scan to Cloud'],
        keywords: ['ads-2700w', 'network'],
    },
    {
        id: 'brother-ads-3600w',
        manufacturer: 'brother',
        model: 'ADS-3600W',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 5000,
        speed: 50,
        interface: ['USB 3.0', 'Ethernet', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['High Speed', 'Workgroup'],
        keywords: ['ads-3600w', 'workgroup'],
    },
    {
        id: 'brother-ads-4700w',
        manufacturer: 'brother',
        model: 'ADS-4700W',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 80,
        duplex: true,
        dailyDuty: 6000,
        speed: 40,
        interface: ['USB 3.0', 'Ethernet', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Professional', 'Large Touchscreen'],
        keywords: ['ads-4700w', 'professional'],
        recommended: true,
    },
    {
        id: 'brother-ds-740d',
        manufacturer: 'brother',
        model: 'DS-740D',
        type: 'portable',
        maxDPI: 600,
        colorDepth: 48,
        adf: false,
        duplex: true,
        dailyDuty: 0,
        speed: 15,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'ID Card', 'Receipt'],
        features: ['Portable', 'USB Powered', 'Compact'],
        keywords: ['ds-740d', 'portable', 'mobile'],
    },
    {
        id: 'brother-ds-940dw',
        manufacturer: 'brother',
        model: 'DS-940DW',
        type: 'portable',
        maxDPI: 600,
        colorDepth: 48,
        adf: false,
        duplex: true,
        dailyDuty: 0,
        speed: 15,
        interface: ['USB 3.0', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'ID Card'],
        features: ['Portable', 'Wireless', 'Battery Powered'],
        keywords: ['ds-940dw', 'portable', 'wireless'],
    },

    // ============ Fujitsu Scanners ============
    {
        id: 'fujitsu-scansnap-ix1600',
        manufacturer: 'fujitsu',
        model: 'ScanSnap iX1600',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 0,
        speed: 40,
        interface: ['USB 3.0', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Legal', 'Business Card'],
        features: ['Touchscreen', 'Cloud Ready', 'Profile Buttons'],
        keywords: ['scansnap', 'ix1600'],
        recommended: true,
    },
    {
        id: 'fujitsu-scansnap-ix1500',
        manufacturer: 'fujitsu',
        model: 'ScanSnap iX1500',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 0,
        speed: 30,
        interface: ['USB 3.0', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Touchscreen', 'One-Touch Scanning'],
        keywords: ['scansnap', 'ix1500'],
    },
    {
        id: 'fujitsu-scansnap-ix1400',
        manufacturer: 'fujitsu',
        model: 'ScanSnap iX1400',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 0,
        speed: 40,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['USB Only', 'One-Touch Scanning'],
        keywords: ['scansnap', 'ix1400'],
    },
    {
        id: 'fujitsu-scansnap-ix100',
        manufacturer: 'fujitsu',
        model: 'ScanSnap iX100',
        type: 'portable',
        maxDPI: 600,
        colorDepth: 48,
        adf: false,
        duplex: false,
        dailyDuty: 0,
        speed: 5,
        interface: ['USB 2.0', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Photo', 'Receipt'],
        features: ['Portable', 'Battery Powered', 'WiFi Direct'],
        keywords: ['scansnap', 'ix100', 'portable'],
    },
    {
        id: 'fujitsu-sp-1120n',
        manufacturer: 'fujitsu',
        model: 'SP-1120N',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 3000,
        speed: 20,
        interface: ['USB 3.0', 'Ethernet'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Network Ready', 'Compact'],
        keywords: ['sp-1120n', 'network'],
    },
    {
        id: 'fujitsu-sp-1130n',
        manufacturer: 'fujitsu',
        model: 'SP-1130N',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 4500,
        speed: 30,
        interface: ['USB 3.0', 'Ethernet'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Network Ready', 'PaperStream'],
        keywords: ['sp-1130n'],
    },
    {
        id: 'fujitsu-fi-7160',
        manufacturer: 'fujitsu',
        model: 'fi-7160',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 80,
        duplex: true,
        dailyDuty: 4000,
        speed: 60,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal', 'Long Paper'],
        features: ['Workgroup', 'High Speed', 'PaperStream IP'],
        keywords: ['fi-7160', 'workgroup'],
        recommended: true,
    },
    {
        id: 'fujitsu-fi-7260',
        manufacturer: 'fujitsu',
        model: 'fi-7260',
        type: 'flatbed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 80,
        duplex: true,
        dailyDuty: 4000,
        speed: 60,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Flatbed + ADF', 'Workgroup'],
        keywords: ['fi-7260', 'flatbed'],
    },
    {
        id: 'fujitsu-fi-7180',
        manufacturer: 'fujitsu',
        model: 'fi-7180',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 80,
        duplex: true,
        dailyDuty: 6000,
        speed: 80,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Departmental', 'High Speed'],
        keywords: ['fi-7180', 'departmental'],
    },

    // ============ Kodak/Alaris Scanners ============
    {
        id: 'kodak-s2070',
        manufacturer: 'kodak',
        model: 'Alaris S2070',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 80,
        duplex: true,
        dailyDuty: 7000,
        speed: 70,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Workgroup', 'Smart Touch'],
        keywords: ['alaris', 's2070'],
        recommended: true,
    },
    {
        id: 'kodak-s2085f',
        manufacturer: 'kodak',
        model: 'Alaris S2085f',
        type: 'flatbed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 100,
        duplex: true,
        dailyDuty: 8000,
        speed: 85,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Flatbed + ADF', 'High Volume'],
        keywords: ['alaris', 's2085f'],
    },
    {
        id: 'kodak-i3400',
        manufacturer: 'kodak',
        model: 'Alaris i3400',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 250,
        duplex: true,
        dailyDuty: 20000,
        speed: 90,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'A3', 'Letter', 'Legal'],
        features: ['Production', 'High Volume'],
        keywords: ['alaris', 'i3400', 'production'],
    },

    // ============ Xerox Scanners ============
    {
        id: 'xerox-documate-3220',
        manufacturer: 'xerox',
        model: 'DocuMate 3220',
        type: 'flatbed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 3000,
        speed: 23,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Flatbed + ADF', 'OneTouch Technology'],
        keywords: ['documate', '3220'],
    },
    {
        id: 'xerox-documate-6440',
        manufacturer: 'xerox',
        model: 'DocuMate 6440',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 80,
        duplex: true,
        dailyDuty: 6000,
        speed: 40,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Workgroup', 'Visioneer OneTouch'],
        keywords: ['documate', '6440'],
    },

    // ============ Ricoh Scanners ============
    {
        id: 'ricoh-sp-1130n',
        manufacturer: 'ricoh',
        model: 'SP-1130N',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 4500,
        speed: 30,
        interface: ['USB 3.0', 'Ethernet'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Network Ready', 'Compact'],
        keywords: ['ricoh', 'sp-1130n'],
    },

    // ============ Plustek Scanners ============
    {
        id: 'plustek-opticslim-2610',
        manufacturer: 'plustek',
        model: 'OpticSlim 2610 Plus',
        type: 'flatbed',
        maxDPI: 1200,
        colorDepth: 48,
        adf: false,
        duplex: false,
        dailyDuty: 0,
        speed: 8,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter'],
        features: ['USB Powered', 'Slim Design', 'LED Technology'],
        keywords: ['opticslim', '2610'],
    },
    {
        id: 'plustek-smartoffice-ps186',
        manufacturer: 'plustek',
        model: 'SmartOffice PS186',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 2500,
        speed: 25,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Compact', 'ID Card Scanning'],
        keywords: ['smartoffice', 'ps186'],
    },
    {
        id: 'plustek-smartoffice-ps388u',
        manufacturer: 'plustek',
        model: 'SmartOffice PS388U',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 4000,
        speed: 30,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Workgroup', 'Ultrasonic Misfeed Detection'],
        keywords: ['smartoffice', 'ps388u'],
    },
    {
        id: 'plustek-escan-a280',
        manufacturer: 'plustek',
        model: 'eScan A280',
        type: 'network',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 3000,
        speed: 25,
        interface: ['Ethernet', 'WiFi'],
        paperSizes: ['A4', 'Letter'],
        features: ['Standalone', 'Touchscreen', 'Cloud Ready'],
        keywords: ['escan', 'a280', 'network'],
    },

    // ============ Avision Scanners ============
    {
        id: 'avision-ad240',
        manufacturer: 'avision',
        model: 'AD240',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 60,
        duplex: true,
        dailyDuty: 4000,
        speed: 40,
        interface: ['USB 2.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Workgroup', 'Compact'],
        keywords: ['avision', 'ad240'],
    },
    {
        id: 'avision-ad345',
        manufacturer: 'avision',
        model: 'AD345',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 100,
        duplex: true,
        dailyDuty: 10000,
        speed: 60,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['High Volume', 'Ultrasonic Detection'],
        keywords: ['avision', 'ad345'],
    },
    {
        id: 'avision-an335w',
        manufacturer: 'avision',
        model: 'AN335W',
        type: 'network',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 5000,
        speed: 35,
        interface: ['Ethernet', 'WiFi'],
        paperSizes: ['A4', 'Letter'],
        features: ['Network Standalone', 'Touchscreen'],
        keywords: ['avision', 'an335w', 'network'],
    },

    // ============ Panasonic Scanners ============
    {
        id: 'panasonic-kv-s1037x',
        manufacturer: 'panasonic',
        model: 'KV-S1037X',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 50,
        duplex: true,
        dailyDuty: 3000,
        speed: 30,
        interface: ['USB 3.0', 'Ethernet', 'WiFi'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Network Ready', 'Compact'],
        keywords: ['panasonic', 'kv-s1037x'],
    },
    {
        id: 'panasonic-kv-s1057c',
        manufacturer: 'panasonic',
        model: 'KV-S1057C',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 100,
        duplex: true,
        dailyDuty: 6000,
        speed: 65,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['Workgroup', 'Ultrasonic Detection'],
        keywords: ['panasonic', 'kv-s1057c'],
    },

    // ============ Visioneer Scanners ============
    {
        id: 'visioneer-patriot-h80',
        manufacturer: 'visioneer',
        model: 'Patriot H80',
        type: 'sheetfed',
        maxDPI: 600,
        colorDepth: 48,
        adf: true,
        adfCapacity: 100,
        duplex: true,
        dailyDuty: 12000,
        speed: 80,
        interface: ['USB 3.0'],
        paperSizes: ['A4', 'Letter', 'Legal'],
        features: ['High Volume', 'Production'],
        keywords: ['visioneer', 'patriot', 'h80'],
    },
];

// أنماط التعرف على الماسحات من اسم TWAIN/WIA
export const SCANNER_PATTERNS = [
    // Canon
    { pattern: /canon.*lide.*400/i, scannerId: 'canon-lide-400' },
    { pattern: /canon.*lide.*300/i, scannerId: 'canon-lide-300' },
    { pattern: /canon.*dr[-\s]?c225/i, scannerId: 'canon-dr-c225ii' },
    { pattern: /canon.*dr[-\s]?c230/i, scannerId: 'canon-dr-c230' },
    { pattern: /canon.*dr[-\s]?m260/i, scannerId: 'canon-dr-m260' },
    { pattern: /canon.*dr[-\s]?g2140/i, scannerId: 'canon-dr-g2140' },
    { pattern: /canon.*p[-\s]?215/i, scannerId: 'canon-p-215ii' },
    { pattern: /imageformula.*dr[-\s]?c/i, scannerId: 'canon-dr-c225ii' },
    { pattern: /canoscan/i, scannerId: 'canon-lide-400' },

    // HP
    { pattern: /hp.*scanjet.*pro.*2500/i, scannerId: 'hp-scanjet-pro-2500' },
    { pattern: /hp.*scanjet.*pro.*3000/i, scannerId: 'hp-scanjet-pro-3000' },
    { pattern: /hp.*scanjet.*pro.*4500/i, scannerId: 'hp-scanjet-pro-4500' },
    { pattern: /hp.*scanjet.*enterprise.*5000/i, scannerId: 'hp-scanjet-enterprise-5000' },
    { pattern: /hp.*scanjet.*enterprise.*7000/i, scannerId: 'hp-scanjet-enterprise-7000' },
    { pattern: /hp.*scanjet.*n4000/i, scannerId: 'hp-scanjet-pro-n4000' },
    { pattern: /scanjet/i, scannerId: 'hp-scanjet-pro-2500' },

    // Epson
    { pattern: /epson.*perfection.*v39/i, scannerId: 'epson-perfection-v39' },
    { pattern: /epson.*perfection.*v600/i, scannerId: 'epson-perfection-v600' },
    { pattern: /epson.*ds[-\s]?530/i, scannerId: 'epson-ds-530ii' },
    { pattern: /epson.*ds[-\s]?570/i, scannerId: 'epson-ds-570w' },
    { pattern: /epson.*ds[-\s]?780/i, scannerId: 'epson-ds-780n' },
    { pattern: /epson.*ds[-\s]?870/i, scannerId: 'epson-ds-870' },
    { pattern: /workforce.*ds/i, scannerId: 'epson-ds-530ii' },
    { pattern: /epson.*perfection/i, scannerId: 'epson-perfection-v600' },

    // Brother
    { pattern: /brother.*ads[-\s]?1700/i, scannerId: 'brother-ads-1700w' },
    { pattern: /brother.*ads[-\s]?2700/i, scannerId: 'brother-ads-2700w' },
    { pattern: /brother.*ads[-\s]?3600/i, scannerId: 'brother-ads-3600w' },
    { pattern: /brother.*ads[-\s]?4700/i, scannerId: 'brother-ads-4700w' },
    { pattern: /brother.*ds[-\s]?740/i, scannerId: 'brother-ds-740d' },
    { pattern: /brother.*ds[-\s]?940/i, scannerId: 'brother-ds-940dw' },
    { pattern: /brother.*ads/i, scannerId: 'brother-ads-1700w' },

    // Fujitsu
    { pattern: /scansnap.*ix1600/i, scannerId: 'fujitsu-scansnap-ix1600' },
    { pattern: /scansnap.*ix1500/i, scannerId: 'fujitsu-scansnap-ix1500' },
    { pattern: /scansnap.*ix1400/i, scannerId: 'fujitsu-scansnap-ix1400' },
    { pattern: /scansnap.*ix100/i, scannerId: 'fujitsu-scansnap-ix100' },
    { pattern: /fujitsu.*sp[-\s]?1120/i, scannerId: 'fujitsu-sp-1120n' },
    { pattern: /fujitsu.*sp[-\s]?1130/i, scannerId: 'fujitsu-sp-1130n' },
    { pattern: /fujitsu.*fi[-\s]?7160/i, scannerId: 'fujitsu-fi-7160' },
    { pattern: /fujitsu.*fi[-\s]?7260/i, scannerId: 'fujitsu-fi-7260' },
    { pattern: /fujitsu.*fi[-\s]?7180/i, scannerId: 'fujitsu-fi-7180' },
    { pattern: /scansnap/i, scannerId: 'fujitsu-scansnap-ix1600' },
    { pattern: /fujitsu.*fi[-\s]?/i, scannerId: 'fujitsu-fi-7160' },

    // Kodak/Alaris
    { pattern: /kodak.*s2070/i, scannerId: 'kodak-s2070' },
    { pattern: /alaris.*s2070/i, scannerId: 'kodak-s2070' },
    { pattern: /alaris.*s2085/i, scannerId: 'kodak-s2085f' },
    { pattern: /kodak.*i3400/i, scannerId: 'kodak-i3400' },
    { pattern: /alaris/i, scannerId: 'kodak-s2070' },

    // Xerox
    { pattern: /xerox.*documate.*3220/i, scannerId: 'xerox-documate-3220' },
    { pattern: /xerox.*documate.*6440/i, scannerId: 'xerox-documate-6440' },
    { pattern: /documate/i, scannerId: 'xerox-documate-3220' },

    // Plustek
    { pattern: /plustek.*opticslim.*2610/i, scannerId: 'plustek-opticslim-2610' },
    { pattern: /plustek.*smartoffice.*ps186/i, scannerId: 'plustek-smartoffice-ps186' },
    { pattern: /plustek.*smartoffice.*ps388/i, scannerId: 'plustek-smartoffice-ps388u' },
    { pattern: /plustek.*escan.*a280/i, scannerId: 'plustek-escan-a280' },
    { pattern: /plustek/i, scannerId: 'plustek-smartoffice-ps186' },

    // Avision
    { pattern: /avision.*ad240/i, scannerId: 'avision-ad240' },
    { pattern: /avision.*ad345/i, scannerId: 'avision-ad345' },
    { pattern: /avision.*an335/i, scannerId: 'avision-an335w' },
    { pattern: /avision/i, scannerId: 'avision-ad240' },

    // Panasonic
    { pattern: /panasonic.*kv[-\s]?s1037/i, scannerId: 'panasonic-kv-s1037x' },
    { pattern: /panasonic.*kv[-\s]?s1057/i, scannerId: 'panasonic-kv-s1057c' },
    { pattern: /panasonic/i, scannerId: 'panasonic-kv-s1037x' },

    // Visioneer
    { pattern: /visioneer.*patriot.*h80/i, scannerId: 'visioneer-patriot-h80' },
    { pattern: /visioneer/i, scannerId: 'visioneer-patriot-h80' },

    // Ricoh
    { pattern: /ricoh/i, scannerId: 'ricoh-sp-1130n' },
];

/**
 * التعرف على الماسح من اسم TWAIN/WIA
 * @param {string} deviceName - اسم الجهاز من نظام التشغيل
 * @returns {Object|null} - معلومات الماسح أو null
 */
export function identifyScanner(deviceName) {
    if (!deviceName) return null;

    // البحث في أنماط التعرف
    for (const pattern of SCANNER_PATTERNS) {
        if (pattern.pattern.test(deviceName)) {
            const scanner = SCANNER_DATABASE.find(s => s.id === pattern.scannerId);
            if (scanner) {
                const manufacturer = SCANNER_MANUFACTURERS[scanner.manufacturer.toUpperCase()];
                return {
                    ...scanner,
                    manufacturerInfo: manufacturer,
                    typeInfo: SCANNER_TYPES[scanner.type.toUpperCase()],
                    detectedFrom: deviceName,
                    confidence: calculateConfidence(deviceName, scanner),
                };
            }
        }
    }

    // البحث في الكلمات المفتاحية
    const deviceLower = deviceName.toLowerCase();
    for (const scanner of SCANNER_DATABASE) {
        for (const keyword of scanner.keywords) {
            if (deviceLower.includes(keyword.toLowerCase())) {
                const manufacturer = SCANNER_MANUFACTURERS[scanner.manufacturer.toUpperCase()];
                return {
                    ...scanner,
                    manufacturerInfo: manufacturer,
                    typeInfo: SCANNER_TYPES[scanner.type.toUpperCase()],
                    detectedFrom: deviceName,
                    confidence: 0.7,
                };
            }
        }
    }

    // محاولة التعرف على الشركة المصنعة على الأقل
    for (const [key, manufacturer] of Object.entries(SCANNER_MANUFACTURERS)) {
        if (deviceLower.includes(manufacturer.name.toLowerCase()) ||
            deviceLower.includes(manufacturer.id.toLowerCase())) {
            return {
                id: 'unknown',
                manufacturer: manufacturer.id,
                model: deviceName,
                type: 'unknown',
                manufacturerInfo: manufacturer,
                detectedFrom: deviceName,
                confidence: 0.5,
                isUnknownModel: true,
            };
        }
    }

    return null;
}

/**
 * حساب نسبة الثقة في التعرف
 */
function calculateConfidence(deviceName, scanner) {
    const deviceLower = deviceName.toLowerCase();
    const modelLower = scanner.model.toLowerCase();

    // تطابق كامل = 1.0
    if (deviceLower.includes(modelLower)) return 1.0;

    // تطابق جزئي
    const modelParts = modelLower.split(/[\s\-]+/);
    const matchCount = modelParts.filter(part => deviceLower.includes(part)).length;

    return Math.min(0.95, 0.6 + (matchCount / modelParts.length) * 0.35);
}

/**
 * البحث في قاعدة بيانات الماسحات
 * @param {Object} filters - معايير البحث
 */
export function searchScanners(filters = {}) {
    let results = [...SCANNER_DATABASE];

    // تصفية حسب الشركة المصنعة
    if (filters.manufacturer) {
        results = results.filter(s => s.manufacturer === filters.manufacturer);
    }

    // تصفية حسب النوع
    if (filters.type) {
        results = results.filter(s => s.type === filters.type);
    }

    // تصفية حسب وجود ADF
    if (filters.hasAdf !== undefined) {
        results = results.filter(s => s.adf === filters.hasAdf);
    }

    // تصفية حسب الدوبلكس
    if (filters.hasDuplex !== undefined) {
        results = results.filter(s => s.duplex === filters.hasDuplex);
    }

    // تصفية حسب السرعة
    if (filters.minSpeed) {
        results = results.filter(s => s.speed >= filters.minSpeed);
    }

    // تصفية حسب الموصى بها
    if (filters.recommended) {
        results = results.filter(s => s.recommended);
    }

    // البحث بالنص
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(s =>
            s.model.toLowerCase().includes(searchLower) ||
            s.keywords.some(k => k.includes(searchLower))
        );
    }

    // ترتيب النتائج
    if (filters.sortBy) {
        results.sort((a, b) => {
            switch (filters.sortBy) {
                case 'speed':
                    return (b.speed || 0) - (a.speed || 0);
                case 'dpi':
                    return (b.maxDPI || 0) - (a.maxDPI || 0);
                case 'capacity':
                    return (b.adfCapacity || 0) - (a.adfCapacity || 0);
                case 'name':
                default:
                    return a.model.localeCompare(b.model);
            }
        });
    }

    // إضافة معلومات الشركة المصنعة
    return results.map(scanner => ({
        ...scanner,
        manufacturerInfo: SCANNER_MANUFACTURERS[scanner.manufacturer.toUpperCase()],
        typeInfo: SCANNER_TYPES[scanner.type.toUpperCase()],
    }));
}

/**
 * الحصول على الماسحات الموصى بها
 */
export function getRecommendedScanners() {
    return searchScanners({ recommended: true });
}

/**
 * الحصول على ماسح بالمعرف
 */
export function getScannerById(id) {
    const scanner = SCANNER_DATABASE.find(s => s.id === id);
    if (!scanner) return null;

    return {
        ...scanner,
        manufacturerInfo: SCANNER_MANUFACTURERS[scanner.manufacturer.toUpperCase()],
        typeInfo: SCANNER_TYPES[scanner.type.toUpperCase()],
    };
}

export default {
    SCANNER_MANUFACTURERS,
    SCANNER_TYPES,
    SCANNER_DATABASE,
    identifyScanner,
    searchScanners,
    getRecommendedScanners,
    getScannerById,
};
