/**
 * نموذج رقم (2) - مذكرة استلام
 * Receipt Memo - Final Receipt
 * وفقاً لقواعد وإجراءات المستودعات الحكومية
 */
import PrintableForm, {
  FormHeader,
  FormMeta,
  FormTable,
  FormSignatures,
  FormNotes,
  FormTotal,
} from '../PrintableForm';
import { resolveSignatures } from '../../../lib/signatureResolver';

const DEFAULT_SIGNATURES = [
  { role: 'المسلم' },
  { role: 'مأمور عهدة ساحة الاستلام' },
  { role: 'أمين المستودع / مأمور العهدة' },
  { role: 'مدير إدارة المستودعات' },
];

const TABLE_COLUMNS = [
  {
    key: 'rowNumber',
    label: 'م',
    className: 'col-num',
    render: (_row, idx) => idx + 1,
  },
  {
    key: 'itemCode',
    label: 'رقم الصنف',
    className: 'col-code',
  },
  {
    key: 'itemName',
    label: 'اسم الصنف ووصفه',
    render: (row) => {
      if (row.description) {
        return `${row.itemName} - ${row.description}`;
      }
      return row.itemName;
    },
  },
  {
    key: 'unit',
    label: 'الوحدة',
    className: 'col-unit',
  },
  {
    key: 'quantity',
    label: 'الكمية',
    className: 'col-qty',
  },
  {
    key: 'unitPrice',
    label: 'سعر الوحدة',
    className: 'col-price',
  },
  {
    key: 'totalPrice',
    label: 'إجمالي القيمة',
    className: 'col-total',
  },
  {
    key: 'notes',
    label: 'ملاحظات',
    className: 'col-notes',
  },
];

export default function Form02_ReceiptMemo({ data = {} }) {
  const {
    documentNumber,
    date,
    hijriDate,
    entityName,
    supplierName,
    contractNumber,
    purchaseOrderNumber,
    purchaseOrderDate,
    receiptNoteNumber,
    tempReceiptNumber,
    inspectionReportNumber,
    warehouseName,
    items = [],
    totalAmount,
    totalAmountText,
    notes,
    signatures,
  } = data;

  const metaFields = [
    { label: 'رقم مذكرة الاستلام', value: receiptNoteNumber },
    { label: 'التاريخ', value: date },
    { label: 'المورد', value: supplierName },
    { label: 'رقم العقد/المناقصة', value: contractNumber },
    { label: 'رقم أمر الشراء', value: purchaseOrderNumber },
    { label: 'تاريخ أمر الشراء', value: purchaseOrderDate },
    { label: 'رقم إشعار الاستلام المؤقت', value: tempReceiptNumber },
    { label: 'رقم محضر الفحص', value: inspectionReportNumber },
    { label: 'المستودع', value: warehouseName, fullWidth: true },
  ];

  const totalItems = [
    { label: 'المبلغ الإجمالي', value: totalAmount },
    { label: 'المبلغ كتابة', value: totalAmountText },
  ];

  return (
    <PrintableForm
      formNumber={2}
      entityName={entityName}
      documentNumber={documentNumber}
    >
      <FormHeader
        formNumber={2}
        entityName={entityName}
        documentNumber={documentNumber}
        date={date}
        hijriDate={hijriDate}
      />

      <FormMeta fields={metaFields} />

      <FormTable
        columns={TABLE_COLUMNS}
        rows={items}
        emptyRows={3}
      />

      <FormTotal items={totalItems} />

      {notes && <FormNotes value={notes} />}

      <FormSignatures
        signatures={signatures || resolveSignatures(DEFAULT_SIGNATURES, data, {
          roles: data.roles,
          employeeSignatures: data._employeeSignatures || {},
        })}
        columns={4}
      />
    </PrintableForm>
  );
}
