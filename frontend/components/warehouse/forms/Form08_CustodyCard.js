/**
 * نموذج رقم (8) - بطاقة عهدة
 * Government Form #8 - Custody Card
 * وفقاً لقواعد وإجراءات المستودعات الحكومية
 */
import PrintableForm, { FormHeader, FormMeta, FormTable, FormSignatures, FormNotes } from '../PrintableForm';
import { resolveSignatures } from '../../../lib/signatureResolver';

const EMPTY_ROWS = 2;

const DEFAULT_SIGNATURES = [
  { role: 'الموظف المستلم' },
  { role: 'أمين المستودع' },
  { role: 'مدير إدارة المستودعات' },
];

const TABLE_COLUMNS = [
  { key: 'itemNumber', label: 'م', className: 'col-num' },
  { key: 'itemCode', label: 'رقم الصنف', className: 'col-code' },
  { key: 'itemName', label: 'اسم الصنف' },
  { key: 'itemType', label: 'النوع' },
  { key: 'description', label: 'الوصف' },
  { key: 'unitPrice', label: 'سعر الوحدة', className: 'col-price' },
  { key: 'usefulLife', label: 'العمر الافتراضي' },
  { key: 'receiptDate', label: 'تاريخ الاستلام' },
  { key: 'depreciationRate', label: 'معدل الاستهلاك' },
  { key: 'quantity', label: 'الكمية', className: 'col-qty' },
  { key: 'recipientSignature', label: 'توقيع المستلم' },
];

export default function Form08_CustodyCard({ data = {} }) {
  const {
    documentNumber,
    date,
    hijriDate,
    entityName,
    employeeName,
    employeeNumber,
    department,
    section,
    jobTitle,
    items = [],
    notes,
    signatures,
  } = data;

  const metaFields = [
    { label: 'اسم الموظف', value: employeeName },
    { label: 'الرقم الوظيفي', value: employeeNumber },
    { label: 'الإدارة', value: department },
    { label: 'القسم', value: section },
    { label: 'المسمى الوظيفي', value: jobTitle, fullWidth: true },
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
      formNumber={8}
      entityName={entityName}
      documentNumber={documentNumber}
    >
      <FormHeader
        formNumber={8}
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
