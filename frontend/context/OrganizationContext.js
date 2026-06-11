import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * سياق بيانات الجهة/المنشأة
 * يوفر بيانات الجهة لجميع المكونات في التطبيق
 */

const defaultOrganization = {
    // البيانات الأساسية
    id: '1',
    name: 'منصة مسارات',
    nameEn: 'Masarat Platform',
    shortName: 'مسارات',

    // بيانات التواصل
    phone: '',
    fax: '',
    email: 'info@masarat.sa',
    website: 'www.masarat.sa',

    // العنوان
    address: 'المملكة العربية السعودية',
    city: 'الرياض',
    postalCode: '12345',
    poBox: '12345',

    // السجلات الرسمية
    crNumber: '',
    vatNumber: '',

    // الصور والختم
    logo: null,
    logoLight: null,
    logoDark: null,
    stamp: null,
    watermark: null,

    // إعدادات التقارير
    reportSettings: {
        showLogo: true,
        showStamp: true,
        showWatermark: false,
        showSignatures: true,
        showQRCode: true,
        headerHeight: 80,
        footerHeight: 60,
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 15, bottom: 20, left: 15 },
        fontFamily: 'Cairo',
    },

    // إعدادات التوقيعات
    signatureSettings: {
        maxSignatures: 4,
        showJobTitle: true,
        showDate: true,
        signaturePlacement: 'footer', // 'footer' | 'inline' | 'side'
    },
};

const OrganizationContext = createContext({
    organization: defaultOrganization,
    updateOrganization: () => {},
    updateLogo: () => {},
    updateStamp: () => {},
    loading: true,
});

export function OrganizationProvider({ children }) {
    const [organization, setOrganization] = useState(defaultOrganization);
    const [loading, setLoading] = useState(true);

    // تحميل بيانات الجهة من التخزين المحلي
    useEffect(() => {
        const loadOrganization = () => {
            try {
                const saved = localStorage.getItem('masarat-organization');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setOrganization(prev => ({ ...prev, ...parsed }));
                }
            } catch (error) {
                console.warn('Error loading organization data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (typeof window !== 'undefined') {
            loadOrganization();
        } else {
            setLoading(false);
        }
    }, []);

    // حفظ بيانات الجهة في التخزين المحلي
    const saveOrganization = (data) => {
        try {
            localStorage.setItem('masarat-organization', JSON.stringify(data));
        } catch (error) {
            console.warn('Error saving organization data:', error);
        }
    };

    // تحديث بيانات الجهة
    const updateOrganization = (updates) => {
        setOrganization(prev => {
            const updated = { ...prev, ...updates };
            saveOrganization(updated);
            return updated;
        });
    };

    // تحديث الشعار
    const updateLogo = (logoType, base64Data) => {
        setOrganization(prev => {
            const updated = { ...prev, [logoType]: base64Data };
            saveOrganization(updated);
            return updated;
        });
    };

    // تحديث الختم
    const updateStamp = (base64Data) => {
        setOrganization(prev => {
            const updated = { ...prev, stamp: base64Data };
            saveOrganization(updated);
            return updated;
        });
    };

    // تحديث إعدادات التقارير
    const updateReportSettings = (settings) => {
        setOrganization(prev => {
            const updated = {
                ...prev,
                reportSettings: { ...prev.reportSettings, ...settings }
            };
            saveOrganization(updated);
            return updated;
        });
    };

    return (
        <OrganizationContext.Provider
            value={{
                organization,
                updateOrganization,
                updateLogo,
                updateStamp,
                updateReportSettings,
                loading,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

// Hook للوصول لبيانات الجهة
export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error('useOrganization must be used within OrganizationProvider');
    }
    return context;
}

export { defaultOrganization };
export default OrganizationContext;
