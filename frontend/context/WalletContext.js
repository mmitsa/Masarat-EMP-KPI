/**
 * محفظة التعزيزات المالية - Context Provider
 * Financial Allocation Wallet Context
 *
 * ربط حقيقي مع الـ API - قاعدة البيانات هي مصدر الحقيقة
 * Real API integration - Database is the single source of truth
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from './AppContext';
import { useToast } from './NotificationContext';
import { formatCurrency } from '../lib/walletData';

const WalletContext = createContext({
    wallet: null,
    transactions: [],
    loading: false,
    error: null,
    // Actions
    loadWallet: async () => {},
    commitFunds: async () => {},
    releaseFunds: async () => {},
    topUp: async () => {},
    // Checks
    checkAvailability: () => ({ available: false, balance: 0, shortfall: 0 }),
    canIssueDecision: () => ({ allowed: false, reason: '', requiresOverride: false }),
    // Settings
    updateSettings: async () => {},
});


export function WalletProvider({ children }) {
    const toast = useToast();
    const currentUser = useUser();
    const { data: session, status: sessionStatus } = useSession();

    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * جلب الـ API client
     */
    const getApi = useCallback(async () => {
        const mod = await import('../lib/api');
        return mod.default;
    }, []);

    /**
     * تحميل بيانات المحفظة من الـ API
     */
    const loadWallet = useCallback(async () => {
        setLoading(true);
        setError(null);

        // ── جلب من API ──
        try {
            const api = await getApi();
            const walletData = await api.finance.wallet.get();

            if (!walletData) {
                setError('لا توجد محفظة نشطة');
                setWallet(null);
                setTransactions([]);
                return;
            }

            // تحويل البيانات من Backend DTO إلى Frontend format
            setWallet(mapWalletFromApi(walletData));

            // جلب الحركات بشكل منفصل
            try {
                const txnData = await api.finance.wallet.getTransactions({ pageSize: 50 });
                setTransactions((txnData?.items || []).map(mapTransactionFromApi));
            } catch {
                // الحركات اختيارية - المحفظة هي الأهم
                setTransactions([]);
            }
        } catch (err) {
            const message = err?.message || 'فشل الاتصال بخادم المحفظة';
            setError(message);
            setWallet(null);
            setTransactions([]);

            if (process.env.NODE_ENV === 'development') {
                console.warn('[Wallet] خطأ في تحميل المحفظة:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [getApi]);

    // تحميل عند بدء التطبيق (فقط بعد تسجيل الدخول)
    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            loadWallet();
        } else if (sessionStatus === 'unauthenticated') {
            setLoading(false);
        }
    }, [loadWallet, sessionStatus]);

    // ── ارتباط مبلغ (عند إصدار قرار) ──
    const commitFunds = useCallback(async (amount, referenceType, referenceId, description, authorityOverride = false) => {
        if (!wallet) return { success: false, error: 'المحفظة غير محملة' };
        try {
            const api = await getApi();
            const result = await api.finance.wallet.commit({
                amount,
                referenceType: mapReferenceTypeToEnum(referenceType),
                referenceId,
                description,
                authorityOverride,
            });

            if (!result?.success) {
                const errorMsg = result?.message || 'فشل ارتباط المبلغ من المحفظة';
                toast?.error(errorMsg);
                return { success: false, error: errorMsg };
            }

            // تحديث الحالة المحلية من نتيجة الـ API (وليس حساب محلي)
            toast?.success(`تم ارتباط ${formatCurrency(amount)} من المحفظة`);

            // إعادة تحميل المحفظة من الـ API لضمان التزامن
            await loadWallet();

            return {
                success: true,
                transactionCode: result.transactionCode,
                newBalance: result.newBalance,
            };
        } catch (err) {
            const errorMsg = err?.message || 'خطأ في الاتصال أثناء ارتباط المبلغ';
            toast?.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [wallet, getApi, loadWallet, toast]);

    // ── تحرير مبلغ (عند إلغاء قرار) ──
    const releaseFunds = useCallback(async (transactionId) => {
        if (!wallet) return { success: false, error: 'المحفظة غير محملة' };

        try {
            const api = await getApi();
            const result = await api.finance.wallet.release(transactionId);

            if (!result?.success) {
                const errorMsg = result?.message || 'فشل تحرير المبلغ';
                toast?.error(errorMsg);
                return { success: false, error: errorMsg };
            }

            toast?.success(`تم تحرير ${formatCurrency(result.releasedAmount)} إلى المحفظة`);
            await loadWallet();

            return {
                success: true,
                releasedAmount: result.releasedAmount,
                newBalance: result.newBalance,
            };
        } catch (err) {
            const errorMsg = err?.message || 'خطأ في الاتصال أثناء تحرير المبلغ';
            toast?.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [wallet, transactions, getApi, loadWallet, toast]);

    // ── إيداع مبلغ ──
    const topUp = useCallback(async (amount, description, source = 'operational') => {
        if (!wallet) return { success: false, error: 'المحفظة غير محملة' };

        try {
            const api = await getApi();
            const result = await api.finance.wallet.topUp({ amount, description, source });

            if (!result?.success) {
                const errorMsg = result?.message || 'فشل الإيداع في المحفظة';
                toast?.error(errorMsg);
                return { success: false, error: errorMsg };
            }

            toast?.success(`تم إيداع ${formatCurrency(amount)} في المحفظة`);
            await loadWallet();

            return {
                success: true,
                transactionCode: result.transactionCode,
                newBalance: result.newBalance,
            };
        } catch (err) {
            const errorMsg = err?.message || 'خطأ في الاتصال أثناء الإيداع';
            toast?.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [wallet, getApi, loadWallet, toast]);

    // ── فحص توفر الرصيد (محلي - للسرعة) ──
    const checkAvailability = useCallback((amount) => {
        if (!wallet) return { available: false, balance: 0, shortfall: amount };

        const balance = wallet.availableBalance;
        return {
            available: balance >= amount,
            balance,
            shortfall: balance >= amount ? 0 : amount - balance,
        };
    }, [wallet]);

    // ── هل يمكن إصدار القرار؟ (محلي - للسرعة) ──
    const canIssueDecision = useCallback((amount) => {
        if (!wallet) {
            return { allowed: false, reason: 'المحفظة غير محملة', requiresOverride: false };
        }

        if (wallet.status === 'frozen' || wallet.status === 'Frozen') {
            return { allowed: false, reason: 'المحفظة مجمّدة - تواصل مع الإدارة المالية', requiresOverride: false };
        }

        if (amount <= 0) {
            return { allowed: true, reason: '', requiresOverride: false };
        }

        if (wallet.availableBalance >= amount) {
            return { allowed: true, reason: '', requiresOverride: false };
        }

        // الرصيد غير كافٍ
        if (wallet.settings?.authorityOverrideEnabled ?? wallet.authorityOverrideEnabled) {
            return {
                allowed: false,
                reason: `الرصيد غير كافٍ (متاح: ${formatCurrency(wallet.availableBalance)}، مطلوب: ${formatCurrency(amount)}). يتطلب موافقة صاحب الصلاحية للتجاوز.`,
                requiresOverride: true,
            };
        }

        return {
            allowed: false,
            reason: `الرصيد غير كافٍ (متاح: ${formatCurrency(wallet.availableBalance)}، مطلوب: ${formatCurrency(amount)}).`,
            requiresOverride: false,
        };
    }, [wallet]);

    // ── تحديث الإعدادات ──
    const updateSettings = useCallback(async (newSettings) => {
        try {
            const api = await getApi();
            const result = await api.finance.wallet.updateSettings(newSettings);

            if (!result) {
                toast?.error('فشل تحديث الإعدادات');
                return { success: false };
            }

            toast?.success('تم تحديث إعدادات المحفظة');
            await loadWallet();
            return { success: true };
        } catch (err) {
            const errorMsg = err?.message || 'خطأ في الاتصال أثناء تحديث الإعدادات';
            toast?.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    }, [getApi, loadWallet, toast]);

    const value = useMemo(() => ({
        wallet,
        transactions,
        loading,
        error,

        loadWallet,
        commitFunds,
        releaseFunds,
        topUp,
        checkAvailability,
        canIssueDecision,
        updateSettings,
    }), [
        wallet, transactions, loading, error,
        loadWallet, commitFunds, releaseFunds, topUp,
        checkAvailability, canIssueDecision, updateSettings,
    ]);

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export const useWallet = () => useContext(WalletContext);

// ════════════════════════════════════════════════
// تحويل البيانات: API DTO → Frontend Format
// ════════════════════════════════════════════════

function mapWalletFromApi(data) {
    return {
        id: data.id,
        walletCode: data.walletCode,
        name: data.name,
        fiscalYear: data.fiscalYear,
        totalAllocated: data.totalAllocated,
        totalCommitted: data.totalCommitted,
        totalSpent: data.totalSpent,
        availableBalance: data.availableBalance,
        status: mapStatusFromEnum(data.status),
        currency: data.currency || 'SAR',
        settings: {
            autoFreeze: data.autoFreeze,
            lowBalanceThreshold: data.lowBalanceThreshold,
            authorityOverrideEnabled: data.authorityOverrideEnabled,
            requireApprovalAbove: data.requireApprovalAbove,
        },
        // تضمين كـ flat properties أيضاً للتوافق
        autoFreeze: data.autoFreeze,
        lowBalanceThreshold: data.lowBalanceThreshold,
        authorityOverrideEnabled: data.authorityOverrideEnabled,
        requireApprovalAbove: data.requireApprovalAbove,
        notes: data.notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}

function mapTransactionFromApi(data) {
    return {
        id: data.id,
        transactionCode: data.transactionCode,
        walletId: data.walletId,
        type: mapTransactionTypeFromEnum(data.transactionType),
        amount: data.amount,
        referenceType: mapReferenceTypeFromEnum(data.referenceType),
        referenceId: data.referenceId,
        description: data.description,
        performedBy: {
            id: data.performedById,
            name: data.performedByName || '',
            role: data.performedByRole || '',
        },
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        authorityOverride: data.authorityOverride,
        source: data.source,
        createdAt: data.createdAt,
    };
}

// ════════════════════════════════════════════════
// تحويل Enum: Backend (int/string) ↔ Frontend (string)
// ════════════════════════════════════════════════

const STATUS_MAP = { 1: 'active', 2: 'frozen', 3: 'depleted', 4: 'closed', Active: 'active', Frozen: 'frozen', Depleted: 'depleted', Closed: 'closed' };
const TXN_TYPE_MAP = { 1: 'commitment', 2: 'release', 3: 'topup', 4: 'adjustment', Commitment: 'commitment', Release: 'release', TopUp: 'topup', Adjustment: 'adjustment' };
const REF_TYPE_MAP = { 1: 'secondment', 2: 'overtime', 3: 'topup', 4: 'adjustment', Secondment: 'secondment', Overtime: 'overtime', TopUp: 'topup', Adjustment: 'adjustment' };

const REF_TYPE_TO_ENUM = { secondment: 'Secondment', overtime: 'Overtime', topup: 'TopUp', adjustment: 'Adjustment' };

function mapStatusFromEnum(val) { return STATUS_MAP[val] || String(val).toLowerCase(); }
function mapTransactionTypeFromEnum(val) { return TXN_TYPE_MAP[val] || String(val).toLowerCase(); }
function mapReferenceTypeFromEnum(val) { return REF_TYPE_MAP[val] || String(val).toLowerCase(); }
function mapReferenceTypeToEnum(val) { return REF_TYPE_TO_ENUM[val] || val; }

