/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ========== الألوان الحكومية ==========
      colors: {
        // الأخضر السعودي الرسمي (Primary)
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#165C2D', // الأخضر السعودي الرسمي
          600: '#145228',
          700: '#124823',
          800: '#0f3d1d',
          900: '#0d3318',
          950: '#0a2912',
        },
        // الذهبي الرسمي (Secondary)
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#D4AF37', // الذهبي الرسمي
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // ألوان ثانوية
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        // النجاح
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#059669',
          600: '#047857',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // التحذير
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d97706',
          600: '#b45309',
          700: '#a16207',
          800: '#92400e',
          900: '#78350f',
        },
        // الخطأ
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        // المعلومات
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0a3958',
        },
        // الرمادي المحايد
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0f172a',
        },
        // الألوان السعودية للتوافق
        saudi: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#165C2D',
          600: '#145228',
          700: '#124823',
          800: '#0f3d1d',
          900: '#0d3318',
        },
      },
      // ========== المسافات ==========
      spacing: {
        0: '0px',
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        3.5: '14px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        11: '44px',
        12: '48px',
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px',
        28: '112px',
        32: '128px',
        36: '144px',
        40: '160px',
        44: '176px',
        48: '192px',
        52: '208px',
        56: '224px',
        60: '240px',
        64: '256px',
        72: '288px',
        80: '320px',
        96: '384px',
      },
      // ========== نصف القطر ==========
      borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '6px',
        base: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
      },
      // ========== الخطوط ==========
      fontFamily: {
        sans: [
          'Cairo',
          '"IBM Plex Sans Arabic"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        cairo: ['Cairo', 'sans-serif'],
        'ibm-arabic': ['"IBM Plex Sans Arabic"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
      // ========== أحجام الخطوط ==========
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '0.005em' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '56px' }],
        '6xl': ['60px', { lineHeight: '68px' }],
        '7xl': ['72px', { lineHeight: '80px' }],
      },
      // ========== أوزان الخطوط ==========
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      // ========== الظلال ==========
      boxShadow: {
        none: 'none',
        xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        base: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        md: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
        xl: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.2)',
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        dropdown: '0 4px 12px rgba(0, 0, 0, 0.1)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-lg': 'inset 0 4px 6px 0 rgba(0, 0, 0, 0.1)',
        // ظلال ملونة
        'primary-sm': '0 4px 14px 0 rgba(22, 92, 45, 0.25)',
        'primary-md': '0 8px 24px 0 rgba(22, 92, 45, 0.3)',
        'gold-sm': '0 4px 14px 0 rgba(212, 175, 55, 0.25)',
        'success-sm': '0 4px 14px 0 rgba(5, 150, 105, 0.25)',
        'error-sm': '0 4px 14px 0 rgba(220, 38, 38, 0.25)',
      },
      // ========== الرسوم المتحركة ==========
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        fadeOut: 'fadeOut 0.3s ease-in-out',
        slideUp: 'slideUp 0.3s ease-in-out',
        slideDown: 'slideDown 0.3s ease-in-out',
        slideRight: 'slideRight 0.3s ease-in-out',
        slideLeft: 'slideLeft 0.3s ease-in-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        scaleOut: 'scaleOut 0.2s ease-in',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      // ========== الانتقالات ==========
      transitionDuration: {
        0: '0ms',
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        250: '250ms',
        300: '300ms',
        350: '350ms',
        400: '400ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
      },
      transitionTimingFunction: {
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      // ========== الحدود ==========
      borderWidth: {
        DEFAULT: '1px',
        0: '0px',
        2: '2px',
        3: '3px',
        4: '4px',
        8: '8px',
      },
      // ========== Z-Index ==========
      zIndex: {
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
        notification: '1080',
      },
      // ========== أبعاد مخصصة ==========
      width: {
        sidebar: '280px',
        'sidebar-collapsed': '72px',
      },
      height: {
        header: '64px',
        'header-mobile': '56px',
      },
      minHeight: {
        screen: '100vh',
        'screen-small': '100svh',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      // ========== الشاشة ==========
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
      // ========== التباعد بين الخطوط ==========
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      // ========== ارتفاع السطر ==========
      lineHeight: {
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
        3: '.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        7: '1.75rem',
        8: '2rem',
        9: '2.25rem',
        10: '2.5rem',
      },
      // ========== التدرجات ==========
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #165C2D 0%, #1e7b3e 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #f5d066 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
      // ========== Backdrop Blur ==========
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
    },
  },
  plugins: [
    // RTL Support
    function({ addUtilities }) {
      addUtilities({
        '.text-start': { textAlign: 'start' },
        '.text-end': { textAlign: 'end' },
        '.start-0': { insetInlineStart: '0' },
        '.end-0': { insetInlineEnd: '0' },
        '.ms-auto': { marginInlineStart: 'auto' },
        '.me-auto': { marginInlineEnd: 'auto' },
        '.ps-4': { paddingInlineStart: '1rem' },
        '.pe-4': { paddingInlineEnd: '1rem' },
        '.border-s': { borderInlineStartWidth: '1px' },
        '.border-e': { borderInlineEndWidth: '1px' },
      });
    },
    // Scrollbar Utilities
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '4px',
            height: '4px',
          },
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
    // Glass Effect
    function({ addUtilities }) {
      addUtilities({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
        },
        '.glass-dark': {
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
        },
      });
    },
  ],
  corePlugins: {
    preflight: true,
  },
};
