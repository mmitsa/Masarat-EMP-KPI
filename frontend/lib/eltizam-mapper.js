/**
 * lib/eltizam-mapper.js - مكتبة تحويل البيانات لنظام التزام (Eltizam/Masar)
 *
 * تحوّل بيانات النظام الداخلي إلى صيغة التزام (MCS-Eltezam Data Dictionary v3.24)
 * تشمل: بيانات الموظفين، مسيرات الرواتب، الإجازات، المؤهلات، الوظائف
 *
 * الاستخدام:
 *   import { mapToEltizamEmployeeInfo, mapToEltizamPayslipInfo } from '@/lib/eltizam-mapper';
 */

import {
  NATIONALITY_CODES,
  EMPLOYEE_STATUS_CODES,
  EMPLOYMENT_TYPE_CODES,
  ELEMENT_CODES,
  VACATION_CODES,
  QUALIFICATION_CODES,
  GENDER_CODES,
  MARITAL_STATUS_CODES,
} from '@/constants/eltizam-codes';

// ══════════════════════════════════════════════════════
// دوال التحويل الأساسية - Basic Mapping Helpers
// ══════════════════════════════════════════════════════

/**
 * تحويل رقم الهوية إلى نوعه (هوية وطنية / إقامة)
 * الهوية الوطنية تبدأ بـ 1، الإقامة تبدأ بـ 2
 * @param {string} nationalId
 * @returns {{ NationalID?: string, IqamaNumber?: string }}
 */
export function parsePersonIdentifier(nationalId) {
  if (!nationalId) return {};
  const id = String(nationalId).trim();
  if (id.startsWith('1')) {
    return { NationalID: id };
  }
  if (id.startsWith('2')) {
    return { IqamaNumber: id };
  }
  // كود جواز السفر أو غير محدد - نعامله كهوية وطنية
  return { NationalID: id };
}

/**
 * تحويل كود الجنسية الداخلي إلى كود ISO alpha-3 للتزام
 * يدعم: الكود الداخلي (001, 002...)، الاسم العربي (سعودي)، ISO alpha-3 مباشرة
 * @param {string|number} nationalityInput - كود الجنسية الداخلي أو اسمها
 * @returns {string} كود ISO alpha-3 (مثل 'SAU', 'EGY')
 */
export function getNationalityEltizamCode(nationalityInput) {
  if (!nationalityInput) return 'SAU'; // الافتراضي: سعودي

  const input = String(nationalityInput).trim();

  // بحث بالكود الداخلي (001, 002...)
  const byCode = Object.values(NATIONALITY_CODES).find(n => n.code === input);
  if (byCode) return byCode.eltizamCode;

  // بحث بالاسم العربي (سعودي, مصري...)
  const byNameAr = Object.values(NATIONALITY_CODES).find(
    n => n.name === input || n.name.includes(input)
  );
  if (byNameAr) return byNameAr.eltizamCode;

  // إذا كان ISO alpha-3 مباشرة (SAU, EGY...)
  if (/^[A-Z]{3}$/.test(input)) return input;

  // البحث في أكواد التزام مباشرة
  const byEltizam = Object.values(NATIONALITY_CODES).find(n => n.eltizamCode === input);
  if (byEltizam) return byEltizam.eltizamCode;

  return 'OTH'; // غير محدد
}

/**
 * تحويل كود حالة الموظف الداخلي إلى كود التزام (EMPLS-XX)
 * @param {string|number} statusInput - الكود الداخلي أو الاسم
 * @returns {string} كود التزام (مثل 'EMPLS-01')
 */
export function getStatusEltizamCode(statusInput) {
  if (!statusInput) return 'EMPLS-01'; // الافتراضي: على رأس العمل

  const input = String(statusInput).trim();

  // بحث مباشر بكود التزام (EMPLS-XX)
  if (/^EMPLS-\d{2}$/.test(input)) return input;

  // بحث بالكود الداخلي
  const byCode = Object.values(EMPLOYEE_STATUS_CODES).find(s => s.code === input);
  if (byCode) return byCode.eltizamCode;

  // بحث بالاسم العربي
  const byName = Object.values(EMPLOYEE_STATUS_CODES).find(
    s => s.name === input || s.nameEn?.toLowerCase() === input.toLowerCase()
  );
  if (byName) return byName.eltizamCode;

  // خريطة الأكواد الداخلية الشائعة
  const quickMap = {
    '0': 'EMPLS-01',  // Active
    '1': 'EMPLS-02',  // On Leave
    '99': 'EMPLS-06', // Draft/Terminated
    'active': 'EMPLS-01',
    'inactive': 'EMPLS-06',
    'suspended': 'EMPLS-05',
    'terminated': 'EMPLS-06',
    'retired': 'EMPLS-07',
  };

  return quickMap[input.toLowerCase()] || 'EMPLS-01';
}

