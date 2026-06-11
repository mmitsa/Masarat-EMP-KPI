/**
 * نموذج رقم (7) - طلب صرف مواد
 * Government Form #7 - Material Dispensing Request
 * وفقاً لقواعد وإجراءات المستودعات الحكومية
 */
import PrintableForm, { FormHeader, FormMeta, FormTable, FormSignatures, FormNotes } from '../PrintableForm';
import { resolveSignatures } from '../../../lib/signatureResolver';

const EMPTY_ROWS = 3;

const DEFAULT_SIGNATURES = [
  { role: 'الطالب' },
  { role: 'مدير الإدارة الطالبة' },
  { role: 'أمين المستودع' },
  { role: 'مدير إدارة المستودعات' },
];

const TABLE_COLUMNS = [
  { key: 'itemNumber', label: 'م', className: 'col-num' },
  { key: 'itemCode', label: 'رقم الصنف', className: 'col-code' },
  { key: 'itemName', label: 'اسم الصنف' },
  { key: 'unit', label: 'الوحدة', className: 'col-unit' },
  { key: 'requestedQty', label: 'الكمية المطلوبة', className: 'col-qty' },
  { key: 'approvedQty', label: 'الكمية المعتمدة', className: 'col-qty' },
  { key: 'dispensedQty', label: 'الكمية المنصرفة', className: 'col-qty' },
  { key: 'notes', label: 'ملاحظات', className: 'col-notes' },
];

export default function Form07_MaterialRequest({ data = {} }) {
  const {
    documentNumber,
    date,
    hijriDate,
    entityName,
    requestNumber,
    requestDate,
    departmentName,
    requesterName,
    purpose,
    urgency,
    items = [],
    notes,
    signatures,
  } = data;

  const metaFields = [
    { label: 'رقم الطلب', value: requestNumber },
    { label: 'التاريخ', value: requestDate || date },
    { label: 'الإدارة/القسم الطالب', value: departmentName },
    { label: 'اسم الطالب', value: requesterName },
    { label: 'الغرض من الصرف', value: purpose, fullWidth: true },
    { label: 'درجة الاستعجال', value: urgency },
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
      formNumber={7}
      entityName={entityName}
      documentNumber={documentNumber}
    >
      <FormHeader
        formNumber={7}
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

      <FormNotes value={notes} />

      <FormSignatures signatures={formSignatures} columns={4} />
    </PrintableForm>
  );
}
