/**
 * نموذج رقم (11) - استمارة الجرد
 * Government Form #11 - Inventory Count Form
 * وفقاً لقواعد وإجراءات المستودعات الحكومية
 */
import PrintableForm, { FormHeader, FormMeta, FormTable, FormSignatures, FormNotes } from '../PrintableForm';
import { resolveSignatures } from '../../../lib/signatureResolver';

const EMPTY_ROWS = 3;

const DEFAULT_SIGNATURES = [
  { role: 'رئيس لجنة الجرد' },
  { role: 'عضو اللجنة' },
  { role: 'أمين المستودع' },
];

const TABLE_COLUMNS = [
  { key: 'itemNumber', label: 'م', className: 'col-num' },
  { key: 'itemCode', label: 'رقم الصنف', className: 'col-code' },
  { key: 'itemName', label: 'اسم الصنف' },
  { key: 'unit', label: 'الوحدة', className: 'col-unit' },
  { key: 'bookBalance', label: 'الرصيد الدفتري', className: 'col-qty' },
  { key: 'actualBalance', label: 'الرصيد الفعلي', className: 'col-qty' },
  { key: 'shortage', label: 'النقص', className: 'col-qty' },
  { key: 'surplus', label: 'الزيادة', className: 'col-qty' },
  { key: 'notes', label: 'ملاحظات', className: 'col-notes' },
];

export default function Form11_InventoryForm({ data = {} }) {
  const {
    documentNumber,
    date,
    hijriDate,
    entityName,
    inventoryNumber,
    inventoryDate,
    inventoryType,
    warehouseName,
    committeeMembers = [],
    items = [],
    totalShortage,
    totalSurplus,
    notes,
    signatures,
  } = data;

  const metaFields = [
    { label: 'رقم الجرد', value: inventoryNumber },
    { label: 'تاريخ الجرد', value: inventoryDate },
    { label: 'نوع الجرد', value: inventoryType },
    { label: 'المستودع', value: warehouseName },
  ];

  const tableRows = items.map((item, idx) => ({
    ...item,
    itemNumber: item.itemNumber ?? idx + 1,
  }));

  // Build signatures from committee members if available, otherwise use defaults
  const baseSignatures = committeeMembers.length > 0
    ? committeeMembers.map((member, idx) => ({
        role: idx === 0 ? 'رئيس لجنة الجرد' : 'عضو اللجنة',
        name: member.name,
        title: member.title,
      }))
    : DEFAULT_SIGNATURES;

  const formSignatures = signatures || resolveSignatures(baseSignatures, data, {
    roles: data.roles,
    employeeSignatures: data._employeeSignatures || {},
  });

  const signaturesColumnCount = formSignatures.length >= 4 ? 4 : 3;

  return (
    <PrintableForm
      formNumber={11}
      entityName={entityName}
      documentNumber={documentNumber}
    >
      <FormHeader
        formNumber={11}
        entityName={entityName}
        documentNumber={documentNumber}
        date={date}
        hijriDate={hijriDate}
      />

      <FormMeta fields={metaFields} />

      {/* Committee Members Section */}
      {committeeMembers.length > 0 && (
        <div className="gov-form-meta" style={{ marginBottom: '12px' }}>
          <div className="gov-form-meta-row gov-form-meta-full">
            <span className="gov-form-meta-label" style={{ fontWeight: 700, fontSize: '11px' }}>أعضاء لجنة الجرد:</span>
          </div>
          {committeeMembers.map((member, idx) => (
            <div key={idx} className="gov-form-meta-row">
              <span className="gov-form-meta-label">{idx + 1}. {member.name}</span>
              <span className="gov-form-meta-value">{member.title}</span>
            </div>
          ))}
        </div>
      )}

      <FormTable
        columns={TABLE_COLUMNS}
        rows={tableRows}
        emptyRows={EMPTY_ROWS}
      />

      {/* Totals Section */}
      <div className="gov-form-total">
        <span><strong>إجمالي النقص:</strong> {totalShortage || 0}</span>
        <span><strong>إجمالي الزيادة:</strong> {totalSurplus || 0}</span>
      </div>

      {notes && <FormNotes value={notes} />}

      <FormSignatures signatures={formSignatures} columns={signaturesColumnCount} />
    </PrintableForm>
  );
}
