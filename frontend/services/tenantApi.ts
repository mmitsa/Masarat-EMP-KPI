/**
 * Tenant API Client Service - خدمة عميل API للمستأجرين
 * 
 * @version 1.0.0
 * @date 2026-01-27
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

// Types
export interface Tenant {
  id: string;
  name: string;
  nameAr: string;
  subdomain: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'pending' | 'expired';
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  createdAt: string;
  expiresAt: string;
  settings?: TenantSettings;
  features?: TenantFeatures;
  limits?: TenantLimits;
}

export interface TenantSettings {
  theme?: 'light' | 'dark' | 'system';
  language?: 'ar' | 'en';
  timezone?: string;
  dateFormat?: string;
  logo?: string;
  primaryColor?: string;
}

export interface TenantFeatures {
  hr: boolean;
  warehouse: boolean;
  movement: boolean;
  archiving: boolean;
  epm: boolean;
  sadad: boolean;
  analytics: boolean;
}

export interface TenantLimits {
  maxUsers: number;
  maxStorageGB: number;
  maxApiCallsPerDay: number;
}

export interface TenantStats {
  usersCount: number;
  storageUsedMB: number;
  apiCallsToday: number;
  lastActivityAt: string;
}

export interface CreateTenantRequest {
  name: string;
  nameAr: string;
  subdomain: string;
  email: string;
  phone: string;
  plan: Tenant['plan'];
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  features?: Partial<TenantFeatures>;
}

export interface UpdateTenantRequest {
  name?: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  settings?: Partial<TenantSettings>;
  features?: Partial<TenantFeatures>;
  limits?: Partial<TenantLimits>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  messageAr?: string;
  details?: Record<string, string[]>;
}

// API Client
class TenantApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }
        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * 🛡️ Security: Token storage
   * ⚠️ تحذير: localStorage ليس الخيار الأمثل للتخزين
   * TODO: التحويل إلى httpOnly cookies للإنتاج
   */
  private _adminToken: string | null = null;

  /**
   * تعيين Token من مصدر آمن (Session)
   */
  public setAdminToken(token: string | null): void {
    this._adminToken = token;
  }

  private getToken(): string | null {
    // 🛡️ Security: تفضيل Token المخزن في الذاكرة
    if (this._adminToken) {
      return this._adminToken;
    }
    // Fallback للتوافق - يجب إزالته في الإنتاج
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      return localStorage.getItem('admin_token');
    }
    return null;
  }

  private handleUnauthorized(): void {
    this._adminToken = null;
    if (typeof window !== 'undefined') {
      // 🛡️ Security: تنظيف localStorage في التطوير فقط
      if (process.env.NODE_ENV === 'development') {
        localStorage.removeItem('admin_token');
      }
      window.location.href = '/admin/login';
    }
  }

  private formatError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error occurred',
      messageAr: 'حدث خطأ في الاتصال'
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // Tenant CRUD Operations
  // ═══════════════════════════════════════════════════════════════

  /**
   * الحصول على قائمة المستأجرين
   */
  async getTenants(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    plan?: string;
    search?: string;
  }): Promise<PaginatedResponse<Tenant>> {
    const response = await this.client.get<PaginatedResponse<Tenant>>('/admin/tenants', { params });
    return response.data;
  }

  /**
   * الحصول على مستأجر بالـ ID
   */
  async getTenant(id: string): Promise<Tenant> {
    const response = await this.client.get<Tenant>(`/admin/tenants/${id}`);
    return response.data;
  }

  /**
   * الحصول على مستأجر بالنطاق الفرعي
   */
  async getTenantBySubdomain(subdomain: string): Promise<Tenant> {
    const response = await this.client.get<Tenant>(`/admin/tenants/subdomain/${subdomain}`);
    return response.data;
  }

  /**
   * إنشاء مستأجر جديد
   */
  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    const response = await this.client.post<Tenant>('/admin/tenants', data);
    return response.data;
  }

  /**
   * تحديث مستأجر
   */
  async updateTenant(id: string, data: UpdateTenantRequest): Promise<Tenant> {
    const response = await this.client.put<Tenant>(`/admin/tenants/${id}`, data);
    return response.data;
  }

  /**
   * حذف مستأجر
   */
  async deleteTenant(id: string): Promise<void> {
    await this.client.delete(`/admin/tenants/${id}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // Tenant Status Management
  // ═══════════════════════════════════════════════════════════════

  /**
   * تفعيل مستأجر
   */
  async activateTenant(id: string): Promise<Tenant> {
    const response = await this.client.post<Tenant>(`/admin/tenants/${id}/activate`);
    return response.data;
  }

  /**
   * إيقاف مستأجر
   */
  async suspendTenant(id: string, reason?: string): Promise<Tenant> {
    const response = await this.client.post<Tenant>(`/admin/tenants/${id}/suspend`, { reason });
    return response.data;
  }

  /**
   * التحقق من توفر النطاق الفرعي
   */
  async checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean }> {
    const response = await this.client.get<{ available: boolean }>(
      `/admin/tenants/check-subdomain/${subdomain}`
    );
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // Tenant Statistics
  // ═══════════════════════════════════════════════════════════════

  /**
   * الحصول على إحصائيات مستأجر
   */
  async getTenantStats(id: string): Promise<TenantStats> {
    const response = await this.client.get<TenantStats>(`/admin/tenants/${id}/stats`);
    return response.data;
  }

  /**
   * الحصول على إحصائيات عامة
   */
  async getOverallStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    totalUsers: number;
    totalStorageGB: number;
    revenueThisMonth: number;
  }> {
    const response = await this.client.get('/admin/tenants/stats/overall');
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // Tenant Settings
  // ═══════════════════════════════════════════════════════════════

  /**
   * تحديث إعدادات المستأجر
   */
  async updateTenantSettings(id: string, settings: Partial<TenantSettings>): Promise<TenantSettings> {
    const response = await this.client.patch<TenantSettings>(`/admin/tenants/${id}/settings`, settings);
    return response.data;
  }

  /**
   * تحديث حدود المستأجر
   */
  async updateTenantLimits(id: string, limits: Partial<TenantLimits>): Promise<TenantLimits> {
    const response = await this.client.patch<TenantLimits>(`/admin/tenants/${id}/limits`, limits);
    return response.data;
  }

  /**
   * تحديث خدمات المستأجر
   */
  async updateTenantFeatures(id: string, features: Partial<TenantFeatures>): Promise<TenantFeatures> {
    const response = await this.client.patch<TenantFeatures>(`/admin/tenants/${id}/features`, features);
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // Tenant Users
  // ═══════════════════════════════════════════════════════════════

  /**
   * الحصول على مستخدمي المستأجر
   */
  async getTenantUsers(id: string, params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    lastLoginAt: string;
  }>> {
    const response = await this.client.get(`/admin/tenants/${id}/users`, { params });
    return response.data;
  }

  /**
   * إعادة تعيين كلمة مرور المسؤول
   */
  async resetAdminPassword(tenantId: string, adminEmail: string): Promise<{ temporaryPassword: string }> {
    const response = await this.client.post(`/admin/tenants/${tenantId}/reset-admin-password`, {
      adminEmail
    });
    return response.data;
  }
}

// Singleton instance
export const tenantApi = new TenantApiClient();

// React Hook
import { useState, useCallback } from 'react';

export function useTenants() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getTenants: (params?: Parameters<typeof tenantApi.getTenants>[0]) => 
      execute(() => tenantApi.getTenants(params)),
    getTenant: (id: string) => execute(() => tenantApi.getTenant(id)),
    createTenant: (data: CreateTenantRequest) => execute(() => tenantApi.createTenant(data)),
    updateTenant: (id: string, data: UpdateTenantRequest) => 
      execute(() => tenantApi.updateTenant(id, data)),
    deleteTenant: (id: string) => execute(() => tenantApi.deleteTenant(id)),
    activateTenant: (id: string) => execute(() => tenantApi.activateTenant(id)),
    suspendTenant: (id: string, reason?: string) => execute(() => tenantApi.suspendTenant(id, reason)),
    checkSubdomain: (subdomain: string) => 
      execute(() => tenantApi.checkSubdomainAvailability(subdomain)),
    getTenantStats: (id: string) => execute(() => tenantApi.getTenantStats(id)),
    getOverallStats: () => execute(() => tenantApi.getOverallStats())
  };
}
