/**
 * قواعد خصم التأخير والغياب
 * Attendance Deduction Rules System
 *
 * يتضمن:
 * - حساب دقائق التأخير
 * - قواعد الخصم (من الراتب أو من رصيد الإجازات)
 * - سياسات الإنذار والعقوبات
 * - نظام التنبيهات
 */

// أوقات الدوام الافتراضية (الدوام الحكومي الرسمي)
export const DEFAULT_WORK_SCHEDULE = {
  startTime: '07:30',        // وقت بداية الدوام (الدوام الحكومي)
  endTime: '14:30',          // وقت نهاية الدوام
  graceMinutes: 15,          // فترة السماح (15 دقيقة)
  workHoursPerDay: 7,        // ساعات العمل اليومية
  workDaysPerWeek: 5,        // أيام العمل في الأسبوع
  weekends: [5, 6],          // الجمعة والسبت
  overtimeMinimumMinutes: 30, // الحد الأدنى للعمل الإضافي
  maxOvertimeHoursDaily: 3,   // الحد الأقصى للعمل الإضافي يومياً
};

// درجات التأخير وحدودها
export const LATE_THRESHOLDS = {
  grace: {
    maxMinutes: 15,
    deductionPercent: 0,
    deductionHours: 0,
    level: 'سماح',
    color: 'green',
    action: 'none'
  },
  minor: {
    minMinutes: 16,
    maxMinutes: 30,
    deductionPercent: 0.5,     // 0.5% من الراتب اليومي
    deductionHours: 0.5,       // نصف ساعة من رصيد الإجازات
    level: 'بسيط',
    color: 'yellow',
    action: 'notification'
  },
  moderate: {
    minMinutes: 31,
    maxMinutes: 60,
    deductionPercent: 1,       // 1% من الراتب اليومي
    deductionHours: 1,         // ساعة من رصيد الإجازات
    level: 'متوسط',
    color: 'orange',
    action: 'warning'
  },
  severe: {
    minMinutes: 61,
    maxMinutes: 120,
    deductionPercent: 2,       // 2% من الراتب اليومي
    deductionHours: 2,         // ساعتين من رصيد الإجازات
    level: 'شديد',
    color: 'red',
    action: 'penalty'
  },
  critical: {
    minMinutes: 121,
    maxMinutes: 240,           // حتى 4 ساعات
    deductionPercent: 5,       // 5% = نصف يوم
    deductionHours: 4,         // 4 ساعات من رصيد الإجازات
    level: 'خطير',
    color: 'red',
    action: 'suspension_warning'
  },
  halfDay: {
    minMinutes: 241,
    deductionPercent: 50,      // خصم نصف يوم
    deductionHours: 4,         // نصف يوم من الإجازات
    level: 'غياب جزئي',
    color: 'purple',
    action: 'half_day_absence'
  }
};

// قواعد الغياب
export const ABSENCE_RULES = {
  withExcuse: {
    deductionPercent: 0,
    deductFromLeave: true,
    requiresApproval: true,
    label: 'غياب بعذر'
  },
  withoutExcuse: {
    deductionPercent: 100,     // خصم يوم كامل
    deductFromLeave: false,    // لا يخصم من الإجازات
    requiresApproval: false,
    label: 'غياب بدون عذر'
  },
  sick: {
    deductionPercent: 0,
    deductFromLeave: true,     // يخصم من رصيد المرضية
    leaveType: 'sick',
    requiresDocument: true,
    label: 'مرضي'
  },
  emergency: {
    deductionPercent: 0,
    deductFromLeave: true,
    leaveType: 'emergency',
    requiresApproval: true,
    label: 'طارئ'
  }
};

// سياسات التصعيد
export const ESCALATION_POLICY = {
  warnings: {
    level1: {
      count: 3,               // 3 تأخيرات في الشهر
      action: 'verbal_warning',
      label: 'تنبيه شفهي'
    },
    level2: {
      count: 5,               // 5 تأخيرات في الشهر
      action: 'written_warning',
      label: 'إنذار كتابي أول'
    },
    level3: {
      count: 7,               // 7 تأخيرات في الشهر
      action: 'final_warning',
      label: 'إنذار كتابي نهائي'
    },
    level4: {
      count: 10,              // 10 تأخيرات في الشهر
      action: 'suspension',
      label: 'إيقاف مؤقت'
    }
  },
  absences: {
    level1: {
      count: 2,               // غيابين في الشهر
      action: 'warning',
      label: 'إنذار'
    },
    level2: {
      count: 3,               // 3 غيابات في الشهر
      action: 'salary_deduction',
      deductDays: 1,
      label: 'خصم يوم'
    },
    level3: {
      count: 5,               // 5 غيابات في الشهر
      action: 'suspension',
      suspendDays: 3,
      label: 'إيقاف 3 أيام'
    },
    level4: {
      count: 7,               // 7 غيابات في الشهر
      action: 'termination_review',
      label: 'مراجعة إنهاء الخدمة'
    }
  }
};

