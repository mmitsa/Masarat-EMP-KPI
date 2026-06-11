/**
 * نموذج رقم (1) - إشعار استلام مؤقت لأصناف تحت الفحص
 * Temporary Receipt Notice for Items Under Inspection
 * وفقاً لقواعد وإجراءات المستودعات الحكومية - ديوان المحاسبة
 */
import PrintableForm, {
  FormHeader,
  FormMeta,
  FormTable,
  FormSignatures,
  FormNotes,
} from '../PrintableForm';
import { resolveSignatures } from '../../../lib/signatureResolver';

const FORM_NUMBER = 1;

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
    key: 'itemNameDesc',
    label: 'اسم الصنف ووصفه',
    render: (row) => {
      const name = row.itemName || '';
      const desc = row.description || '';
      if (!desc) return name;
      return `${name} - ${desc}`;
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
    key: 'notes',
    label: 'ملاحظات',
    className: 'col-notes',
  },
];

const EMPTY_ROWS_COUNT = 3;

export default function Form01_TempReceipt({ data = {} }) {
  const {
    documentNumber,
    date,
    hijriDate,
    entityName,
    supplierName,
    contractNumber,
    purchaseOrderNumber,
    purchaseOrderDate,
    invoiceNumber,
    invoiceDate,
    warehouseName,
    items = [],
    notes,
    signatures,
  } = data;

  const metaFields = [
    { label: 'الرقم الخاص', value: documentNumber },
    { label: 'التاريخ', value: date },
    { label: 'المورد', value: supplierName },
    { label: 'رقم العقد/المناقصة', value: contractNumber },
    { label: 'رقم أمر الشراء', value: purchaseOrderNumber },
    { label: 'تاريخ أمر الشراء', value: purchaseOrderDate },
    { label: 'رقم الفاتورة', value: invoiceNumber },
    { label: 'تاريخ الفاتورة', value: invoiceDate },
    { label: 'المستودع', value: warehouseName, fullWidth: true },
  ];

  return (
    <PrintableForm
      formNumber={FORM_NUMBER}
      entityName={entityName}
      documentNumber={documentNumber}
    >
      <FormHeader
        formNumber={FORM_NUMBER}
        entityName={entityName}
        documentNumber={documentNumber}
        date={date}
        hijriDate={hijriDate}
      />

      <FormMeta fields={metaFields} />

      <FormTable
        columns={TABLE_COLUMNS}
        rows={items}
        emptyRows={EMPTY_ROWS_COUNT}
      />

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