/**
 * تحويل الجنس من الصيغة الداخلية إلى كود التزام (M/F/N)
 * يدعم: 0/1، ذكر/أنثى، M/F، male/female
 * @param {string|number} genderInput
 * @returns {'M'|'F'|'N'}
 */
export function mapGenderToEltizam(genderInput) {
  if (!genderInput && genderInput !== 0) return 'N';

  const g = String(genderInput).trim().toUpperCase();
  if (g === 'M' || g === '0' || g === 'MALE' || g === 'ذكر') return 'M';
  if (g === 'F' || g === '1' || g === 'FEMALE' || g === 'أنثى') return 'F';
  return 'N';
}

/**
 * تحويل الحالة الاجتماعية إلى كود التزام
 * @param {string|number} maritalInput
 * @returns {string} الكود ('01'=أعزب, '02'=متزوج, '03'=مطلق, '04'=أرمل)
 */
export function mapMaritalStatus(maritalInput) {
  if (!maritalInput && maritalInput !== 0) return '01';

  const m = String(maritalInput).toLowerCase().trim();
  const byCode = Object.values(MARITAL_STATUS_CODES).find(s => s.code === m);
  if (byCode) return byCode.code;

  const quickMap = {
    '0': '01', 'single': '01', 'أعزب': '01', 'عزباء': '01',
    '1': '02', 'married': '02', 'متزوج': '02', 'متزوجة': '02',
    '2': '03', 'divorced': '03', 'مطلق': '03', 'مطلقة': '03',
    '3': '04', 'widowed': '04', 'أرمل': '04', 'أرملة': '04',
  };

  return quickMap[m] || '01';
}

/**
 * تحويل الديانة إلى كود التزام (مسلم/غير مسلم)
 * @param {string} religion
 * @returns {string} 'Islam' | 'Other'
 */
export function mapReligion(religion) {
  if (!religion) return 'Islam'; // الافتراضي: مسلم
  const r = String(religion).toLowerCase();
  if (r.includes('muslim') || r.includes('مسلم') || r.includes('islam')) return 'Islam';
  return 'Other';
}

/**
 * تحويل الحالة الصحية إلى كود التزام
 * @param {string} healthStatus
 * @returns {string} 'Healthy' | 'Disability'
 */
export function mapHealthStatus(healthStatus) {
  if (!healthStatus) return 'Healthy';
  const h = String(healthStatus).toLowerCase();
  if (h.includes('disability') || h.includes('إعاقة') || h.includes('ذوي الاحتياجات')) return 'Disability';
  return 'Healthy';
}

/**
 * تنسيق التاريخ الهجري للإرسال لمنصة التزام
 * يحول YYYY-MM-DD إلى DDMMYYYY (صيغة التزام)
 * @param {string} hijriDate - التاريخ الهجري بصيغة YYYY-MM-DD أو YYYYMMDD
 * @returns {string} التاريخ بصيغة DDMMYYYY
 */
export function formatHijriDate(hijriDate) {
  if (!hijriDate) return '';

  const d = String(hijriDate).trim();

  // صيغة YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    const parts = d.substring(0, 10).split('-');
    return `${parts[2]}${parts[1]}${parts[0]}`; // DDMMYYYY
  }

  // صيغة YYYYMMDD
  if (/^\d{8}$/.test(d)) {
    return `${d.slice(6, 8)}${d.slice(4, 6)}${d.slice(0, 4)}`; // DDMMYYYY
  }

  return d;
}

/**
 * تنسيق التاريخ الميلادي للإرسال لمنصة التزام
 * @param {string|Date} date
 * @returns {string} بصيغة YYYY-MM-DD
 */
export function formatGregorianDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().substring(0, 10);
  } catch {
    return '';
  }
}

/**
 * تحويل كود المؤهل العلمي إلى كود التزام
 * @param {string|number} qualInput
 * @returns {string} كود التزام ('01'-'11')
 */