// أنواع الخصم
export const DEDUCTION_TYPES = {
  FROM_SALARY: 'salary',
  FROM_LEAVE: 'leave',
  NONE: 'none'
};

// قوالب الرسائل
export const NOTIFICATION_TEMPLATES = {
  late: {
    first: 'تنبيه: تم تسجيل تأخير بتاريخ {date} بمقدار {minutes} دقيقة. نرجو الالتزام بمواعيد الدوام الرسمية.',
    repeated: 'تنبيه مهم: هذا التأخير رقم {count} خلال الشهر الحالي. في حال استمرار التأخير سيتم اتخاذ إجراء تأديبي.',
    warning: 'إنذار: بسبب تكرار التأخير ({count} مرة هذا الشهر)، يتم توجيه إنذار رسمي. أي تأخير إضافي سيؤدي لخصم من الراتب.',
    deduction: 'إشعار خصم: تم خصم مبلغ {amount} ر.س من راتبك بسبب التأخير المتكرر ({count} مرة).'
  },
  absent: {
    first: 'تنبيه: تم تسجيل غياب بتاريخ {date}. في حال وجود عذر، يرجى تقديمه خلال 48 ساعة.',
    repeated: 'تنبيه مهم: هذا الغياب رقم {count} خلال الشهر الحالي. سيتم اتخاذ إجراء تأديبي.',
    noExcuse: 'إشعار: تم احتساب غياب بدون عذر بتاريخ {date}. سيتم خصم يوم من الراتب.',
    suspension: 'قرار إيقاف: بسبب تكرار الغياب ({count} مرة)، تم إيقافك لمدة {days} أيام.'
  },
  general: {
    reminder: 'تذكير: الالتزام بمواعيد الدوام الرسمية من {start} إلى {end}.',
    monthlyReport: 'تقرير شهري: إجمالي التأخير {lateMinutes} دقيقة، إجمالي الغياب {absentDays} يوم.',
    positiveNote: 'تقدير: شكراً على التزامك بالحضور المنتظم خلال الشهر الماضي.'
  },
  deductionChoice: {
    title: 'اختيار طريقة الخصم',
    message: 'لديك تأخير بمقدار {minutes} دقيقة. يمكنك اختيار طريقة الخصم:',
    option1: 'خصم {hours} ساعة من رصيد الإجازات (المتبقي: {balance} ساعة)',
    option2: 'خصم {amount} ر.س من الراتب'
  }
};

/**
 * حساب دقائق التأخير
 */
export function calculateLateMinutes(checkInTime, scheduleStart = '07:30') {
  if (!checkInTime) return 0;

  const [inHour, inMinute] = checkInTime.split(':').map(Number);
  const [startHour, startMinute] = scheduleStart.split(':').map(Number);

  const checkInMinutes = inHour * 60 + inMinute;
  const startMinutes = startHour * 60 + startMinute;

  return Math.max(0, checkInMinutes - startMinutes);
}

/**
 * تحديد مستوى التأخير
 */
export function getLateLevel(lateMinutes) {
  if (lateMinutes <= LATE_THRESHOLDS.grace.maxMinutes) {
    return { ...LATE_THRESHOLDS.grace, minutes: lateMinutes };
  }
  if (lateMinutes <= LATE_THRESHOLDS.minor.maxMinutes) {
    return { ...LATE_THRESHOLDS.minor, minutes: lateMinutes };
  }
  if (lateMinutes <= LATE_THRESHOLDS.moderate.maxMinutes) {
    return { ...LATE_THRESHOLDS.moderate, minutes: lateMinutes };
  }
  if (lateMinutes <= LATE_THRESHOLDS.severe.maxMinutes) {
    return { ...LATE_THRESHOLDS.severe, minutes: lateMinutes };
  }
  if (lateMinutes <= LATE_THRESHOLDS.critical.maxMinutes) {
    return { ...LATE_THRESHOLDS.critical, minutes: lateMinutes };
  }
  return { ...LATE_THRESHOLDS.halfDay, minutes: lateMinutes };
}

/**
 * حساب مبلغ الخصم من الراتب
 */
export function calculateSalaryDeduction(dailySalary, lateMinutes, deductionPercent = null) {
  const level = getLateLevel(lateMinutes);
  const percent = deductionPercent !== null ? deductionPercent : level.deductionPercent;
  return Math.round(dailySalary * (percent / 100) * 100) / 100;
}

