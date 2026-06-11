/**
 * PasswordGuard - حارس سياسة كلمة المرور
 * يفحص عند كل صفحة ما إذا كان يجب إجبار تغيير كلمة المرور
 */
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { isPasswordExpired } from '../../lib/passwordPolicy';

const EXCLUDED_PATHS = ['/login', '/change-password', '/forgot-password', '/api/', '/platform-admin'];

export default function PasswordGuard({ children }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status !== 'authenticated' || !session?.user) return;

        const currentPath = router.pathname;
        if (EXCLUDED_PATHS.some(p => currentPath.startsWith(p))) return;

        if (session.user.mustChangePassword) {
            router.replace('/change-password?reason=first_login');
            return;
        }

        if (isPasswordExpired(session.user.passwordExpiresAt)) {
            router.replace('/change-password?reason=expired');
        }
    }, [session, status, router.pathname]);

    return children;
}
