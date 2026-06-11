/**
 * تصدير جميع النماذج الحكومية الرسمية للمستودعات
 * 11 نموذج وفقاً لقواعد وإجراءات المستودعات الحكومية - ديوان المحاسبة
 */
export { default as Form01_TempReceipt } from './Form01_TempReceipt';
export { default as Form02_ReceiptMemo } from './Form02_ReceiptMemo';
export { default as Form03_ReceiptRecord } from './Form03_ReceiptRecord';
export { default as Form04_ItemCard } from './Form04_ItemCard';
export { default as Form05_ItemMonitorCard } from './Form05_ItemMonitorCard';
export { default as Form06_InspectionReport } from './Form06_InspectionReport';
export { default as Form07_MaterialRequest } from './Form07_MaterialRequest';
export { default as Form08_CustodyCard } from './Form08_CustodyCard';
export { default as Form09_ReturnDoc } from './Form09_ReturnDoc';
export { default as Form10_ReturnDispense } from './Form10_ReturnDispense';
export { default as Form11_InventoryForm } from './Form11_InventoryForm';

/** خريطة النماذج حسب الرقم */
export const FORM_COMPONENTS = {
  1: 'Form01_TempReceipt',
  2: 'Form02_ReceiptMemo',
  3: 'Form03_ReceiptRecord',
  4: 'Form04_ItemCard',
  5: 'Form05_ItemMonitorCard',
  6: 'Form06_InspectionReport',
  7: 'Form07_MaterialRequest',
  8: 'Form08_CustodyCard',
  9: 'Form09_ReturnDoc',
  10: 'Form10_ReturnDispense',
  11: 'Form11_InventoryForm',
};

/** معلومات النماذج */
export const FORM_INFO = [
  { number: 1, name: 'إشعار استلام مؤقت لأصناف تحت الفحص', category: 'استلام', screen: 'temp-receive' },
  { number: 2, name: 'مذكرة استلام', category: 'استلام', screen: 'receipt-note' },
  { number: 3, name: 'محضر استلام', category: 'استلام', screen: 'receipt-note' },
  { number: 4, name: 'بطاقة صنف', category: 'أصناف', screen: 'item-card' },
  { number: 5, name: 'بطاقة مراقبة الصنف', category: 'أصناف', screen: 'item-card' },
  { number: 6, name: 'محضر فحص ومعاينة', category: 'فحص', screen: 'temp-receive' },
  { number: 7, name: 'طلب صرف مواد', category: 'صرف', screen: 'exchange-request' },
  { number: 8, name: 'بطاقة عهدة', category: 'عهد', screen: 'employee-custody' },
  { number: 9, name: 'مستند إرجاع', category: 'إرجاع', screen: 'return-requests' },
  { number: 10, name: 'مستند صرف أصناف رجيع', category: 'إرجاع', screen: 'return-requests' },
  { number: 11, name: 'استمارة الجرد', category: 'جرد', screen: 'inventory-form' },
];
