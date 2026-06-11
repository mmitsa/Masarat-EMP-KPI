/**
 * نموذج رقم (6) - محضر فحص ومعاينة
 * Inspection and Examination Report
 * وفقاً لقواعد وإجراءات المستودعات الحكومية
 */
import PrintableForm, { FormHeader, FormMeta, FormTable, FormSignatures, FormNotes } from '../PrintableForm';

export default function Form06_InspectionReport({ data = {} }) {
  const {
    documentNumber,
    date,
    hijriDate,
    entityName,
    tempReceiptNumber,
    tempReceiptDate,
    supplierName,
    contractNumber,
    committeeMembers = [],
    inspectionResult,
    inspectionNotes,
    items = [],
    recommendations,
    notes,
    signatures,
  } = data;

  // Meta fields
  const metaFields = [
    { label: 'رقم المحضر', value: documentNumber },
    { label: 'التاريخ', value: date },
    { label: 'رقم إشعار الاستلام المؤقت', value: tempReceiptNumber },
    { label: 'تاريخ الاستلام المؤقت', value: tempReceiptDate },
    { label: 'المورد', value: supplierName },
    { label: 'رقم العقد/المناقصة', value: contractNumber },
  ];

  // Table columns
  const columns = [
    { key: 'itemNumber', label: 'م', className: 'col-num' },
    { key: 'itemCode', label: 'رقم الصنف', className: 'col-code' },
    {
      key: 'fullDescription',
      label: 'اسم الصنف ووصفه بالكامل',
      render: (row) => row.fullDescription || row.itemName || '',
    },
    { key: 'deviceNumber', label: 'رقم الجهاز' },
    { key: 'typeAndYear', label: 'النوع وسنة الصنع' },
    { key: 'unit', label: 'الوحدة', className: 'col-unit' },
    { key: 'quantity', label: 'الكمية', className: 'col-qty' },
    { key: 'unitPrice', label: 'سعر الوحدة', className: 'col-price' },
    { key: 'totalPrice', label: 'مجموع القيمة', className: 'col-total' },
    {
      key: 'location',
      label: 'المبنى/الدور/الغرفة/القسم',
    },
    { key: 'notes', label: 'ملاحظات' },
  ];

  // Rows with sequential numbering
  const rows = items.map((item, idx) => ({
    ...item,
    itemNumber: item.itemNumber || idx + 1,
  }));

  // Build signatures from committee members if available, otherwise use defaults
  const signatureBlocks = signatures
    ? signatures
    : committeeMembers.length > 0
      ? committeeMembers.map((member, idx) => ({
          role: idx === 0 ? 'رئيس اللجنة' : 'عضو اللجنة',
          name: member.name,
          title: member.title,
        }))
      : [
          { role: 'رئيس اللجنة' },
          { role: 'عضو اللجنة' },
          { role: 'عضو اللجنة' },
        ];

  const signaturesColumnCount = signatureBlocks.length >= 4 ? 4 : 3;

  return (
    <PrintableForm formNumber={6} entityName={entityName} documentNumber={documentNumber}>
      <FormHeader
        formNumber={6}
        entityName={entityName}
        documentNumber={documentNumber}
        date={date}
        hijriDate={hijriDate}
      />

      <FormMeta fields={metaFields} />

      {/* Committee Members Section */}
      <div className="gov-form-meta" style={{ marginBottom: '12px' }}>
        <div className="gov-form-meta-row gov-form-meta-full">
          <span className="gov-form-meta-label" style={{ fontWeight: 700, fontSize: '11px' }}>أعضاء لجنة الفحص والمعاينة:</span>
        </div>
        {(committeeMembers || []).map((member, idx) => (
          <div key={idx} className="gov-form-meta-row">
            <span className="gov-form-meta-label">{idx + 1}. {member.name}</span>
            <span className="gov-form-meta-value">{member.title} - {member.role}</span>
          </div>
        ))}
      </div>

      <FormTable
        columns={columns}
        rows={rows}
        emptyRows={2}
      />

      {/* Inspection Result Section */}
      <div className="gov-form-meta" style={{ marginTop: '12px' }}>
        <div className="gov-form-meta-row gov-form-meta-full">
          <span className="gov-form-meta-label">نتيجة الفحص:</span>
          <span className="gov-form-meta-value" style={{ fontWeight: 700 }}>{inspectionResult || ''}</span>
        </div>
        {recommendations && (
          <div className="gov-form-meta-row gov-form-meta-full">
            <span className="gov-form-meta-label">توصيات اللجنة:</span>
            <span className="gov-form-meta-value">{recommendations}</span>
          </div>
        )}
      </div>

      {(notes || inspectionNotes) && (
        <FormNotes value={notes || inspectionNotes} />
      )}

      <FormSignatures
        signatures={signatureBlocks}
        columns={signaturesColumnCount}
      />
    </PrintableForm>
  );
}
