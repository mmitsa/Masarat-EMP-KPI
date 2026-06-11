/**
 * نموذج رقم (3) - محضر استلام
 * Receipt Record - for items used directly without storage
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
  { role: 'المسلم (المقاول/المورد)' },
  { role: 'المستلم (الجهة المستفيدة)' },
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

export default function Form03_ReceiptRecord({ data = {} }) {
  const {
    documentNumber,
    date,
    hijriDate,
    entityName,
    supplierName,
    contractNumber,
    projectName,
    projectNumber,
    deliveryLocation,
    purchaseOrderNumber,
    purchaseOrderDate,
    items = [],
    totalAmount,
    totalAmountText,
    notes,
    signatures,
  } = data;

  const metaFields = [
    { label: 'رقم المحضر', value: documentNumber },
    { label: 'التاريخ', value: date },
    { label: 'المورد/المقاول', value: supplierName },
    { label: 'رقم العقد/المناقصة', value: contractNumber },
    { label: 'اسم المشروع/المقاولة', value: projectName },
    { label: 'رقم المشروع', value: projectNumber },
    { label: 'موقع التسليم', value: deliveryLocation, fullWidth: true },
  ];

  const totalItems = [
    { label: 'المبلغ الإجمالي', value: totalAmount },
    { label: 'المبلغ كتابة', value: totalAmountText },
  ];

  return (
    <PrintableForm
      formNumber={3}
      entityName={entityName}
      documentNumber={documentNumber}
    >
      <FormHeader
        formNumber={3}
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
        columns={3}
      />
    </PrintableForm>
  );
}