export function mapQualificationCode(qualInput) {
  if (!qualInput) return '03'; // الافتراضي: بكالوريوس

  const q = String(qualInput).trim();

  // بحث بالكود
  const byCode = Object.values(QUALIFICATION_CODES).find(qc => qc.code === q);
  if (byCode) return byCode.code;

  // خريطة سريعة من أكواد الإدخال الداخلية
  const quickMap = {
    '1': '09', 'ابتدائي': '09', 'primary': '09',
    '2': '08', 'متوسط': '08', 'intermediate': '08',
    '3': '01', 'ثانوي': '01', 'secondary': '01',
    '4': '02', 'دبلوم': '02', 'diploma': '02',
    '5': '03', 'بكالوريوس': '03', 'bachelor': '03',
    '6': '04', 'ماجستير': '04', 'master': '04',
    '7': '05', 'دكتوراه': '05', 'phd': '05',
  };

  return quickMap[q.toLowerCase()] || '03';
}

/**
 * تحويل نوع الإجازة إلى كود التزام
 * @param {string} leaveType - نوع الإجازة الداخلي
 * @returns {string} كود التزام ('01'-'30')
 */
export function mapVacationCode(leaveType) {
  if (!leaveType) return '01'; // الافتراضي: سنوية عادية

  const lt = String(leaveType).toLowerCase().trim();

  // بحث في أسماء أكواد الإجازات
  const byCode = Object.values(VACATION_CODES).find(
    v => v.code === lt || v.name === leaveType || v.nameEn?.toLowerCase() === lt
  );
  if (byCode) return byCode.code;

  // خريطة الأسماء الشائعة
  const quickMap = {
    'annual': '01', 'سنوية': '01', 'سنوية عادية': '01',
    'sick': '03', 'مرضية': '03', 'مرضية بأجر': '03',
    'maternity': '06', 'أمومة': '06',
    'paternity': '07', 'أبوة': '07',
    'hajj': '11', 'حج': '11',
    'marriage': '12', 'زواج': '12',
    'unpaid': '16', 'بدون راتب': '16',
    'emergency': '17', 'طارئة': '17',
  };

  return quickMap[lt] || '01';
}

/**
 * تحويل كود عنصر الراتب (بدل/استقطاع) إلى كود التزام
 * @param {string|number} elementCode - الكود الداخلي
 * @param {'earning'|'deduction'} elementType - نوع العنصر
 * @returns {string} كود التزام
 */
export function mapElementCode(elementCode, elementType = 'earning') {
  if (!elementCode) return elementType === 'deduction' ? '5000' : '1004';

  const code = String(elementCode).trim();

  // بحث في البدلات
  const allElements = {
    ...ELEMENT_CODES.ALLOWANCES,
    ...ELEMENT_CODES.DEDUCTIONS,
  };

  const found = Object.values(allElements).find(e => e.code === code);
  if (found) return found.eltizamCode;

  // إذا كان الكود نفسه كود التزام
  if (/^\d{4,8}$/.test(code)) return code;

  return elementType === 'deduction' ? '5000' : '1004';
}

// ══════════════════════════════════════════════════════
// دوال بناء الحمولة - Payload Builders
// ══════════════════════════════════════════════════════

/**
 * تحويل بيانات الموظف الداخلية إلى صيغة submitEmployeeInfo للتزام
 *
 * @param {object} employee - سجل الموظف من قاعدة البيانات
 * @param {number|string} tenantId - معرف المستأجر
 * @returns {object} الحمولة بصيغة التزام
 */
