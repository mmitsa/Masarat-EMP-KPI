export const VALID_EXCEL_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet',
];

export function generateExcelXML({ template, category, organizationName }) {
    const fields = template.fields;

    const headerRow = fields.map(f => `<Cell ss:StyleID="Header"><Data ss:Type="String">${f.label}</Data></Cell>`).join('\n');
    const exampleRow = fields.map(f => {
        const type = f.type === 'number' ? 'Number' : 'String';
        return `<Cell ss:StyleID="Data"><Data ss:Type="${type}">${f.example || ''}</Data></Cell>`;
    }).join('\n');

    const notesRow = fields.map(f => {
        let note = f.required ? '(مطلوب) ' : '(اختياري) ';
        if (f.note) note += f.note + ' ';
        if (f.options) note += 'القيم المتاحة: ' + f.options.join('، ');
        return `<Cell ss:StyleID="Note"><Data ss:Type="String">${note}</Data></Cell>`;
    }).join('\n');

    const emptyRows = Array(20).fill(null).map(() =>
        `<Row>${fields.map(() => `<Cell ss:StyleID="Data"><Data ss:Type="String"></Data></Cell>`).join('\n')}</Row>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${template.name} - ${organizationName || 'منصة مسارات'}</Title>
  <Author>منصة مسارات</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Arial" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="16" ss:Bold="1" ss:Color="#1a365d"/>
   <Interior ss:Color="#e2e8f0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Arial" ss:Size="12" ss:Color="#4a5568"/>
   <Interior ss:Color="#f7fafc" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#2563eb" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1e40af"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1e40af"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1e40af"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1e40af"/>
   </Borders>
  </Style>
  <Style ss:ID="Note">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Arial" ss:Size="9" ss:Italic="1" ss:Color="#718096"/>
   <Interior ss:Color="#f0fdf4" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Data">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Arial" ss:Size="11" ss:Color="#1a202c"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
   </Borders>
  </Style>
  <Style ss:ID="Example">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Arial" ss:Size="11" ss:Italic="1" ss:Color="#3182ce"/>
   <Interior ss:Color="#ebf8ff" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${template.name}">
  <Table ss:DefaultRowHeight="25" ss:DefaultColumnWidth="120">
   ${fields.map((f, i) => `<Column ss:Index="${i + 1}" ss:AutoFitWidth="1" ss:Width="${Math.max(120, f.label.length * 12)}"/>`).join('\n')}
   <Row ss:Height="40">
    <Cell ss:StyleID="Title" ss:MergeAcross="${fields.length - 1}">
     <Data ss:Type="String">${category?.icon || ''} قالب ${template.name} - ${organizationName || 'منصة مسارات'}</Data>
    </Cell>
   </Row>
   <Row ss:Height="30">
    <Cell ss:StyleID="SubTitle" ss:MergeAcross="${fields.length - 1}">
     <Data ss:Type="String">${template.description}${template.required ? ' (مطلوب)' : ' (اختياري)'}</Data>
    </Cell>
   </Row>
   <Row ss:Height="5"></Row>
   <Row ss:Height="35">
    ${headerRow}
   </Row>
   <Row ss:Height="50">
    ${notesRow}
   </Row>
   <Row ss:Height="25">
    ${exampleRow}
   </Row>
   ${emptyRows}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="تعليمات">
  <Table>
   <Column ss:Width="500"/>
   <Row ss:Height="30">
    <Cell ss:StyleID="Title"><Data ss:Type="String">تعليمات ملء القالب</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">1. يرجى ملء البيانات بدءاً من الصف السابع (بعد صف المثال)</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">2. الحقول المطلوبة يجب تعبئتها وإلا سيتم رفض الملف</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">3. يرجى الالتزام بصيغة التاريخ: YYYY-MM-DD (مثال: 2026-01-15)</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">4. للحقول ذات القيم المحددة، يرجى استخدام القيم المذكورة فقط</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">5. لا تقم بتغيير أسماء الأعمدة أو ترتيبها</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">6. يمكنك حذف صف المثال قبل الرفع</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">للدعم الفني: support@masarat.sa</Data></Cell></Row>
  </Table>
 </Worksheet>
</Workbook>`;
}

export function downloadExcelTemplate({ template, category, organizationName, toast }) {
    const xmlContent = generateExcelXML({ template, category, organizationName });
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blobWithBom = new Blob([bom, xmlContent], {
        type: 'application/vnd.ms-excel;charset=utf-8'
    });

    const url = URL.createObjectURL(blobWithBom);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${organizationName || 'Masarat'}_${template.id}_template.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (toast?.success) {
        toast.success(`تم تحميل قالب "${template.name}" بنجاح`);
    }
}
