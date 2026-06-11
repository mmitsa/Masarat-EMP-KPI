/**
 * Masarat Unified Platform Configuration
 * Updated: 2026-01-24
 */

const config = {
    // Application Info
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'منصة مسارات الموحدة',
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',

    // Environment
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    enableMockData: false, // Mock data disabled - using real API

    // API Gateway (Main Entry Point)
    // Browser: relative URLs to avoid mixed-content; Server: direct Gateway URL
    apiBaseUrl: typeof window !== 'undefined'
        ? '' // Browser: relative URLs, proxied by Next.js catch-all
        : (process.env.INTERNAL_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080'),

    // System Paths (relative to Gateway)
    systems: {
        hr: '/api/hr',
        warehouse: '/api/warehouse',
        movement: '/api/movement',
        archiving: '/api/archiving',
        sadad: '/api/sadad',
        epm: '/api/epm',
        analytics: '/api/analytics',
        saas: '/api/saas',
        identity: '/api/identity',
        reports: '/api/reports',
        agents: '/api/agents',
        authorization: '/api/authorization'
    },

    // Direct Service URLs (for fallback or direct access)
    services: {
        hr: process.env.NEXT_PUBLIC_HR_API_URL || 'http://localhost:5001',
        warehouse: process.env.NEXT_PUBLIC_WAREHOUSE_API_URL || 'http://localhost:5002',
        movement: process.env.NEXT_PUBLIC_MOVEMENT_API_URL || 'http://localhost:5003',
        archiving: process.env.NEXT_PUBLIC_ARCHIVING_API_URL || 'http://localhost:5004',
        sadad: process.env.NEXT_PUBLIC_SADAD_API_URL || 'http://localhost:5005',
        epm: process.env.NEXT_PUBLIC_EPM_API_URL || 'http://localhost:5006',
        analytics: process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'http://localhost:5007',
        saas: process.env.NEXT_PUBLIC_SAAS_API_URL || 'http://localhost:5008',
        identity: process.env.NEXT_PUBLIC_IDENTITY_URL || 'http://localhost:5000',
        agents: process.env.NEXT_PUBLIC_AGENTS_API_URL || 'http://localhost:5010'
    },

    // Feature Flags
    features: {
        hr: process.env.NEXT_PUBLIC_ENABLE_HR !== 'false',
        warehouse: process.env.NEXT_PUBLIC_ENABLE_WAREHOUSE !== 'false',
        movement: process.env.NEXT_PUBLIC_ENABLE_MOVEMENT !== 'false',
        archiving: process.env.NEXT_PUBLIC_ENABLE_ARCHIVING !== 'false',
        sadad: process.env.NEXT_PUBLIC_ENABLE_SADAD !== 'false',
        epm: process.env.NEXT_PUBLIC_ENABLE_EPM !== 'false',
        analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false',
        saas: process.env.NEXT_PUBLIC_ENABLE_SAAS !== 'false',
        agents: process.env.NEXT_PUBLIC_ENABLE_AGENTS !== 'false'
    },

    // System Display Info
    systemInfo: {
        hr: {
            name: 'الموارد البشرية',
            nameEn: 'Human Resources',
            description: 'إدارة الموظفين والرواتب والإجازات',
            color: 'emerald',
            icon: 'users'
        },
        warehouse: {
            name: 'المستودعات',
            nameEn: 'Warehouse',
            description: 'إدارة المخزون والعهد والأصول',
            color: 'blue',
            icon: 'cube'
        },
        movement: {
            name: 'الحركة',
            nameEn: 'Movement',
            description: 'إدارة المركبات والسائقين والرحلات',
            color: 'amber',
            icon: 'truck'
        },
        archiving: {
            name: 'الأرشفة',
            nameEn: 'Archiving',
            description: 'أرشفة المعاملات والوثائق الرسمية',
            color: 'violet',
            icon: 'archive'
        },
        sadad: {
            name: 'سداد',
            nameEn: 'SADAD',
            description: 'نظام الدفع والفواتير',
            color: 'rose',
            icon: 'credit-card'
        },
        epm: {
            name: 'قياس الأداء',
            nameEn: 'EPM',
            description: 'تقييم ومتابعة أداء الموظفين',
            color: 'purple',
            icon: 'chart-bar'
        },
        analytics: {
            name: 'التحليلات',
            nameEn: 'Analytics',
            description: 'لوحات التحليل والذكاء الاصطناعي',
            color: 'indigo',
            icon: 'chart-pie'
        },
        saas: {
            name: 'SaaS',
            nameEn: 'SaaS',
            description: 'إدارة المستأجرين والاشتراكات',
            color: 'teal',
            icon: 'cloud'
        },
        agents: {
            name: 'الوكلاء الذكيين',
            nameEn: 'AI Agents',
            description: 'إدارة فريق الوكلاء الذكيين ومهامهم',
            color: 'cyan',
            icon: 'robot'
        }
    }
};

export default config;