export function mapToEltizamEmployeeInfo(employee, tenantId) {
  if (!employee) throw new Error('بيانات الموظف مطلوبة');

  const identifier = parsePersonIdentifier(employee.NationalId || employee.nationalId);
  const gender = mapGenderToEltizam(employee.Gender ?? employee.gender);
  const nationality = getNationalityEltizamCode(employee.NationalityCode || employee.Nationality || employee.nationality);
  const statusCode = getStatusEltizamCode(employee.StatusCode || employee.Status || employee.status);
  const marital = mapMaritalStatus(employee.MaritalStatusValue ?? employee.MaritalStatus ?? employee.maritalStatus);
  const religion = mapReligion(employee.Religion || employee.religion);
  const healthStatus = mapHealthStatus(employee.HealthStatus || employee.healthStatus);
  const qualification = mapQualificationCode(employee.Education || employee.education || employee.EducationLevel);

  return {
    SubAgencyID: String(tenantId || 1),
    EmployeeInfo: {
      EmployeeID: String(employee.Id || employee.id),
      PersonalInfo: {
        PersonIdentifier: identifier,
        PersonNameAr: {
          FirstName: employee.FirstNameAr || splitArabicName(employee.ArName || employee.arName, 0),
          SecondName: employee.FatherNameAr || splitArabicName(employee.ArName || employee.arName, 1),
          ThirdName: employee.GrandFatherNameAr || splitArabicName(employee.ArName || employee.arName, 2),
          LastName: employee.FamilyNameAr || splitArabicName(employee.ArName || employee.arName, 3),
        },
        PersonNameEn: employee.EnName || employee.enName
          ? {
              FirstName: splitEnglishName(employee.EnName || employee.enName, 0),
              LastName: splitEnglishName(employee.EnName || employee.enName, -1),
            }
          : undefined,
        BirthDate: formatHijriDate(employee.BirthDateHijri) ||
          formatGregorianDate(employee.BirthDate || employee.birthDate),
        BirthPlace: employee.BirthPlace || employee.birthPlace || '',
        Gender: gender,
        NationalityCode: nationality,
        Religion: religion,
        BloodType: employee.BloodType || employee.bloodType || '',
        Mobile: employee.Mobile || employee.mobile || '',
        EmailAddress: employee.EmailNum || employee.Email || employee.email || '',
        MaritalStatus: marital,
        Healthstatus: healthStatus,
        ChildrenCount: parseInt(employee.ChildrenCount || employee.childrenCount) || 0,
      },
      EmployeeStatusCode: statusCode,
      EmployeeNumber: String(employee.EmployeeNumber || employee.employeeNumber || employee.Id || employee.id),
      HireDate: formatGregorianDate(employee.HireDate || employee.hireDate),
      TerminationDate: formatGregorianDate(employee.TerminationDate || employee.terminationDate),
      JobInfo: {
        JobNumber: String(employee.JobNumber || employee.jobNumber || ''),
        JobCode: employee.JobCode || employee.jobCode || '',
        JobNameAr: employee.JobName || employee.jobName || employee.Rank || employee.rank || '',
        EmploymentTypeCode: employee.EmploymentTypeCode || employee.employmentTypeCode || 'EMPT-01',
        RankCode: employee.RankCode || employee.rankCode || 'R-0101',
        StepID: String(employee.CurrentStep || employee.currentStep || employee.StepId || '1'),
        BasicSalary: String(parseFloat(employee.BasicSalary || employee.basicSalary) || 0),
        HousingAllowance: String(parseFloat(employee.HousingAllowance || employee.housingAllowance) || 0),
        TransportAllowance: String(parseFloat(employee.TransportAllowance || employee.transportAllowance) || 0),
      },
      DepartmentInfo: {
        DepartmentCode: employee.DeptCode || employee.DepartmentId || '',
        DepartmentNameAr: employee.DeptName || employee.departmentName || '',
        SectionCode: employee.SectionCode || employee.SectionId || '',
        SectionNameAr: employee.SectionName || employee.sectionName || '',
      },
      QualificationInfo: {
        QualificationCode: qualification,
        Major: employee.Specialization || employee.specialization || employee.EducationSpecialty || '',
        University: employee.University || employee.university || '',
        GraduationYear: String(employee.GraduationYear || employee.graduationYear || ''),
      },
      BankInfo: employee.BankName || employee.bankName
        ? {
            BankName: employee.BankName || employee.bankName || '',
            IBAN: employee.BankAccountNumber || employee.BankAccount || employee.iban || '',
          }
        : undefined,
      ContactInfo: {
        Address: employee.Address || employee.address || '',
        City: employee.City || employee.city || '',
        PostalCode: employee.PostalCode || employee.postalCode || '',
        Mobile: employee.Mobile || employee.mobile || '',
        Phone: employee.Phone || employee.phone || '',
        Email: employee.EmailNum || employee.Email || employee.email || '',
      },
      InsuranceInfo: {
        GosiNumber: employee.GosiNumber || employee.socialInsuranceNumber || '',
        SocialInsuranceDate: formatGregorianDate(
          employee.SocialInsuranceDate || employee.socialInsuranceDate
        ),
        MedicalInsuranceNumber: employee.MedicalInsuranceNumber || employee.medicalInsuranceNumber || '',
        MedicalInsuranceClass: employee.MedicalInsuranceClass || employee.medicalInsuranceClass || '',
      },
    },
    SubmissionMetadata: {
      SubmittedAt: new Date().toISOString(),
      SubmittedBy: 'Masarat-HR-System',
      DataVersion: '3.24',
    },
  };
}

/**
 * تحويل بيانات مسير الرواتب إلى صيغة submitEmployeePayslipInfo للتزام
 *
 * @param {object} employee - بيانات الموظف الأساسية
 * @param {object} payslipData - بيانات قسيمة الراتب
 * @param {number|string} tenantId - معرف المستأجر
 * @returns {object} الحمولة بصيغة التزام
 */
