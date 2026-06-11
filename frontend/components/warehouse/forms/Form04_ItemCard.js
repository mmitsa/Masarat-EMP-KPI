/**
 * نموذج رقم (4) - بطاقة صنف
 * Item Card - for tracking item movements in/out of warehouse
 * وفقاً لقواعد وإجراءات المستودعات الحكومية
 */
import PrintableForm, { FormHeader, FormTable } from '../PrintableForm';

const TABLE_COLUMNS = [
  {
    key: 'date',
    label: 'التاريخ',
  },
  {
    key: 'description',
    label: 'البيان/الوصف',
  },
  {
    key: 'documentRef',
    label: 'رقم المستند',
  },
  {
    key: 'incoming',
    label: 'وارد',
    className: 'col-qty',
  },
  {
    key: 'outgoing',
    label: 'منصرف',
    className: 'col-qty',
  },
  {
    key: 'balance',
    label: 'الرصيد',
    className: 'col-qty',
  },
  {
    key: 'notes',
    label: 'ملاحظات',
    className: 'col-notes',
  },
];

export default function Form04_ItemCard({ data = {} }) {
  const {
    documentNumber,
    date,
    hijriDate,
    entityName,
    itemCode,
    itemName,
    itemDescription,
    unit,
    warehouseName,
    location,
    minQuantity,
    maxQuantity,
    reorderPoint,
    movements = [],
  } = data;

  return (
    <PrintableForm
      formNumber={4}
      entityName={entityName}
      documentNumber={documentNumber}
    >
      <FormHeader
        formNumber={4}
        entityName={entityName}
        documentNumber={documentNumber}
        date={date}
        hijriDate={hijriDate}
      />

      <div className="gov-form-card-header">
        {/* Row 1 */}
        <div className="gov-form-card-field">
          <span className="gov-form-card-label">رقم الصنف:</span>
          <span>{itemCode}</span>
        </div>
        <div className="gov-form-card-field">
          <span className="gov-form-card-label">اسم الصنف:</span>
          <span>{itemName}</span>
        </div>
        <div className="gov-form-card-field">
          <span className="gov-form-card-label">الوحدة:</span>
          <span>{unit}</span>
        </div>

        {/* Row 2 */}
        <div className="gov-form-card-field">
          <span className="gov-form-card-label">المستودع:</span>
          <span>{warehouseName}</span>
        </div>
        <div className="gov-form-card-field">
          <span className="gov-form-card-label">الموقع/الرف:</span>
          <span>{location}</span>
        </div>
        <div className="gov-form-card-field" />

        {/* Row 3 */}
        <div className="gov-form-card-field">
          <span className="gov-form-card-label">الحد الأدنى:</span>
          <span>{minQuantity}</span>
        </div>
        <div className="gov-form-card-field">
          <span className="gov-form-card-label">الحد الأعلى:</span>
          <span>{maxQuantity}</span>
        </div>
        <div className="gov-form-card-field">
          <span className="gov-form-card-label">نقطة إعادة الطلب:</span>
          <span>{reorderPoint}</span>
        </div>
      </div>

      <FormTable
        columns={TABLE_COLUMNS}
        rows={movements}
        emptyRows={3}
      />
    </PrintableForm>
  );
}
