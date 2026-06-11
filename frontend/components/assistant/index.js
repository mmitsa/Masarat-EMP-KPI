/**
 * Assistant Components Index
 * تصدير مكونات المساعد الذكي
 */

// المكون الأصلي
export { default as SmartAssistant, SmartAssistantButton } from './SmartAssistant';

// المكون المحسن مع Claude API
export { default as SmartAssistantV2 } from './SmartAssistantV2';

// مكونات الترحيب
export { WelcomePopup, TipPopup, ContextualHelpPopup, FloatingTipBalloon } from './WelcomePopup';

// مكونات الرسائل الغنية
export {
    LeaveBalanceCard,
    DataTableMessage,
    CustodiesCard,
    LeaveRequestCard,
    VehiclesCard,
    ActionButtons,
    ConfirmationMessage,
    SuccessMessage,
    ErrorMessage,
    QuickActions,
    TypingIndicator,
} from './RichMessage';