export function mapToEltizamPayslipInfo(employee, payslipData, tenantId) {
  if (!employee || !payslipData) throw new Error('بيانات الموظف ومسير الرواتب مطلوبة');

  const identifier = parsePersonIdentifier(employee.NationalId || employee.nationalId);

  // تجميع عناصر الراتب (البدلات والاستقطاعات)
  const earnings = buildPayslipElements(payslipData, 'earning');
  const deductions = buildPayslipElements(payslipData, 'deduction');

  const basicSalary = parseFloat(employee.BasicSalary || employee.basicSalary || payslipData.basicSalary) || 0;
  const housing = parseFloat(employee.HousingAllowance || employee.housingAllowance || payslipData.housingAllowance) || 0;
  const transport = parseFloat(employee.TransportAllowance || employee.transportAllowance || payslipData.transportAllowance) || 0;
  const otherAllowances = parseFloat(payslipData.otherAllowances || payslipData.totalAllowances) || 0;
  const totalEarnings = basicSalary + housing + transport + otherAllowances;
  const totalDeductions = deductions.reduce((sum, d) => sum + parseFloat(d.Amount), 0);
  const netSalary = totalEarnings - totalDeductions;

  return {
    SubAgencyID: String(tenantId || 1),
    EmployeeID: String(employee.Id || employee.id),
    PersonIdentifier: identifier,
    PayslipInfo: {
      Month: String(payslipData.month || payslipData.Month || new Date().getMonth() + 1).padStart(2, '0'),
      Year: String(payslipData.year || payslipData.Year || new Date().getFullYear()),
      BasicSalary: String(basicSalary.toFixed(2)),
      TotalEarnings: String(totalEarnings.toFixed(2)),
      TotalDeductions: String(totalDeductions.toFixed(2)),
      NetSalary: String(netSalary.toFixed(2)),
      PaymentDate: formatGregorianDate(payslipData.paymentDate || payslipData.PaymentDate),
      PaymentMethod: payslipData.paymentMethod || 'Bank Transfer',
      IBAN: employee.BankAccountNumber || employee.iban || '',
      Elements: {
        Earnings: earnings.length > 0 ? earnings : [
          { ElementCode: '1004', ElementNameAr: 'الراتب الأساسي', Amount: String(basicSalary.toFixed(2)) },
          ...(housing > 0 ? [{ ElementCode: '10042001', ElementNameAr: 'بدل السكن', Amount: String(housing.toFixed(2)) }] : []),
          ...(transport > 0 ? [{ ElementCode: '10005001', ElementNameAr: 'بدل النقل', Amount: String(transport.toFixed(2)) }] : []),
        ],
        Deductions: deductions,
      },
    },
    SubmissionMetadata: {
      SubmittedAt: new Date().toISOString(),
      DataVersion: '3.24',
    },
  };
}

/**
 * تحويل بيانات الإجازة إلى صيغة submitEmployeeVacationInfo للتزام
 *
 * @param {object} employee - بيانات الموظف
 * @param {object} leaveData - بيانات الإجازة
 * @param {number|string} tenantId - معرف المستأجر
 * @returns {object} الحمولة بصيغة التزام
 */
