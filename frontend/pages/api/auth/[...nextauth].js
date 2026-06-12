import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import crypto from 'crypto';

const HR_SSO_SECRET = process.env.HR_SSO_SECRET || '';

function base64UrlDecode(segment) {
    return Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

/**
 * تحقق من تذكرة الدخول الموحّد القادمة من نظام الموارد (MasaratHR):
 * JWT HS256 بالسر المشترك HR_SSO_SECRET، مُصدِر MasaratHR وجمهور MasaratEPM،
 * صلاحيتها دقيقتان. ترجع payload أو null.
 */
function verifyHrSsoTicket(ticket) {
    if (!HR_SSO_SECRET || !ticket) return null;
    const parts = String(ticket).split('.');
    if (parts.length !== 3) return null;

    const expected = crypto
        .createHmac('sha256', HR_SSO_SECRET)
        .update(`${parts[0]}.${parts[1]}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    const provided = parts[2];
    if (
        expected.length !== provided.length ||
        !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
    ) {
        return null;
    }

    let payload;
    try {
        payload = JSON.parse(base64UrlDecode(parts[1]));
    } catch {
        return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now - 30) return null;
    if (payload.iss !== 'MasaratHR' || payload.aud !== 'MasaratEPM') return null;
    if (!payload.employeeNumber) return null;
    return payload;
}

const USERS = [
    {
        id: '1000000001',
        nationalId: '1000000001',
        name: 'مدير نظام قياس الأداء',
        email: 'epm.admin@masarat.local',
        password: 'Mm123456',
        roles: ['super_admin', 'hr_manager'],
        permissions: [
            'epm:read',
            'epm:write',
            'epm:admin',
            'hr:read',
            'hr:write',
        ],
        tenantId: 1,
    },
    {
        id: '1000000003',
        nationalId: '1000000003',
        name: 'مدير الموارد البشرية',
        email: 'hr.manager@masarat.local',
        password: 'Mm123456',
        roles: ['hr_manager'],
        permissions: [
            'epm:read',
            'epm:write',
            'hr:read',
            'hr:write',
        ],
        tenantId: 1,
    },
];

export const authOptions = {
    session: {
        strategy: 'jwt',
        maxAge: 8 * 60 * 60,
    },
    providers: [
        CredentialsProvider({
            name: 'PerformanceMeasurementCredentials',
            credentials: {
                username: { label: 'رقم الهوية', type: 'text' },
                password: { label: 'كلمة المرور', type: 'password' },
            },
            async authorize(credentials) {
                const username = String(credentials?.username || '').trim();
                const password = String(credentials?.password || '');
                const user = USERS.find((item) => item.nationalId === username && item.password === password);

                if (!user) {
                    return null;
                }

                return {
                    id: user.id,
                    nationalId: user.nationalId,
                    name: user.name,
                    email: user.email,
                    roles: user.roles,
                    permissions: user.permissions,
                    tenantId: user.tenantId,
                    mustChangePassword: false,
                    passwordExpiresAt: null,
                };
            },
        }),
        CredentialsProvider({
            id: 'hr-sso',
            name: 'MasaratHrSso',
            credentials: {
                ticket: { label: 'HR SSO Ticket', type: 'text' },
            },
            async authorize(credentials) {
                const payload = verifyHrSsoTicket(credentials?.ticket);
                if (!payload) return null;

                const hrRole = String(payload.hrRole || 'EMPLOYEE').toUpperCase();
                const elevated = payload.isManager === 'true'
                    || ['SYSTEM_ADMIN', 'HR_MANAGER', 'MAYOR', 'IT_MANAGER', 'DIRECT_MANAGER'].includes(hrRole);
                const admin = ['SYSTEM_ADMIN', 'HR_MANAGER'].includes(hrRole);

                return {
                    id: payload.employeeNumber,
                    nationalId: payload.employeeNumber,
                    name: payload.name || payload.employeeNumber,
                    email: null,
                    roles: admin
                        ? ['super_admin', 'hr_manager']
                        : elevated
                            ? ['hr_manager']
                            : ['employee'],
                    permissions: admin
                        ? ['epm:read', 'epm:write', 'epm:admin', 'hr:read', 'hr:write']
                        : elevated
                            ? ['epm:read', 'epm:write', 'epm:admin', 'hr:read']
                            : ['epm:read', 'epm:write'],
                    tenantId: 1,
                    mustChangePassword: false,
                    passwordExpiresAt: null,
                };
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.nationalId = user.nationalId;
                token.roles = user.roles || [];
                token.permissions = user.permissions || [];
                token.tenantId = user.tenantId || 1;
                token.mustChangePassword = false;
                token.passwordExpiresAt = null;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                ...session.user,
                id: token.sub,
                nationalId: token.nationalId,
                roles: token.roles || [],
                permissions: token.permissions || [],
                tenantId: token.tenantId || 1,
                mustChangePassword: false,
                passwordExpiresAt: null,
            };
            session.accessToken = 'local-epm-session';
            return session;
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith('/')) return `${baseUrl}${url}`;
            if (url.startsWith(baseUrl)) return url;
            return `${baseUrl}/epm`;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

