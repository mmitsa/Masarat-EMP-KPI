using System;
using System.IO;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Reflection;
using System.Diagnostics;
using System.Globalization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Masarat.Core.Services.Reporting;

/// <summary>
/// خدمة إنشاء التقارير - PDF و Excel
/// Report Generation Service Implementation
/// </summary>
public class ReportService : IReportService
{
    private readonly ReportSettings _settings;
    private readonly ILogger<ReportService> _logger;

    public ReportService(
        IOptions<ReportSettings> settings,
        ILogger<ReportService> logger)
    {
        _settings = settings.Value;
        _logger = logger;

        // Ensure directories exist
        EnsureDirectoriesExist();
    }

    public async Task<ReportResult> GeneratePdfAsync<T>(ReportDefinition<T> definition) where T : class
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            // Validate
            var validation = ValidateDefinition(definition);
            if (!validation.isValid)
            {
                return new ReportResult
                {
                    Success = false,
                    ErrorMessage = validation.error
                };
            }

            // Generate HTML content
            var html = GenerateHtmlReport(definition);

            // Convert HTML to PDF using wkhtmltopdf or similar
            var pdfBytes = await ConvertHtmlToPdfAsync(html, definition.Options);

            if (pdfBytes == null || pdfBytes.Length == 0)
            {
                return new ReportResult
                {
                    Success = false,
                    ErrorMessage = "Failed to generate PDF. فشل إنشاء ملف PDF."
                };
            }

            stopwatch.Stop();

            var fileName = $"{definition.FileName}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";

            _logger.LogInformation("PDF report generated: {FileName}, Size: {Size} bytes, Time: {Time}ms",
                fileName, pdfBytes.Length, stopwatch.ElapsedMilliseconds);