export function mapToEltizamVacationInfo(employee, leaveData, tenantId) {
  if (!leaveData) throw new Error('بيانات الإجازة مطلوبة');

  const identifier = parsePersonIdentifier(
    (employee && (employee.NationalId || employee.nationalId)) || leaveData.NationalId || leaveData.nationalId
  );
  const vacationCode = mapVacationCode(leaveData.LeaveType || leaveData.leaveType || leaveData.Type || leaveData.type);

  // احتساب عدد الأيام إذا لم يكن محدداً
  let days = parseInt(leaveData.Days || leaveData.days || leaveData.Duration || leaveData.duration) || 0;
  if (days === 0 && leaveData.StartDate && leaveData.EndDate) {
    const start = new Date(leaveData.StartDate || leaveData.startDate);
    const end = new Date(leaveData.EndDate || leaveData.endDate);
    days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  return {
    SubAgencyID: String(tenantId || 1),
    EmployeeID: String((employee && (employee.Id || employee.id)) || leaveData.EmployeeId || leaveData.employeeId),
    PersonIdentifier: identifier,
    VacationInfo: {
      VacationCode: vacationCode,
      VacationNameAr: leaveData.LeaveTypeName || leaveData.leaveTypeName || leaveData.LeaveType || leaveData.leaveType || 'إجازة',
      StartDate: formatGregorianDate(leaveData.StartDate || leaveData.startDate),
      EndDate: formatGregorianDate(leaveData.EndDate || leaveData.endDate),
      ReturnDate: formatGregorianDate(leaveData.ReturnDate || leaveData.returnDate),
      Days: String(days),
      LeaveBalance: String(parseFloat(leaveData.Balance || leaveData.balance || leaveData.LeaveBalance || 0).toFixed(2)),
      IsApproved: (leaveData.Status || leaveData.status || '').toLowerCase() === 'approved' ? 'Y' : 'N',
      ApprovalDate: formatGregorianDate(leaveData.ApprovedAt || leaveData.approvedAt),
      ApprovedBy: leaveData.ApprovedBy || leaveData.approvedBy || '',
      Notes: leaveData.Notes || leaveData.notes || '',
    },
    SubmissionMetadata: {
      SubmittedAt: new Date().toISOString(),
      DataVersion: '3.24',
    },
  };
}

/**
 * تحويل بيانات المؤهل العلمي إلى صيغة التزام
 *
 * @param {object} employee - بيانات الموظف
 * @param {object} qualData - بيانات المؤهل
 * @param {number|string} tenantId - معرف المستأجر
 * @returns {object} الحمولة بصيغة التزام
 */
export function mapToEltizamQualificationInfo(employee, qualData, tenantId) {
  const identifier = parsePersonIdentifier(employee?.NationalId || employee?.nationalId);
  const qualCode = mapQualificationCode(
    (qualData?.QualificationCode || qualData?.qualificationCode || qualData?.Education || qualData?.education)
  );

  return {
    SubAgencyID: String(tenantId || 1),
    EmployeeID: String(employee?.Id || employee?.id),
    PersonIdentifier: identifier,
    QualificationInfo: {
      QualificationCode: qualCode,
      QualificationNameAr: qualData?.QualificationName || qualData?.qualificationName || '',
      Major: qualData?.Major || qualData?.major || qualData?.Specialization || qualData?.specialization || '',
      University: qualData?.University || qualData?.university || '',
      GraduationYear: String(qualData?.GraduationYear || qualData?.graduationYear || ''),
      Country: getNationalityEltizamCode(qualData?.Country || qualData?.country || '001'),
      CertificateNumber: qualData?.CertificateNumber || qualData?.certificateNumber || '',
      IssuedDate: formatGregorianDate(qualData?.IssuedDate || qualData?.issuedDate),
      VerificationStatus: qualData?.VerificationStatus || 'Pending',
    },
    SubmissionMetadata: {
      SubmittedAt: new Date().toISOString(),
      DataVersion: '3.24',
    },
  };
}

/**
 * تحويل بيانات تقييم الأداء إلى صيغة التزام
 *
 * @param {object} employee - بيانات الموظف
 * @param {object} appraisalData - بيانات التقييم
 * @param {number|string} tenantId - معرف المستأجر
 * @returns {object} الحمولة بصيغة التزام
 */
export function mapToEltizamAppraisalInfo(employee, appraisalData, tenantId) {
  const identifier = parsePersonIdentifier(employee?.NationalId || employee?.nationalId);

  // تحويل الدرجة إلى نسبة مئوية إذا كانت من 100 أو 5
  let score = parseFloat(appraisalData?.Score || appraisalData?.score || appraisalData?.Rating || 0);
  let maxScore = parseFloat(appraisalData?.MaxScore || appraisalData?.maxScore || 100);
  let percentage = maxScore > 0 ? (score / maxScore) * 100 : score;

  // تحديد التصنيف النصي
  let gradeLabel = 'مقبول';
  if (percentage >= 90) gradeLabel = 'ممتاز';
  else if (percentage >= 80) gradeLabel = 'جيد جداً';
  else if (percentage >= 70) gradeLabel = 'جيد';
  else if (percentage >= 60) gradeLabel = 'مقبول';
  else gradeLabel = 'ضعيف';

  return {
    SubAgencyID: String(tenantId || 1),
    EmployeeID: String(employee?.Id || employee?.id),
    PersonIdentifier: identifier,
    AppraisalInfo: {
      EvaluationYear: String(appraisalData?.Year || appraisalData?.year || new Date().getFullYear()),
      EvaluationPeriod: appraisalData?.Period || appraisalData?.period || 'سنوي',
      Score: String(score.toFixed(2)),
      MaxScore: String(maxScore.toFixed(2)),
      Percentage: String(percentage.toFixed(2)),
      GradeCode: appraisalData?.GradeCode || appraisalData?.gradeCode || '',
      GradeLabel: gradeLabel,
      EvaluatorName: appraisalData?.EvaluatorName || appraisalData?.evaluatorName || '',
      ApprovalDate: formatGregorianDate(appraisalData?.ApprovalDate || appraisalData?.approvalDate),
      Notes: appraisalData?.Notes || appraisalData?.notes || '',
    },
    SubmissionMetadata: {
      SubmittedAt: new Date().toISOString(),
      DataVersion: '3.24',
    },
  };
}

/**
 * تحويل بيانات الوظيفة إلى صيغة submitJobInfo للتزام
 *
 * @param {object} jobData - بيانات الوظيفة
 * @param {number|string} tenantId - معرف المستأجر
 * @returns {object} الحمولة بصيغة التزام
 */
export function mapToEltizamJobInfo(jobData, tenantId) {
  return {
    SubAgencyID: String(tenantId || 1),
    JobInfo: {
      JobCode: String(jobData?.Code || jobData?.code || jobData?.Id || jobData?.id),
      JobNameAr: jobData?.NameAr || jobData?.nameAr || jobData?.Name || jobData?.name || '',
      JobNameEn: jobData?.NameEn || jobData?.nameEn || '',
      EmploymentTypeCode: jobData?.EmploymentTypeCode || jobData?.employmentTypeCode || 'EMPT-01',
      RankCode: jobData?.RankCode || jobData?.rankCode || 'R-0101',
      MinSalary: String(parseFloat(jobData?.MinSalary || jobData?.minSalary || 0).toFixed(2)),
      MaxSalary: String(parseFloat(jobData?.MaxSalary || jobData?.maxSalary || 0).toFixed(2)),
      DepartmentCode: String(jobData?.DepartmentId || jobData?.departmentId || ''),
      DepartmentNameAr: jobData?.DepartmentName || jobData?.departmentName || '',
      IsVacant: jobData?.IsVacant || jobData?.isVacant ? 'Y' : 'N',
      JobTransactionCode: jobData?.TransactionCode || 'JTXN-01',
    },
    SubmissionMetadata: {
      SubmittedAt: new Date().toISOString(),
      DataVersion: '3.24',
    },
  };
}

// ══════════════════════════════════════════════════════
// دوال مساعدة داخلية - Internal Helpers
// ══════════════════════════════════════════════════════

/**
 * استخراج جزء من اسم عربي رباعي
 * @param {string} fullName - الاسم الكامل
 * @param {number} index - 0=الأول, 1=الأب, 2=الجد, 3=العائلة
 * @returns {string}
 */
function splitArabicName(fullName, index) {
  if (!fullName) return '';
  const parts = String(fullName).trim().split(/\s+/);

  // إذا كان الاسم ثلاثي أو أقل، نوزع الأجزاء
  if (parts.length === 1) return index === 0 ? parts[0] : '';
  if (parts.length === 2) {
    return index === 0 ? parts[0] : index === 3 ? parts[1] : '';
  }
  if (parts.length === 3) {
    return index === 0 ? parts[0] : index === 1 ? parts[1] : index === 3 ? parts[2] : '';
  }

  // رباعي فأكثر
  if (index === 0) return parts[0];
  if (index === 1) return parts[1];
  if (index === 2) return parts.length > 3 ? parts[2] : '';
  if (index === 3) return parts[parts.length - 1];
  return '';
}

/**
 * استخراج جزء من اسم إنجليزي
 * @param {string} fullName
 * @param {number} index - 0=الأول، -1=الأخير
 * @returns {string}
 */
function splitEnglishName(fullName, index) {
  if (!fullName) return '';
  const parts = String(fullName).trim().split(/\s+/);
  if (index === -1) return parts[parts.length - 1];
  return parts[index] || '';
}

/**
 * بناء عناصر مسير الراتب (بدلات أو استقطاعات)
 * @param {object} payslipData - بيانات قسيمة الراتب
 * @param {'earning'|'deduction'} type - نوع العناصر
 * @returns {Array} مصفوفة عناصر الراتب بصيغة التزام
 */
function buildPayslipElements(payslipData, type) {
  const elements = [];

  if (type === 'earning') {
    // البدلات المعروفة
    const basic = parseFloat(payslipData.basicSalary || payslipData.BasicSalary) || 0;
    const housing = parseFloat(payslipData.housingAllowance || payslipData.HousingAllowance) || 0;
    const transport = parseFloat(payslipData.transportAllowance || payslipData.TransportAllowance) || 0;
    const phone = parseFloat(payslipData.phoneAllowance || payslipData.PhoneAllowance) || 0;
    const other = parseFloat(payslipData.otherAllowances || payslipData.OtherAllowances) || 0;
    const overtime = parseFloat(payslipData.overtime || payslipData.Overtime) || 0;
    const bonus = parseFloat(payslipData.bonus || payslipData.Bonus) || 0;

    if (basic > 0) elements.push({ ElementCode: '1004', ElementNameAr: 'الراتب الأساسي', Amount: String(basic.toFixed(2)) });
    if (housing > 0) elements.push({ ElementCode: '10042001', ElementNameAr: 'بدل السكن', Amount: String(housing.toFixed(2)) });
    if (transport > 0) elements.push({ ElementCode: '10005001', ElementNameAr: 'بدل النقل', Amount: String(transport.toFixed(2)) });
    if (phone > 0) elements.push({ ElementCode: '90036004', ElementNameAr: 'بدل الهاتف', Amount: String(phone.toFixed(2)) });
    if (overtime > 0) elements.push({ ElementCode: '10013001', ElementNameAr: 'أجر إضافي', Amount: String(overtime.toFixed(2)) });
    if (bonus > 0) elements.push({ ElementCode: '10008001', ElementNameAr: 'مكافأة', Amount: String(bonus.toFixed(2)) });
    if (other > 0) elements.push({ ElementCode: '90036001', ElementNameAr: 'بدلات أخرى', Amount: String(other.toFixed(2)) });

    // عناصر مخصصة من payslipData.elements
    if (Array.isArray(payslipData.elements)) {
      payslipData.elements.filter(e => e.type === 'earning').forEach(e => {
        elements.push({
          ElementCode: mapElementCode(e.code, 'earning'),
          ElementNameAr: e.name || e.nameAr || '',
          Amount: String(parseFloat(e.amount || 0).toFixed(2)),
        });
      });
    }
  }

  if (type === 'deduction') {
    // الاستقطاعات المعروفة
    const gosi = parseFloat(payslipData.gosiDeduction || payslipData.GosiDeduction || payslipData.socialInsurance) || 0;
    const absence = parseFloat(payslipData.absenceDeduction || payslipData.AbsenceDeduction) || 0;
    const late = parseFloat(payslipData.lateDeduction || payslipData.LateDeduction) || 0;
    const loan = parseFloat(payslipData.loanInstallment || payslipData.LoanInstallment) || 0;
    const other = parseFloat(payslipData.otherDeductions || payslipData.OtherDeductions) || 0;

    if (gosi > 0) elements.push({ ElementCode: '5000', ElementNameAr: 'حسم التأمينات الاجتماعية', Amount: String(gosi.toFixed(2)) });
    if (absence > 0) elements.push({ ElementCode: '110', ElementNameAr: 'خصم غياب', Amount: String(absence.toFixed(2)) });
    if (late > 0) elements.push({ ElementCode: '111', ElementNameAr: 'خصم تأخير', Amount: String(late.toFixed(2)) });
    if (loan > 0) elements.push({ ElementCode: '120', ElementNameAr: 'قسط قرض', Amount: String(loan.toFixed(2)) });
    if (other > 0) elements.push({ ElementCode: '142', ElementNameAr: 'خصومات أخرى', Amount: String(other.toFixed(2)) });

    // عناصر مخصصة
    if (Array.isArray(payslipData.elements)) {
      payslipData.elements.filter(e => e.type === 'deduction').forEach(e => {
        elements.push({
          ElementCode: mapElementCode(e.code, 'deduction'),
          ElementNameAr: e.name || e.nameAr || '',
          Amount: String(parseFloat(e.amount || 0).toFixed(2)),
        });
      });
    }
  }

  return elements;
}

// ══════════════════════════════════════════════════════
// تصدير افتراضي - Default Export
// ══════════════════════════════════════════════════════
export default {
  mapToEltizamEmployeeInfo,
  mapToEltizamPayslipInfo,
  mapToEltizamVacationInfo,
  mapToEltizamQualificationInfo,
  mapToEltizamAppraisalInfo,
  mapToEltizamJobInfo,
  parsePersonIdentifier,
  getNationalityEltizamCode,
  getStatusEltizamCode,
  mapGenderToEltizam,
  mapMaritalStatus,
  mapReligion,
  mapHealthStatus,
  formatHijriDate,
  formatGregorianDate,
  mapQualificationCode,
  mapVacationCode,
  mapElementCode,
};
