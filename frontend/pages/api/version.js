/**
 * API Route - كشف نسخة التطبيق
 * يُستخدم من قبل المتصفح لمعرفة إذا كان هناك تحديث جديد
 * يُعيد Next.js Build ID الحالي عبر قراءة ملف .next/BUILD_ID
 */
import fs from 'fs';
import path from 'path';

function getBuildId() {
    try {
        return fs.readFileSync(path.join(process.cwd(), '.next', 'BUILD_ID'), 'utf-8').trim();
    } catch {
        return '__development__';
    }
}

export default function handler(req, res) {
    // No-cache headers — يجب دائماً الحصول على النسخة الحقيقية
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json({
        buildId: getBuildId(),
        timestamp: Date.now(),
    });
}