            return new ReportResult
            {
                Success = true,
                Content = new MemoryStream(pdfBytes),
                FileName = fileName,
                ContentType = "application/pdf",
                Size = pdfBytes.Length,
                GenerationTimeMs = stopwatch.ElapsedMilliseconds,
                Metadata = new Dictionary<string, string>
                {
                    { "RowCount", definition.Data.Count().ToString() },
                    { "ColumnCount", definition.Columns.Count.ToString() }
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF report");
            stopwatch.Stop();
            return new ReportResult
            {
                Success = false,
                ErrorMessage = $"Error generating PDF: {ex.Message}",
                GenerationTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
    }

    public async Task<ReportResult> GenerateExcelAsync<T>(ReportDefinition<T> definition) where T : class
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            // Validate
            var validation = ValidateDefinition(definition);
            if (!validation.isValid)
            {
                return new ReportResult
                {
                    Success = false,
                    ErrorMessage = validation.error
                };
            }

            // Generate Excel using basic XML (Office Open XML format)
            var excelBytes = await GenerateExcelBytesAsync(definition);

            if (excelBytes == null || excelBytes.Length == 0)
            {
                return new ReportResult
                {
                    Success = false,
                    ErrorMessage = "Failed to generate Excel. فشل إنشاء ملف Excel."
                };
            }

            stopwatch.Stop();

            var fileName = $"{definition.FileName}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

            _logger.LogInformation("Excel report generated: {FileName}, Size: {Size} bytes, Time: {Time}ms",
                fileName, excelBytes.Length, stopwatch.ElapsedMilliseconds);

            return new ReportResult
            {
                Success = true,
                Content = new MemoryStream(excelBytes),
                FileName = fileName,
                ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                Size = excelBytes.Length,
                GenerationTimeMs = stopwatch.ElapsedMilliseconds,
                Metadata = new Dictionary<string, string>
                {
                    { "RowCount", definition.Data.Count().ToString() },
                    { "ColumnCount", definition.Columns.Count.ToString() }
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating Excel report");
            stopwatch.Stop();
            return new ReportResult
            {
                Success = false,
                ErrorMessage = $"Error generating Excel: {ex.Message}",
                GenerationTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
    }

    public async Task<ReportResult> GenerateCsvAsync<T>(ReportDefinition<T> definition) where T : class
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var validation = ValidateDefinition(definition);
            if (!validation.isValid)
            {
                return new ReportResult
                {
                    Success = false,
                    ErrorMessage = validation.error
                };
            }

            var csv = GenerateCsvContent(definition);
            var csvBytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();

            stopwatch.Stop();

            var fileName = $"{definition.FileName}_{DateTime.Now:yyyyMMdd_HHmmss}.csv";

            return new ReportResult
            {
                Success = true,
                Content = new MemoryStream(csvBytes),
                FileName = fileName,
                ContentType = "text/csv; charset=utf-8",
                Size = csvBytes.Length,
                GenerationTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating CSV report");
            stopwatch.Stop();
            return new ReportResult
            {
                Success = false,
                ErrorMessage = $"Error generating CSV: {ex.Message}",
                GenerationTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
    }

    public async Task<ReportResult> GenerateFromTemplateAsync<T>(string templateName, T data, ReportFormat format) where T : class
    {
        // This would load a template from disk and merge with data
        // For now, return not implemented
        _logger.LogWarning("Template-based report generation is not yet implemented");

        return await Task.FromResult(new ReportResult
        {
            Success = false,
            ErrorMessage = "Template-based reports not yet implemented. التقارير المبنية على القوالب غير متاحة حالياً."
        });
    }

    public async Task<ReportResult> GenerateTableReportAsync<T>(TableReportDefinition<T> definition) where T : class
    {
        // For table reports, use the standard PDF/Excel generation with additional features
        return await GeneratePdfAsync(definition);
    }

    public async Task<ReportResult> MergePdfsAsync(IEnumerable<Stream> pdfStreams, string outputFileName)
    {
        // PDF merging would require a PDF library
        // This is a placeholder implementation
        _logger.LogWarning("PDF merging is not yet implemented");

        return await Task.FromResult(new ReportResult
        {
            Success = false,
            ErrorMessage = "PDF merging not yet implemented. دمج ملفات PDF غير متاح حالياً."
        });
    }

    public Task<IEnumerable<ReportTemplate>> GetAvailableTemplatesAsync()
    {
        var templates = new List<ReportTemplate>
        {
            new ReportTemplate
            {
                Name = "employee_list",
                Description = "Employee list report",
                DescriptionAr = "تقرير قائمة الموظفين",
                SupportedFormats = new List<ReportFormat> { ReportFormat.Pdf, ReportFormat.Excel, ReportFormat.Csv },
                Category = "hr"
            },
            new ReportTemplate
            {
                Name = "attendance_summary",
                Description = "Attendance summary report",
                DescriptionAr = "تقرير ملخص الحضور",
                SupportedFormats = new List<ReportFormat> { ReportFormat.Pdf, ReportFormat.Excel },
                Category = "hr"
            },
            new ReportTemplate
            {
                Name = "inventory_list",
                Description = "Inventory list report",
                DescriptionAr = "تقرير قائمة المخزون",
                SupportedFormats = new List<ReportFormat> { ReportFormat.Pdf, ReportFormat.Excel, ReportFormat.Csv },
                Category = "warehouse"
            },
            new ReportTemplate
            {
                Name = "financial_statement",
                Description = "Financial statement report",
                DescriptionAr = "تقرير القوائم المالية",
                SupportedFormats = new List<ReportFormat> { ReportFormat.Pdf },
                Category = "finance"
            }
        };

        return Task.FromResult<IEnumerable<ReportTemplate>>(templates);
    }

    #region HTML Generation

    private string GenerateHtmlReport<T>(ReportDefinition<T> definition) where T : class
    {
        var options = definition.Options;
        var isRtl = options.Direction == TextDirection.Rtl;
        var dir = isRtl ? "rtl" : "ltr";
        var align = isRtl ? "right" : "left";

        var html = new StringBuilder();

        html.AppendLine("<!DOCTYPE html>");
        html.AppendLine($"<html dir='{dir}' lang='{options.Language}'>");
        html.AppendLine("<head>");
        html.AppendLine("<meta charset='UTF-8'>");
        html.AppendLine($"<title>{definition.Title}</title>");
        html.AppendLine(GenerateCss(options));
        html.AppendLine("</head>");
        html.AppendLine("<body>");

        // Header
        html.AppendLine("<div class='header'>");
        if (options.ShowLogo && !string.IsNullOrEmpty(options.LogoPath))
        {
            html.AppendLine($"<img src='{options.LogoPath}' class='logo' alt='Logo' />");
        }
        html.AppendLine($"<h1>{definition.Title}</h1>");
        if (!string.IsNullOrEmpty(definition.Subtitle))
        {
            html.AppendLine($"<h2 class='subtitle'>{definition.Subtitle}</h2>");
        }
        if (options.ShowDate)
        {
            var dateFormat = options.Language == "ar" ? "yyyy/MM/dd HH:mm" : "dd/MM/yyyy HH:mm";
            html.AppendLine($"<p class='date'>{DateTime.Now.ToString(dateFormat)}</p>");
        }
        if (!string.IsNullOrEmpty(options.OrganizationName))
        {
            html.AppendLine($"<p class='org-name'>{options.OrganizationName}</p>");
        }
        html.AppendLine("</div>");

        // Applied Filters
        if (definition.AppliedFilters != null && definition.AppliedFilters.Count > 0)
        {
            html.AppendLine("<div class='filters'>");
            html.AppendLine($"<h3>{(options.Language == "ar" ? "الفلاتر المطبقة" : "Applied Filters")}:</h3>");
            html.AppendLine("<ul>");
            foreach (var filter in definition.AppliedFilters)
            {
                html.AppendLine($"<li><strong>{filter.Key}:</strong> {filter.Value}</li>");
            }
            html.AppendLine("</ul>");
            html.AppendLine("</div>");
        }

        // Summary (before table)
        if (definition.Summary != null &&
            (definition.Summary.Position == SummaryPosition.BeforeTable || definition.Summary.Position == SummaryPosition.Both))
        {
            html.AppendLine(GenerateSummaryHtml(definition.Summary, options));
        }

        // Table
        html.AppendLine("<table class='data-table'>");

        // Table Header
        html.AppendLine("<thead><tr>");
        foreach (var column in definition.Columns.Where(c => !c.IsHidden))
        {
            var header = options.Language == "ar" ? column.Header : (column.HeaderEn ?? column.Header);
            var widthStyle = !string.IsNullOrEmpty(column.Width) ? $" style='width:{column.Width}'" : "";
            html.AppendLine($"<th{widthStyle}>{header}</th>");
        }
        html.AppendLine("</tr></thead>");

        // Table Body
        html.AppendLine("<tbody>");
        var rowIndex = 0;
        foreach (var item in definition.Data)
        {
            var rowClass = options.AlternateRowColors && rowIndex % 2 == 1 ? " class='even-row'" : "";
            html.AppendLine($"<tr{rowClass}>");

            foreach (var column in definition.Columns.Where(c => !c.IsHidden))
            {
                var value = GetPropertyValue(item, column.PropertyName);
                var formattedValue = FormatValue(value, column, options);
                var alignClass = GetAlignmentClass(column.Alignment);
                html.AppendLine($"<td class='{alignClass}'>{formattedValue}</td>");
            }

            html.AppendLine("</tr>");
            rowIndex++;
        }
        html.AppendLine("</tbody>");

        // Totals row
        if (definition is TableReportDefinition<T> tableDefinition && tableDefinition.ShowTotals)
        {
            html.AppendLine(GenerateTotalsRow(definition, options));
        }

        html.AppendLine("</table>");

        // Summary (after table)
        if (definition.Summary != null &&
            (definition.Summary.Position == SummaryPosition.AfterTable || definition.Summary.Position == SummaryPosition.Both))
        {
            html.AppendLine(GenerateSummaryHtml(definition.Summary, options));
        }

        // Footer
        html.AppendLine("<div class='footer'>");
        if (options.ShowPageNumbers)
        {
            html.AppendLine($"<span class='page-info'>{(options.Language == "ar" ? "صفحة" : "Page")} <span class='pageNumber'></span></span>");
        }
        html.AppendLine($"<span class='total-rows'>{(options.Language == "ar" ? "إجمالي السجلات:" : "Total Records:")} {definition.Data.Count()}</span>");
        html.AppendLine("</div>");

        html.AppendLine("</body>");
        html.AppendLine("</html>");

        return html.ToString();
    }

    private string GenerateCss(ReportOptions options)
    {
        var isRtl = options.Direction == TextDirection.Rtl;

        return $@"
<style>
    @page {{
        size: {GetPageSizeString(options.PageSize)} {(options.Orientation == PageOrientation.Landscape ? "landscape" : "portrait")};
        margin: {options.Margins.Top}mm {options.Margins.Right}mm {options.Margins.Bottom}mm {options.Margins.Left}mm;
    }}

    body {{
        font-family: '{options.FontFamily}', 'Segoe UI', Arial, sans-serif;
        font-size: {options.FontSize}pt;
        direction: {(isRtl ? "rtl" : "ltr")};
        text-align: {(isRtl ? "right" : "left")};
        margin: 0;
        padding: 20px;
        color: #1e293b;
    }}

    .header {{
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid {options.HeaderColor};
        padding-bottom: 15px;
    }}

    .header h1 {{
        color: {options.HeaderColor};
        margin: 10px 0;
        font-size: 20pt;
    }}

    .header .subtitle {{
        color: #64748b;
        font-size: 12pt;
        margin: 5px 0;
    }}

    .header .date {{
        color: #94a3b8;
        font-size: 10pt;
    }}

    .header .org-name {{
        color: #475569;
        font-weight: bold;
    }}

    .logo {{
        height: {options.LogoHeight}px;
        margin-bottom: 10px;
    }}

    .filters {{
        background: #f8fafc;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
    }}

    .filters h3 {{
        margin: 0 0 10px 0;
        color: {options.HeaderColor};
    }}

    .filters ul {{
        margin: 0;
        padding-{(isRtl ? "right" : "left")}: 20px;
    }}

    .data-table {{
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
    }}

    .data-table th {{
        background: {options.HeaderColor};
        color: white;
        padding: 12px 8px;
        text-align: {(isRtl ? "right" : "left")};
        font-weight: bold;
        border: 1px solid {options.BorderColor};
    }}

    .data-table td {{
        padding: 10px 8px;
        border: 1px solid {options.BorderColor};
    }}

    .data-table .even-row {{
        background: {options.EvenRowColor};
    }}

    .data-table .totals-row {{
        background: #e2e8f0;
        font-weight: bold;
    }}

    .align-right {{ text-align: right; }}
    .align-left {{ text-align: left; }}
    .align-center {{ text-align: center; }}

    .summary {{
        background: #eff6ff;
        border: 1px solid {options.HeaderColor};
        border-radius: 8px;
        padding: 15px;
        margin: 20px 0;
    }}

    .summary h3 {{
        color: {options.HeaderColor};
        margin: 0 0 15px 0;
    }}

    .summary-item {{
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #dbeafe;
    }}

    .summary-item:last-child {{
        border-bottom: none;
    }}

    .summary-item.highlighted {{
        background: #dbeafe;
        padding: 8px;
        border-radius: 4px;
        margin: 5px 0;
    }}

    .footer {{
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid {options.BorderColor};
        display: flex;
        justify-content: space-between;
        color: #64748b;
        font-size: 9pt;
    }}

    @media print {{
        body {{ print-color-adjust: exact; -webkit-print-color-adjust: exact; }}
    }}
</style>";
    }

    private string GenerateSummaryHtml(ReportSummary summary, ReportOptions options)
    {
        var html = new StringBuilder();
        html.AppendLine("<div class='summary'>");
        html.AppendLine($"<h3>{summary.Title}</h3>");

        foreach (var item in summary.Items)
        {
            var highlightClass = item.IsHighlighted ? " highlighted" : "";
            var formattedValue = FormatSummaryValue(item, options);
            html.AppendLine($"<div class='summary-item{highlightClass}'>");
            html.AppendLine($"<span class='label'>{item.Label}</span>");
            html.AppendLine($"<span class='value'>{formattedValue}</span>");
            html.AppendLine("</div>");
        }

        html.AppendLine("</div>");
        return html.ToString();
    }

    private string GenerateTotalsRow<T>(ReportDefinition<T> definition, ReportOptions options) where T : class
    {
        var html = new StringBuilder();
        html.AppendLine("<tfoot><tr class='totals-row'>");

        var isFirst = true;
        foreach (var column in definition.Columns.Where(c => !c.IsHidden))
        {
            if (isFirst)
            {
                html.AppendLine($"<td>{(options.Language == "ar" ? "الإجمالي" : "Total")}</td>");
                isFirst = false;
            }
            else if (column.IsSummable)
            {
                var total = CalculateColumnTotal(definition.Data, column);
                var formattedTotal = FormatValue(total, column, options);
                html.AppendLine($"<td class='{GetAlignmentClass(column.Alignment)}'>{formattedTotal}</td>");
            }
            else
            {
                html.AppendLine("<td></td>");
            }
        }

        html.AppendLine("</tr></tfoot>");
        return html.ToString();
    }

    #endregion

    #region Excel Generation

    private async Task<byte[]> GenerateExcelBytesAsync<T>(ReportDefinition<T> definition) where T : class
    {
        // Generate a simple Excel-compatible HTML that Excel can open
        // For production, use EPPlus or similar library

        var html = new StringBuilder();
        html.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        html.AppendLine("<?mso-application progid=\"Excel.Sheet\"?>");
        html.AppendLine("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\"");
        html.AppendLine(" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">");
        html.AppendLine("<Styles>");
        html.AppendLine("<Style ss:ID=\"Header\"><Font ss:Bold=\"1\" ss:Color=\"#FFFFFF\"/><Interior ss:Color=\"#1d4ed8\" ss:Pattern=\"Solid\"/></Style>");
        html.AppendLine("<Style ss:ID=\"Currency\"><NumberFormat ss:Format=\"#,##0.00\"/></Style>");
        html.AppendLine("</Styles>");
        html.AppendLine($"<Worksheet ss:Name=\"{definition.Title}\">");
        html.AppendLine("<Table>");

        // Header row
        html.AppendLine("<Row>");
        foreach (var column in definition.Columns.Where(c => !c.IsHidden))
        {
            var header = definition.Options.Language == "ar" ? column.Header : (column.HeaderEn ?? column.Header);
            html.AppendLine($"<Cell ss:StyleID=\"Header\"><Data ss:Type=\"String\">{EscapeXml(header)}</Data></Cell>");
        }
        html.AppendLine("</Row>");

        // Data rows
        foreach (var item in definition.Data)
        {
            html.AppendLine("<Row>");
            foreach (var column in definition.Columns.Where(c => !c.IsHidden))
            {
                var value = GetPropertyValue(item, column.PropertyName);
                var (cellType, cellValue) = GetExcelCellValue(value, column);
                var styleAttr = column.DataType == ColumnDataType.Currency ? " ss:StyleID=\"Currency\"" : "";
                html.AppendLine($"<Cell{styleAttr}><Data ss:Type=\"{cellType}\">{EscapeXml(cellValue)}</Data></Cell>");
            }
            html.AppendLine("</Row>");
        }

        html.AppendLine("</Table>");
        html.AppendLine("</Worksheet>");
        html.AppendLine("</Workbook>");

        return await Task.FromResult(Encoding.UTF8.GetBytes(html.ToString()));
    }

    private (string type, string value) GetExcelCellValue(object? value, ColumnDefinition column)
    {
        if (value == null)
            return ("String", "");

        return column.DataType switch
        {
            ColumnDataType.Number or ColumnDataType.Currency or ColumnDataType.Percentage =>
                ("Number", Convert.ToString(value, CultureInfo.InvariantCulture) ?? "0"),
            ColumnDataType.Date or ColumnDataType.DateTime =>
                value is DateTime dt ? ("DateTime", dt.ToString("yyyy-MM-ddTHH:mm:ss")) : ("String", value.ToString() ?? ""),
            ColumnDataType.Boolean =>
                ("String", value is bool b ? (b ? "نعم" : "لا") : value.ToString() ?? ""),
            _ => ("String", value.ToString() ?? "")
        };
    }

    #endregion

    #region CSV Generation

    private string GenerateCsvContent<T>(ReportDefinition<T> definition) where T : class
    {
        var csv = new StringBuilder();
        var options = definition.Options;

        // Header row
        var headers = definition.Columns
            .Where(c => !c.IsHidden)
            .Select(c => EscapeCsv(options.Language == "ar" ? c.Header : (c.HeaderEn ?? c.Header)));
        csv.AppendLine(string.Join(",", headers));

        // Data rows
        foreach (var item in definition.Data)
        {
            var values = definition.Columns
                .Where(c => !c.IsHidden)
                .Select(c =>
                {
                    var value = GetPropertyValue(item, c.PropertyName);
                    var formatted = FormatValue(value, c, options);
                    return EscapeCsv(formatted);
                });
            csv.AppendLine(string.Join(",", values));
        }

        return csv.ToString();
    }

    private string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value))
            return "";

        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }

    #endregion

    #region PDF Conversion

    private async Task<byte[]?> ConvertHtmlToPdfAsync(string html, ReportOptions options)
    {
        // Try using wkhtmltopdf
        var tempHtmlPath = Path.Combine(_settings.TempDirectory, $"{Guid.NewGuid()}.html");
        var tempPdfPath = Path.Combine(_settings.TempDirectory, $"{Guid.NewGuid()}.pdf");

        try
        {
            // Write HTML to temp file
            await File.WriteAllTextAsync(tempHtmlPath, html, Encoding.UTF8);

            // Build wkhtmltopdf arguments
            var args = new StringBuilder();
            args.Append($"--encoding utf-8 ");
            args.Append($"--page-size {options.PageSize} ");
            args.Append($"--orientation {(options.Orientation == PageOrientation.Landscape ? "Landscape" : "Portrait")} ");
            args.Append($"--margin-top {options.Margins.Top}mm ");
            args.Append($"--margin-bottom {options.Margins.Bottom}mm ");
            args.Append($"--margin-left {options.Margins.Left}mm ");
            args.Append($"--margin-right {options.Margins.Right}mm ");
            args.Append("--enable-local-file-access ");
            args.Append($"\"{tempHtmlPath}\" \"{tempPdfPath}\"");

            var processInfo = new ProcessStartInfo
            {
                FileName = "wkhtmltopdf",
                Arguments = args.ToString(),
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processInfo };
            process.Start();

            await process.WaitForExitAsync();

            if (File.Exists(tempPdfPath))
            {
                return await File.ReadAllBytesAsync(tempPdfPath);
            }

            _logger.LogWarning("wkhtmltopdf failed, PDF file not created");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting HTML to PDF");

            // Fallback: Return HTML as a "PDF" (not ideal but works as fallback)
            return Encoding.UTF8.GetBytes(html);
        }
        finally
        {
            // Cleanup
            if (File.Exists(tempHtmlPath)) File.Delete(tempHtmlPath);
            if (File.Exists(tempPdfPath)) File.Delete(tempPdfPath);
        }
    }

    #endregion

    #region Helper Methods

    private void EnsureDirectoriesExist()
    {
        if (!Directory.Exists(_settings.TempDirectory))
        {
            Directory.CreateDirectory(_settings.TempDirectory);
        }

        if (!Directory.Exists(_settings.TemplatesDirectory))
        {
            Directory.CreateDirectory(_settings.TemplatesDirectory);
        }
    }

    private (bool isValid, string? error) ValidateDefinition<T>(ReportDefinition<T> definition) where T : class
    {
        if (string.IsNullOrEmpty(definition.Title))
        {
            return (false, "Report title is required. عنوان التقرير مطلوب.");
        }

        if (!definition.Columns.Any())
        {
            return (false, "At least one column is required. مطلوب عمود واحد على الأقل.");
        }

        var rowCount = definition.Data.Count();
        if (rowCount > _settings.MaxRows)
        {
            return (false, $"Data exceeds maximum allowed rows ({_settings.MaxRows}). البيانات تتجاوز الحد الأقصى للصفوف.");
        }

        return (true, null);
    }

    private static object? GetPropertyValue(object obj, string propertyName)
    {
        if (string.IsNullOrEmpty(propertyName))
            return null;

        // Support nested properties (e.g., "Department.Name")
        var parts = propertyName.Split('.');
        object? current = obj;

        foreach (var part in parts)
        {
            if (current == null)
                return null;

            var property = current.GetType().GetProperty(part, BindingFlags.Public | BindingFlags.Instance);
            if (property == null)
                return null;

            current = property.GetValue(current);
        }

        return current;
    }

    private string FormatValue(object? value, ColumnDefinition column, ReportOptions options)
    {
        if (value == null)
            return "-";

        if (column.CustomFormatter != null)
        {
            return column.CustomFormatter(value);
        }

        return column.DataType switch
        {
            ColumnDataType.Currency =>
                FormatCurrency(Convert.ToDecimal(value), options),
            ColumnDataType.Number =>
                FormatNumber(Convert.ToDecimal(value), column.Format, options),
            ColumnDataType.Percentage =>
                $"{Convert.ToDecimal(value):N2}%",
            ColumnDataType.Date =>
                value is DateTime dt ? dt.ToString(column.Format ?? "yyyy/MM/dd") : value.ToString() ?? "",
            ColumnDataType.DateTime =>
                value is DateTime dtt ? dtt.ToString(column.Format ?? "yyyy/MM/dd HH:mm") : value.ToString() ?? "",
            ColumnDataType.Boolean =>
                value is bool b ? (b ? (options.Language == "ar" ? "نعم" : "Yes") : (options.Language == "ar" ? "لا" : "No")) : value.ToString() ?? "",
            _ =>
                !string.IsNullOrEmpty(column.Format) ? string.Format($"{{0:{column.Format}}}", value) : value.ToString() ?? ""
        };
    }

    private string FormatCurrency(decimal value, ReportOptions options)
    {
        var formatted = value.ToString($"N{options.DecimalPlaces}");
        return $"{formatted} {options.CurrencySymbol}";
    }

    private string FormatNumber(decimal value, string? format, ReportOptions options)
    {
        if (!string.IsNullOrEmpty(format))
        {
            return value.ToString(format);
        }
        return value.ToString($"N{options.DecimalPlaces}");
    }

    private string FormatSummaryValue(SummaryItem item, ReportOptions options)
    {
        return item.ValueType switch
        {
            SummaryValueType.Currency =>
                decimal.TryParse(item.Value, out var cv) ? FormatCurrency(cv, options) : item.Value,
            SummaryValueType.Number =>
                decimal.TryParse(item.Value, out var nv) ? FormatNumber(nv, null, options) : item.Value,
            SummaryValueType.Percentage =>
                $"{item.Value}%",
            SummaryValueType.Date =>
                DateTime.TryParse(item.Value, out var dv) ? dv.ToString("yyyy/MM/dd") : item.Value,
            _ => item.Value
        };
    }

    private static decimal CalculateColumnTotal<T>(IEnumerable<T> data, ColumnDefinition column) where T : class
    {
        decimal total = 0;
        foreach (var item in data)
        {
            var value = GetPropertyValue(item, column.PropertyName);
            if (value != null && decimal.TryParse(value.ToString(), out var numValue))
            {
                total += numValue;
            }
        }
        return total;
    }

    private static string GetAlignmentClass(TextAlignment alignment)
    {
        return alignment switch
        {
            TextAlignment.Right => "align-right",
            TextAlignment.Left => "align-left",
            TextAlignment.Center => "align-center",
            _ => "align-right"
        };
    }

    private static string GetPageSizeString(PageSize pageSize)
    {
        return pageSize switch
        {
            PageSize.A4 => "A4",
            PageSize.A3 => "A3",
            PageSize.Letter => "Letter",
            PageSize.Legal => "Legal",
            _ => "A4"
        };
    }

    private static string EscapeXml(string value)
    {
        if (string.IsNullOrEmpty(value))
            return "";

        return value
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;")
            .Replace("'", "&apos;");
    }

    #endregion
}
