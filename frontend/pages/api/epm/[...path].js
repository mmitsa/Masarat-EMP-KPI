import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';

const EPM_API_URL =
    process.env.EPM_API_URL ||
    process.env.NEXT_PUBLIC_EPM_API_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    'http://localhost:5006';

const LOCAL_EPM_JWT_KEY =
    process.env.EPM_JWT_KEY ||
    process.env.Jwt__Key ||
    'local-epm-development-jwt-key-change-before-production';

function base64Url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function createLocalBackendToken(token) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: String(token?.sub || token?.nationalId || '1000000001'),
        name: token?.name || 'مدير نظام قياس الأداء',
        tenant_id: String(token?.tenantId || 1),
        permission: token?.permissions || ['epm:read', 'epm:write', 'epm:admin'],
        role: token?.roles || ['super_admin', 'hr_manager'],
        iat: now,
        exp: now + 60 * 60,
    };

    const encodedHeader = base64Url(JSON.stringify(header));
    const encodedPayload = base64Url(JSON.stringify(payload));
    const signature = crypto
        .createHmac('sha256', LOCAL_EPM_JWT_KEY)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export default async function handler(req, res) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const path = Array.isArray(req.query.path) ? req.query.path.join('/') : '';
    const query = new URLSearchParams(req.query);
    query.delete('path');

    const targetUrl = `${EPM_API_URL.replace(/\/$/, '')}/api/epm/${path}${query.toString() ? `?${query}` : ''}`;
    const headers = {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Accept': 'application/json',
        'X-Tenant-Id': String(token?.tenantId || req.headers['x-tenant-id'] || '1'),
    };

    if (req.headers.authorization && !req.headers.authorization.includes('local-epm-session')) {
        headers.Authorization = req.headers.authorization;
    } else if (token) {
        headers.Authorization = `Bearer ${createLocalBackendToken(token)}`;
    }

    const init = {
        method: req.method,
        headers,
    };

    if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
        init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    }

    try {
        const response = await fetch(targetUrl, init);
        const contentType = response.headers.get('content-type') || 'application/json';
        const body = await response.arrayBuffer();

        res.status(response.status);
        res.setHeader('content-type', contentType);
        res.send(Buffer.from(body));
    } catch (error) {
        res.status(502).json({
            error: 'تعذر الاتصال بخدمة قياس الأداء',
            details: error.message,
        });
    }
}
