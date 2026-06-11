/**
 * PasswordExpiryBanner - بانر تحذير انتهاء كلمة المرور
 * يظهر أعلى الصفحة إذا بقي أقل من 10 أيام
 */
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { isPasswordExpiringSoon } from '../../lib/passwordPolicy';

export default function PasswordExpiryBanner() {
    const { data: session } = useSession();
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || !session?.user?.passwordExpiresAt) return null;

    const { expiring, daysLeft } = isPasswordExpiringSoon(session.user.passwordExpiresAt);
    if (!expiring) return null;

    return (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3" dir="rtl">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>تنبيه:</strong> ستنتهي صلاحية كلمة المرور خلال{' '}
                        <strong>{daysLeft}</strong> {daysLeft === 1 ? 'يوم' : 'أيام'}.
                        يرجى تغييرها لتجنب تعليق الحساب.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => router.push('/change-password?reason=voluntary')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                        تغيير الآن
                    </button>
                    <button
                        onClick={() => setDismissed(true)}
                        className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-lg transition-colors"
                    >
                        لاحقاً
                    </button>
                </div>
            </div>
        </div>
    );
}
