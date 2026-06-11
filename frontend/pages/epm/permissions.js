import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import ModulePermissionsPage from '../../components/setup/ModulePermissionsPage';
import PermissionGuard, { PermissionDenied } from '../../components/PermissionGuard';

export default function EPMPermissions() {
    return (
        <AppLayout
            title="صلاحيات قياس الأداء"
            subtitle="إدارة صلاحيات الوصول والعمليات لنظام قياس الأداء"
        >
            <PermissionGuard
                requires="it_permissions:manage"
                fallback={<PermissionDenied message="هذه الصفحة متاحة فقط لمدير تقنية المعلومات" />}
            >
                <ModulePermissionsPage moduleId="epm" />
            </PermissionGuard>
        </AppLayout>
    );
}
