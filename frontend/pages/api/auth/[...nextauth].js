import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

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

