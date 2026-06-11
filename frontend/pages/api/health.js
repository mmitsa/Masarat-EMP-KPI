/**
 * Health Check Endpoint
 * GET /api/health
 *
 * يُستخدم من صفحة الصيانة لمعرفة متى يعود السيرفر الحقيقي
 * لا يحتاج مصادقة
 */
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