/**
 * حساب ساعات الخصم من الإجازات
 */
export function calculateLeaveDeduction(lateMinutes) {
  const level = getLateLevel(lateMinutes);
  return level.deductionHours;
}

/**
 * تحديد الإجراء التصاعدي
 */
export function getEscalationAction(type, count) {
  const policy = type === 'late' ? ESCALATION_POLICY.warnings : ESCALATION_POLICY.absences;

  if (count >= policy.level4.count) return policy.level4;
  if (count >= policy.level3.count) return policy.level3;
  if (count >= policy.level2.count) return policy.level2;
  if (count >= policy.level1.count) return policy.level1;

  return null;
}

/**
 * إنشاء رسالة التنبيه
 */
export function generateNotificationMessage(template, data) {
  let message = template;

  Object.keys(data).forEach(key => {
    message = message.replace(new RegExp(`{${key}}`, 'g'), data[key]);
  });

  return message;
}

/**
 * التحقق من إمكانية الخصم من رصيد الإجازات
 */
export function canDeductFromLeave(leaveBalance, hoursToDeduct) {
  // تحويل الرصيد من أيام لساعات (8 ساعات = يوم)
  const balanceInHours = leaveBalance * 8;
  return balanceInHours >= hoursToDeduct;
}

/**
 * حساب الراتب اليومي
 */
export function calculateDailySalary(monthlySalary, workDaysPerMonth = 22) {
  return Math.round(monthlySalary / workDaysPerMonth * 100) / 100;
}

/**
 * إنشاء ملخص الحضور الشهري
 */
export function generateMonthlyAttendanceSummary(attendanceRecords) {
  const summary = {
    totalDays: attendanceRecords.length,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    leaveDays: 0,
    totalLateMinutes: 0,
    totalDeductionAmount: 0,
    totalLeaveHoursDeducted: 0,
    escalationLevel: null,
    notifications: []
  };

  attendanceRecords.forEach(record => {
    switch (record.status) {
      case 'present':
        summary.presentDays++;
        break;
      case 'late':
        summary.lateDays++;
        summary.totalLateMinutes += record.lateMinutes || 0;
        break;
      case 'absent':
        summary.absentDays++;
        break;
      case 'leave':
        summary.leaveDays++;
        break;
    }
  });

  // تحديد مستوى التصعيد
  const lateEscalation = getEscalationAction('late', summary.lateDays);
  const absentEscalation = getEscalationAction('absent', summary.absentDays);

  if (absentEscalation && (!lateEscalation || absentEscalation.count > lateEscalation.count)) {
    summary.escalationLevel = absentEscalation;
  } else if (lateEscalation) {
    summary.escalationLevel = lateEscalation;
  }

  return summary;
}

/**
 * خيارات الخصم للموظف
 */
export function getDeductionOptions(lateMinutes, monthlySalary, leaveBalance) {
  const level = getLateLevel(lateMinutes);
  const dailySalary = calculateDailySalary(monthlySalary);
  const salaryDeduction = calculateSalaryDeduction(dailySalary, lateMinutes);
  const leaveHours = level.deductionHours;
  const canUseLeave = canDeductFromLeave(leaveBalance, leaveHours);

  return {
    lateLevel: level,
    options: [
      {
        type: DEDUCTION_TYPES.FROM_SALARY,
        amount: salaryDeduction,
        label: `خصم ${salaryDeduction.toFixed(2)} ر.س من الراتب`,
        enabled: true
      },
      {
        type: DEDUCTION_TYPES.FROM_LEAVE,
        hours: leaveHours,
        label: `خصم ${leaveHours} ساعة من رصيد الإجازات`,
        sublabel: `(المتبقي: ${(leaveBalance * 8).toFixed(1)} ساعة)`,
        enabled: canUseLeave
      }
    ],
    recommendation: canUseLeave && leaveHours <= 2 ? DEDUCTION_TYPES.FROM_LEAVE : DEDUCTION_TYPES.FROM_SALARY
  };
}

// تصدير كل شيء
export default {
  DEFAULT_WORK_SCHEDULE,
  LATE_THRESHOLDS,
  ABSENCE_RULES,
  ESCALATION_POLICY,
  DEDUCTION_TYPES,
  NOTIFICATION_TEMPLATES,
  calculateLateMinutes,
  getLateLevel,
  calculateSalaryDeduction,
  calculateLeaveDeduction,
  getEscalationAction,
  generateNotificationMessage,
  canDeductFromLeave,
  calculateDailySalary,
  generateMonthlyAttendanceSummary,
  getDeductionOptions
};
