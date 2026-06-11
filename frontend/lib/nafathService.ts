// ============================================================
// ملف: lib/nafathService.ts
// الوصف: خدمة الفرونت إند للتواصل مع API نفاذ
// ============================================================
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';

const API_BASE = '/api';

// ===== Types =====

export interface NafathConfigDto {
  baseUrl: string;
  apiKey: string;
  platformUrl: string;
  verificationMethod: string;
  pollingIntervalSeconds: number;
  sessionTimeoutSeconds: number;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  nafathOnly: boolean;
  autoRegister: boolean;
  enableLogging: boolean;
  isActive: boolean;
}

export interface NafathLoginResponse {
  requestId: string;
  randomNumber: string;
  timeoutSeconds: number;
  verificationMethod: string;
  pollingIntervalSeconds: number;
}

export interface NafathStatusResponse {
  requestId: string;
  status: string;
  redirectUrl?: string;
  token?: string;
}

// ===== Admin APIs =====

export const nafathAdminApi = {
  /** جلب الإعدادات */
  getConfig: async () => {
    const res = await fetch(`${API_BASE}/admin/nafath/config`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  /** حفظ الإعدادات */
  saveConfig: async (config: NafathConfigDto) => {
    const res = await fetch(`${API_BASE}/admin/nafath/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  /** اختبار الاتصال */
  testConnection: async () => {
    const res = await fetch(`${API_BASE}/admin/nafath/test-connection`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  /** جلب الإحصائيات */
  getStats: async (period = 'week') => {
    const res = await fetch(`${API_BASE}/admin/nafath/stats?period=${period}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  /** جلب آخر عمليات الدخول */
  getRecentLogins: async (count = 20) => {
    const res = await fetch(`${API_BASE}/admin/nafath/logins?count=${count}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return res.json();
  },

  /** تفعيل/إيقاف */
  toggle: async (isActive: boolean) => {
    const res = await fetch(`${API_BASE}/admin/nafath/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ isActive })
    });
    return res.json();
  }
};

// ===== Auth APIs (للمستخدمين) =====

export const nafathAuthApi = {
  /** التحقق هل نفاذ مفعل */
  getStatus: async () => {
    const res = await fetch(`${API_BASE}/nafath/status`);
    return res.json();
  },

  /** بدء تسجيل الدخول */
  login: async (nationalId: string) => {
    const res = await fetch(`${API_BASE}/nafath/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nationalId })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'حدث خطأ');
    }
    return res.json() as Promise<NafathLoginResponse>;
  },

  /** التحقق من الحالة (Polling) */
  checkStatus: async (requestId: string) => {
    const res = await fetch(`${API_BASE}/nafath/login/status/${requestId}`);
    return res.json() as Promise<NafathStatusResponse>;
  }
};

// ===== SignalR (بديل الـ Polling) =====

export class NafathSignalR {
  private connection: HubConnection | null = null;

  async connect() {
    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/nafath')
      .withAutomaticReconnect()
      .build();

    await this.connection.start();
  }

  async subscribeToRequest(
    requestId: string,
    onResult: (result: NafathStatusResponse) => void
  ) {
    if (!this.connection) await this.connect();

    await this.connection!.invoke('SubscribeToRequest', requestId);
    this.connection!.on('NafathResult', onResult);
  }

  async unsubscribe(requestId: string) {
    if (this.connection) {
      await this.connection.invoke('UnsubscribeFromRequest', requestId);
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
    }
  }
}

// ===== Hook للدخول عبر نفاذ =====

import { useState, useEffect, useCallback, useRef } from 'react';

export function useNafathLogin() {
  const [step, setStep] = useState<'idle' | 'loading' | 'waiting' | 'success' | 'rejected' | 'expired' | 'error'>('idle');
  const [randomNumber, setRandomNumber] = useState('');
  const [requestId, setRequestId] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const signalR = useRef<NafathSignalR | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    signalR.current?.disconnect();
  }, []);

  const login = useCallback(async (nationalId: string) => {
    try {
      setStep('loading');
      setError('');

      const response = await nafathAuthApi.login(nationalId);
      setRandomNumber(response.randomNumber);
      setRequestId(response.requestId);
      setCountdown(response.timeoutSeconds);
      setStep('waiting');

      // اختيار طريقة المتابعة
      if (response.verificationMethod === 'callback') {
        // استخدام SignalR للإشعار الفوري
        signalR.current = new NafathSignalR();
        await signalR.current.subscribeToRequest(response.requestId, (result) => {
          handleResult(result);
        });
      } else {
        // استخدام Polling
        const pollInterval = (response.pollingIntervalSeconds || 3) * 1000;
        intervalRef.current = setInterval(async () => {
          try {
            const status = await nafathAuthApi.checkStatus(response.requestId);
            if (status.status !== 'WAITING') {
              handleResult(status);
            }
          } catch (e) {
            console.error('Polling error:', e);
          }
        }, pollInterval);
      }
    } catch (e: any) {
      setStep('error');
      setError(e.message || 'حدث خطأ غير متوقع');
    }
  }, []);

  const handleResult = useCallback((result: NafathStatusResponse) => {
    cleanup();

    switch (result.status) {
      case 'SUCCESS':
        setStep('success');
        setToken(result.token || '');
        setRedirectUrl(result.redirectUrl || '/dashboard');
        // حفظ التوكن وتوجيه المستخدم
        if (result.token) {
          localStorage.setItem('authToken', result.token);
          window.location.href = result.redirectUrl || '/dashboard';
        }
        break;
      case 'REJECTED':
        setStep('rejected');
        break;
      case 'EXPIRED':
        setStep('expired');
        break;
      default:
        setStep('error');
        setError('حدث خطأ في عملية التحقق');
    }
  }, [cleanup]);

  // العد التنازلي
  useEffect(() => {
    if (step !== 'waiting' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          cleanup();
          setStep('expired');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown, cleanup]);

  // تنظيف عند الخروج
  useEffect(() => cleanup, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setStep('idle');
    setRandomNumber('');
    setRequestId('');
    setCountdown(0);
    setError('');
    setToken('');
  }, [cleanup]);

  return {
    step,
    randomNumber,
    countdown,
    error,
    token,
    redirectUrl,
    login,
    reset
  };
}

// ===== Helpers =====

function getToken(): string {
  return localStorage.getItem('authToken') || '';
}
