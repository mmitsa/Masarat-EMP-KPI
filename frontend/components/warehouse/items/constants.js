// ==================== ثوابت إدارة الأصناف ====================

// أنواع الأصناف (مستديم/مستهلك)
export const ITEM_TYPES = {
    1: { label: 'مستديم', variant: 'blue', desc: 'يتطلب عهدة', icon: '📦' },
    2: { label: 'مستهلك', variant: 'green', desc: 'لا يتطلب عهدة', icon: '📋' },
};

// أنواع العهدة
export const CUSTODY_TYPES = {
    1: { label: 'شخصية', variant: 'purple' },
    2: { label: 'إدارية', variant: 'cyan' },
};

// فئات الأصناف (عادي/سيارة/معدة)
export const ITEM_CATEGORIES = {
    regular: { label: 'أصناف عادية', value: 'regular', icon: '📋', color: 'blue' },
    vehicle: { label: 'سيارة', value: 'vehicle', icon: '🚗', color: 'purple' },
    equipment: { label: 'معدة', value: 'equipment', icon: '⚙️', color: 'orange' },
};

// أنواع الوقود
export const FUEL_TYPES = [
    { value: 'gasoline', label: 'بنزين' },
    { value: 'diesel', label: 'ديزل' },
    { value: 'electric', label: 'كهربائي' },
    { value: 'hybrid', label: 'هجين' },
];

// ألوان المركبات
export const VEHICLE_COLORS = [
    { value: 'white', label: 'أبيض' },
    { value: 'black', label: 'أسود' },
    { value: 'silver', label: 'فضي' },
    { value: 'gray', label: 'رمادي' },
    { value: 'red', label: 'أحمر' },
    { value: 'blue', label: 'أزرق' },
    { value: 'green', label: 'أخضر' },
    { value: 'beige', label: 'بيج' },
    { value: 'other', label: 'أخرى' },
];

// حالات السيريال
export const SERIAL_STATUSES = {
    available: { label: 'متاح', variant: 'success' },
    in_custody: { label: 'تحت العهدة', variant: 'primary' },
    returned: { label: 'مُرجع', variant: 'warning' },
    damaged: { label: 'تالف', variant: 'danger' },
};

// السنوات المالية الهجرية
export const FISCAL_YEARS = [
    { value: '1448', label: '1448 هـ' },
    { value: '1447', label: '1447 هـ' },
    { value: '1446', label: '1446 هـ' },
    { value: '1445', label: '1445 هـ' },
];

// الحقول الإلزامية لبيانات السيارة
export const VEHICLE_REQUIRED_FIELDS = ['licensePlate', 'chassisNumber', 'engineNumber', 'modelYear'];

// الحقول الإلزامية لبيانات المعدة
export const EQUIPMENT_REQUIRED_FIELDS = ['equipmentSerial', 'modelNumber'];

// formData الأولي
export const INITIAL_FORM_DATA = {
    itemName: '',
    itemDescription: '',
    groupId: '',
    itemType: '',
    custodyType: '',
    unitId: '',
    lowQuantity: 0,
    lastPrice: 0,
    lowPrice: 0,
    highPrice: 0,
    expiryDate: '',
    notes: '',
    hasQRCode: true,
    // جديد
    category: 'regular',
    model: '',
    countryOfOrigin: '',
    manufacturer: '',
    productionDate: '',
    vehicleData: {
        licensePlate: '',
        chassisNumber: '',
        engineNumber: '',
        modelYear: '',
        color: '',
        fuelType: '',
        engineCapacity: '',
        insuranceExpiry: '',
        registrationExpiry: '',
    },
    equipmentData: {
        equipmentSerial: '',
        modelNumber: '',
        specifications: '',
        powerRating: '',
        weight: '',
        dimensions: '',
        warrantyExpiry: '',
        calibrationDate: '',
    },
};

// فحص اكتمال بيانات السيارة
export const isVehicleDataComplete = (vehicleData) => {
    if (!vehicleData) return false;
    return VEHICLE_REQUIRED_FIELDS.every(field => vehicleData[field]?.toString().trim());
};

// فحص اكتمال بيانات المعدة
export const isEquipmentDataComplete = (equipmentData) => {
    if (!equipmentData) return false;
    return EQUIPMENT_REQUIRED_FIELDS.every(field => equipmentData[field]?.toString().trim());
};
