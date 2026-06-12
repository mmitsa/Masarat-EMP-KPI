import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';

/**
 * بوابة الدخول الموحّد من نظام الموارد (MasaratHR):
 * تستقبل ?ticket=… الموقّعة من جسر الموارد وتحوّلها إلى جلسة NextAuth
 * عبر مزوّد hr-sso ثم تفتح لوحة قياس الأداء مباشرة.
 */
export default function HrSsoPage() {
    const router = useRouter();
    const [error, setError] = useState(null);
    const attempted = useRef(false);

    useEffect(() => {
        if (!router.isReady || attempted.current) return;
        const ticket = router.query.ticket;
        if (!ticket) {
            setError('لا توجد تذكرة دخول — افتح النظام من بوابة الموظف في نظام الموارد.');
            return;
        }

        attempted.current = true;
        signIn('hr-sso', {
            ticket: String(ticket),
            redirect: false,
        }).then((result) => {
            if (result?.ok) {
                const target = typeof router.query.next === 'string' && router.query.next.startsWith('/')
                    ? router.query.next
                    : '/epm';
                window.location.replace(target);
            } else {
                setError('انتهت صلاحية تذكرة الدخول أو أنها غير صالحة — أعد فتح النظام من بوابة الموظف.');
            }
        });
    }, [router.isReady, router.query.ticket, router.query.next]);

    return (
        <div dir="rtl" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Tahoma, Arial, sans-serif',
            background: '#f4f6f8',
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: '32px 48px',
                boxShadow: '0 4px 18px rgba(0,0,0,.08)',
                textAlign: 'center',
                maxWidth: 420,
            }}>
                {error ? (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                        <h2 style={{ margin: '0 0 8px', color: '#b91c1c', fontSize: 18 }}>تعذّر الدخول الموحّد</h2>
                        <p style={{ margin: 0, color: '#555', fontSize: 14, lineHeight: 1.8 }}>{error}</p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                        <h2 style={{ margin: '0 0 8px', color: '#0f3d5e', fontSize: 18 }}>نظام قياس الأداء الوظيفي</h2>
                        <p style={{ margin: 0, color: '#555', fontSize: 14 }}>جارٍ تسجيل دخولك من نظام الموارد…</p>
                    </>
                )}
            </div>
        </div>
    );
}
