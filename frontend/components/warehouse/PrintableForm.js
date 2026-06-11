/**
 * PrintableForm - مكون مشترك لطباعة النماذج الحكومية الرسمية
 * وفقاً لقواعد وإجراءات المستودعات الحكومية - ديوان المحاسبة
 */
import { useRef, useCallback } from 'react';

const FORM_TITLES = {
  1: 'إشعار استلام مؤقت لأصناف تحت الفحص',
  2: 'مذكرة استلام',
  3: 'محضر استلام',
  4: 'بطاقة صنف',
  5: 'بطاقة مراقبة الصنف',
  6: 'محضر فحص ومعاينة',
  7: 'طلب صرف مواد',
  8: 'بطاقة عهدة',
  9: 'مستند إرجاع',
  10: 'مستند صرف أصناف رجيع',
  11: 'استمارة الجرد',
};

export default function PrintableForm({
  formNumber,
  entityName = '',
  documentNumber = '',
  isDraft = false,
  children,
  onBeforePrint,
  showActions = true,
  signaturesCount = 4,
  customTitle,
}) {
  const formRef = useRef(null);

  const handlePrint = useCallback(() => {
    if (onBeforePrint) onBeforePrint();
    window.print();
  }, [onBeforePrint]);

  const handleSavePdf = useCallback(async () => {
    if (onBeforePrint) onBeforePrint();

    const element = formRef.current;
    if (!element) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);

      const fileName = `نموذج_${formNumber}_${documentNumber || 'جديد'}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback: use print dialog with "Save as PDF"
      window.print();
    }
  }, [formNumber, documentNumber, onBeforePrint]);

  const title = customTitle || FORM_TITLES[formNumber] || '';

  return (
    <>
      {showActions && (
        <div className="gov-form-actions no-print">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            طباعة
          </button>
          <button
            onClick={handleSavePdf}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            حفظ PDF
          </button>
        </div>
      )}

      <div
        ref={formRef}
        className={`gov-form ${isDraft ? 'gov-form-draft' : ''}`}
        id="printable-form"
      >
        {children}
      </div>
    </>
  );
}

/** Header رسمي للنموذج */
export function FormHeader({ formNumber, entityName, documentNumber, date, customTitle, hijriDate }) {
  const title = customTitle || FORM_TITLES[formNumber] || '';

  return (
    <div className="gov-form-header">
      <div className="gov-form-header-right">
        <div className="gov-form-country">المملكة العربية السعودية</div>
        <div className="gov-form-entity">{entityName || '(اسم الجهة الحكومية)'}</div>
      </div>
      <div className="gov-form-header-center">
        <div className="gov-form-title">{title}</div>
        <div className="gov-form-number">نموذج رقم ({formNumber})</div>
        {documentNumber && (
          <div className="gov-form-subtitle">رقم المستند: {documentNumber}</div>
        )}
      </div>
      <div className="gov-form-header-left">
        {date && <div className="gov-form-subtitle">التاريخ: {date}</div>}
        {hijriDate && <div className="gov-form-subtitle">التاريخ الهجري: {hijriDate}</div>}
      </div>
    </div>
  );
}

/** حقول معلومات النموذج (meta) */
export function FormMeta({ fields }) {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="gov-form-meta">
      {fields.map((field, idx) => (
        <div
          key={idx}
          className={`gov-form-meta-row ${field.fullWidth ? 'gov-form-meta-full' : ''}`}
        >
          <span className="gov-form-meta-label">{field.label}:</span>
          <span className="gov-form-meta-value">{field.value || ''}</span>
        </div>
      ))}
    </div>
  );
}

/** جدول الأصناف */
export function FormTable({ columns, rows, showTotal = false, totalLabel = 'الإجمالي', totalValue, emptyRows = 0 }) {
  return (
    <table className="gov-form-table">
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} className={col.className || ''} style={col.width ? { width: col.width } : {}}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {columns.map((col, colIdx) => (
              <td key={colIdx} className={col.className || ''}>
                {col.render ? col.render(row, rowIdx) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
        {/* صفوف فارغة للطباعة */}
        {Array.from({ length: emptyRows }).map((_, idx) => (
          <tr key={`empty-${idx}`} className="empty-row">
            {columns.map((col, colIdx) => (
              <td key={colIdx} className={col.className || ''}>&nbsp;</td>
            ))}
          </tr>
        ))}
        {showTotal && (
          <tr className="total-row">
            <td colSpan={columns.length - 1} style={{ textAlign: 'left', fontWeight: 700 }}>
              {totalLabel}
            </td>
            <td style={{ textAlign: 'center', fontWeight: 700 }}>
              {totalValue}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/** قسم التوقيعات - يدعم التوقيع الإلكتروني وصور التوقيع */
export function FormSignatures({ signatures, columns = 4 }) {
  return (
    <div className={`gov-form-signatures ${columns === 3 ? 'gov-form-signatures-3col' : ''}`}>
      {signatures.map((sig, idx) => (
        <div key={idx} className="gov-form-signature-block">
          <div className="gov-form-signature-role">{sig.role}</div>
          {sig.name && (
            <div className="gov-form-signature-field">
              <span className="gov-form-signature-label">الاسم:</span>
              <span className="gov-form-signature-value">{sig.name}</span>
            </div>
          )}
          {sig.title && (
            <div className="gov-form-signature-field">
              <span className="gov-form-signature-label">الصفة:</span>
              <span className="gov-form-signature-value">{sig.title}</span>
            </div>
          )}
          <div className="gov-form-signature-field">
            <span className="gov-form-signature-label">التوقيع:</span>
            {sig.signatureImageUrl ? (
              <img
                src={sig.signatureImageUrl}
                alt={`توقيع ${sig.name || sig.role}`}
                className="gov-form-signature-image"
              />
            ) : (
              <span className="gov-form-signature-value"></span>
            )}
          </div>
          {sig.isElectronic && sig.approvedAt && (
            <div className="gov-form-signature-electronic">
              تم التوقيع إلكترونياً
              <br />
              {new Date(sig.approvedAt).toLocaleString('ar-SA')}
            </div>
          )}
          <div className="gov-form-signature-field">
            <span className="gov-form-signature-label">التاريخ:</span>
            <span className="gov-form-signature-value">{sig.date || ''}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** قسم الملاحظات */
export function FormNotes({ label = 'ملاحظات', value = '' }) {
  return (
    <div className="gov-form-notes">
      <div className="gov-form-notes-label">{label}:</div>
      <div>{value}</div>
    </div>
  );
}

/** صف المجموع الكلي */
export function FormTotal({ items }) {
  return (
    <div className="gov-form-total">
      {items.map((item, idx) => (
        <span key={idx}>
          <strong>{item.label}:</strong> {item.value}
        </span>
      ))}
    </div>
  );
}

export { FORM_TITLES };
