/**
 * إعدادات الجهة وصاحب الصلاحية
 * Organization Settings & Authority Holder Management
 */

import api from '../api';

// ============================================
// القيم الافتراضية
// ============================================

const DEFAULT_ORG_SETTINGS = {
    organizationNameAr: '',
    organizationNameEn: '',
    organizationLogo: null,
    authorityHolderId: null,
    authorityHolderName: '',
    authorityHolderPosition: 'رئيس الجهة',
    deputyAuthorityId: null,
    deputyAuthorityName: '',
};

const ORG_STORAGE_KEY = 'masarat-org-settings';

// ============================================
// تحميل وحفظ محلي
// ============================================

function loadSettingsFromStorage() {
    if (typeof window === 'undefined') return null;
    try {
        const saved = localStorage.getItem(ORG_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

function saveSettingsToStorage(settings) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Error saving org settings:', e);
    }
}

// ============================================
// API Functions
// ============================================

/**
 * جلب إعدادات الجهة من API أو localStorage
 */
export async function getOrganizationSettings() {
    try {
        const response = await api.saas?.getTenantSettings?.();
        if (response) {
            const settings = {
                organizationNameAr: response.nameAr || response.organizationNameAr || '',
                organizationNameEn: response.nameEn || response.organizationNameEn || '',
                organizationLogo: response.logo || response.organizationLogo || null,
                authorityHolderId: response.authorityHolderId || null,
                authorityHolderName: response.authorityHolderName || '',
                authorityHolderPosition: response.authorityHolderPosition || 'رئيس الجهة',
                deputyAuthorityId: response.deputyAuthorityId || null,
                deputyAuthorityName: response.deputyAuthorityName || '',
            };
            saveSettingsToStorage(settings);
            return settings;
        }
    } catch {
        // fallback to localStorage
    }
    return loadSettingsFromStorage() || { ...DEFAULT_ORG_SETTINGS };
}

/**
 * تحديث إعدادات الجهة
 */
export async function updateOrganizationSettings(updates) {
    try {
        await api.saas?.updateTenantSettings?.(updates);
    } catch {
        // save locally on API failure
    }
    const current = loadSettingsFromStorage() || { ...DEFAULT_ORG_SETTINGS };
    const updated = { ...current, ...updates };
    saveSettingsToStorage(updated);
    return updated;
}

/**
 * تعيين صاحب الصلاحية
 * @param {object} employee - بيانات الموظف { id, name, position }
 */
export async function setAuthorityHolder(employee) {
    if (!employee?.id) return null;
    return updateOrganizationSettings({
        authorityHolderId: employee.id,
        authorityHolderName: employee.name || '',
        authorityHolderPosition: employee.position || 'رئيس الجهة',
    });
}

/**
 * تعيين نائب صاحب الصلاحية
 */
export async function setDeputyAuthority(employee) {
    if (!employee?.id) return null;
    return updateOrganizationSettings({
        deputyAuthorityId: employee.id,
        deputyAuthorityName: employee.name || '',
    });
}

/**
 * بناء عقدة جذر الهيكل التنظيمي (الجهة)
 */
export function buildRootNode(settings) {
    if (!settings?.organizationNameAr) return null;
    return {
        id: 'org-root',
        type: 'organization',
        name: settings.organizationNameAr,
        nameEn: settings.organizationNameEn,
        logo: settings.organizationLogo,
        manager: settings.authorityHolderId ? {
            id: settings.authorityHolderId,
            name: settings.authorityHolderName,
            position: settings.authorityHolderPosition,
        } : null,
        deputy: settings.deputyAuthorityId ? {
            id: settings.deputyAuthorityId,
            name: settings.deputyAuthorityName,
        } : null,
    };
}

export { DEFAULT_ORG_SETTINGS };
