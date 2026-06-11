/**
 * نموذج رقم (10) - مستند صرف أصناف رجيع
 * Government Form #10 - Returned Items Dispensing Document
 * وفقاً لقواعد وإجراءات المستودعات الحكومية
 */
import PrintableForm, { FormHeader, FormMeta, FormTable, FormSignatures, FormNotes } from '../PrintableForm';
import { resolveSignatures } from '../../../lib/signatureResolver';

const EMPTY_ROWS = 2;

const DEFAULT_SIGNATURES = [
  { role: 'أمين المستودع' },
  { role: 'المستلم' },
  { role: 'مدير إدارة المستودعات' },
];

const TABLE_COLUMNS = [
  { key: 'itemNumber', label: 'م', className: 'col-num' },
  { key: 'itemCode', label: 'رقم الصنف', className: 'col-code' },
  { key: 'itemName', label: 'اسم الصنف' },
  { key: 'unit', label: 'الوحدة', className: 'col-unit' },
  { key: 'quantity', label: 'الكمية', className: 'col-qty' },
  { key: 'condition', label: 'الحالة' },
  { key: 'estimatedValue', label: 'القيمة التقديرية', className: 'col-price' },
  { key: 'dispenseMethod', label: 'طريقة التصرف' },
  { key: 'notes', label: 'ملاحظات' },
];

export default function Form10_ReturnDispense({ data = {} }) {
  const {
    documentNumber,
    date,
    hijriDate,
    entityName,
    dispenseNumber,
    returnDocNumber,
    dispenseType,
    recipientName,
    approvalNumber,
    approvalDate,
    items = [],
    notes,
    signatures,
  } = data;

  const metaFields = [
    { label: 'رقم مستند الصرف', value: dispenseNumber },
    { label: 'التاريخ', value: date },
    { label: 'رقم مستند الإرجاع', value: returnDocNumber },
    { label: 'نوع التصرف', value: dispenseType },
    { label: 'الجهة المستلمة', value: recipientName },
    { label: 'رقم الموافقة', value: approvalNumber },
  ];

  const tableRows = items.map((item, idx) => ({
    ...item,
    itemNumber: item.itemNumber ?? idx + 1,
  }));

  const formSignatures = signatures || resolveSignatures(DEFAULT_SIGNATURES, data, {
    roles: data.roles,
    employeeSignatures: data._employeeSignatures || {},
  });

  return (
    <PrintableForm
      formNumber={10}
      entityName={entityName}
      documentNumber={documentNumber}
    >
      <FormHeader
        formNumber={10}
        entityName={entityName}
        documentNumber={documentNumber}
        date={date}
        hijriDate={hijriDate}
      />

      <FormMeta fields={metaFields} />

      <FormTable
        columns={TABLE_COLUMNS}
        rows={tableRows}
        emptyRows={EMPTY_ROWS}
      />

      {notes && <FormNotes value={notes} />}

      <FormSignatures signatures={formSignatures} columns={3} />
    </PrintableForm>
  );
}
