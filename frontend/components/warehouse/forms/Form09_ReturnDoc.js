/**
 * نموذج رقم (9) - مستند إرجاع
 * Government Form #9 - Return Document
 * وفقاً لقواعد وإجراءات المستودعات الحكومية
 */
import PrintableForm, { FormHeader, FormMeta, FormTable, FormSignatures, FormNotes } from '../PrintableForm';
import { resolveSignatures } from '../../../lib/signatureResolver';

const EMPTY_ROWS = 3;

const DEFAULT_SIGNATURES = [
  { role: 'الموظف المرجع' },
  { role: 'أمين المستودع' },
  { role: 'رئيس لجنة الفحص' },
  { role: 'مدير إدارة المستودعات' },
];

const TABLE_COLUMNS = [
  { key: 'itemNumber', label: 'م', className: 'col-num' },
  { key: 'itemCode', label: 'رقم الصنف', className: 'col-code' },
  { key: 'itemName', label: 'اسم الصنف' },
  { key: 'unit', label: 'الوحدة', className: 'col-unit' },
  { key: 'quantity', label: 'الكمية', className: 'col-qty' },
  { key: 'condition', label: 'حالة الصنف' },
  { key: 'notes', label: 'ملاحظات', className: 'col-notes' },
];

export default function Form09_ReturnDoc({ data = {} }) {
  const {
    documentNumber,
    date,
    hijriDate,
    entityName,
    returnNumber,
    returningDepartment,
    returningEmployee,
    returnReason,
    items = [],
    committeeRecommendations,
    notes,
    signatures,
  } = data;

  const metaFields = [
    { label: 'رقم مستند الإرجاع', value: returnNumber },
    { label: 'التاريخ', value: date },
    { label: 'الإدارة المرجعة', value: returningDepartment },
    { label: 'اسم الموظف المرجع', value: returningEmployee },
    { label: 'سبب الإرجاع', value: returnReason, fullWidth: true },
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
      formNumber={9}
      entityName={entityName}
      documentNumber={documentNumber}
    >
      <FormHeader
        formNumber={9}
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

      {committeeRecommendations && (
        <div className="gov-form-notes">
          <div className="gov-form-notes-label">توصيات اللجنة:</div>
          <div>{committeeRecommendations}</div>
        </div>
      )}

      {notes && <FormNotes value={notes} />}

      <FormSignatures signatures={formSignatures} columns={4} />
    </PrintableForm>
  );
}
