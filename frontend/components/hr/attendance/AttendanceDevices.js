import React, { useState, useEffect, useCallback } from 'react';
import { DataTable, Badge, Button, Modal } from '../../ui';

export default function AttendanceDevices({ darkMode: darkModeProp }) {
    // darkMode اختياري - إذا لم يُمرر يتم اكتشافه تلقائياً
    const [autoDarkMode, setAutoDarkMode] = useState(false);
    useEffect(() => {
        if (darkModeProp === undefined) {
            setAutoDarkMode(document.documentElement.classList.contains('dark'));
        }
    }, [darkModeProp]);
    const darkMode = darkModeProp ?? autoDarkMode;
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState({});
    const [testing, setTesting] = useState({});

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const [selectedDevice, setSelectedDevice] = useState(null);
    const [deviceUsers, setDeviceUsers] = useState([]);
    const [syncResults, setSyncResults] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        deviceName: '',
        deviceIp: '',
        devicePort: 4370,
        protocol: 'udp',
        serialNumber: '',
        model: '',
        location: '',
        isActive: true,
        autoSync: true,
        syncInterval: 5
    });
    const [formErrors, setFormErrors] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [testingConnection, setTestingConnection] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        online: 0,
        offline: 0,
        todayRecords: 0
    });

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/hr/attendance/devices?action=list');
            const data = await response.json();

            if (data.success) {
                setDevices(data.devices);
                calculateStats(data.devices);
            }
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (deviceList) => {
        const stats = {
            total: deviceList.length,
            online: deviceList.filter(d => d.isOnline).length,
            offline: deviceList.filter(d => !d.isOnline).length,
            todayRecords: deviceList.reduce((sum, d) => sum + (d.todayRecords || 0), 0)
        };
        setStats(stats);
    };

    // Test connection
    const handleTestConnection = async (device = null) => {
        const ip = device ? device.deviceIp : formData.deviceIp;
        const port = device ? device.devicePort : formData.devicePort;
        const protocol = device ? device.protocol : formData.protocol;

        if (!ip) {
            setFormErrors({ deviceIp: 'يرجى إدخال عنوان IP' });
            return;
        }

        if (device) {
            setTesting({ ...testing, [device.id]: true });
        } else {
            setTestingConnection(true);
        }

        setTestResult(null);

        try {
            const response = await fetch('/api/hr/attendance/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'test',
                    deviceIp: ip,
                    devicePort: port,
                    protocol: protocol
                })
            });

            const result = await response.json();
            setTestResult(result);

            if (device) {
                // Update device status
                setDevices(prev => prev.map(d =>
                    d.id === device.id ? { ...d, isOnline: result.success } : d
                ));
            }
        } catch (error) {
            setTestResult({ success: false, message: error.message });
        } finally {
            if (device) {
                setTesting({ ...testing, [device.id]: false });
            } else {
                setTestingConnection(false);
            }
        }
    };

    // Sync device
    const handleSync = async (device) => {
        setSyncing({ ...syncing, [device.id]: true });

        try {
            const response = await fetch(`/api/hr/attendance/devices?action=sync&id=${device.id}`);
            const result = await response.json();

            if (result.success) {
                setDevices(prev => prev.map(d =>
                    d.id === device.id ? result.device : d
                ));
                calculateStats(devices.map(d =>
                    d.id === device.id ? result.device : d
                ));
            }

            setSyncResults({
                device: device.deviceName,
                ...result
            });
            setShowSyncModal(true);
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setSyncing({ ...syncing, [device.id]: false });
        }
    };

    // Sync all devices
    const handleSyncAll = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/hr/attendance/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync-all' })
            });

            const result = await response.json();

            if (result.success) {
                setDevices(result.devices);
                calculateStats(result.devices);
                setSyncResults({
                    device: 'جميع الأجهزة',
                    results: result.results
                });
                setShowSyncModal(true);
            }
        } catch (error) {
            console.error('Sync all error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Add device
    const handleAddDevice = async () => {
        // Validate
        const errors = {};
        if (!formData.deviceName) errors.deviceName = 'اسم الجهاز مطلوب';
        if (!formData.deviceIp) errors.deviceIp = 'عنوان IP مطلوب';
        if (!formData.devicePort) errors.devicePort = 'المنفذ مطلوب';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/hr/attendance/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                setDevices([...devices, result.device]);
                calculateStats([...devices, result.device]);
                setShowAddModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Add device error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Edit device
    const handleEditDevice = async () => {
        const errors = {};
        if (!formData.deviceName) errors.deviceName = 'اسم الجهاز مطلوب';
        if (!formData.deviceIp) errors.deviceIp = 'عنوان IP مطلوب';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/hr/attendance/devices', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedDevice.id, ...formData })
            });

            const result = await response.json();

            if (result.success) {
                setDevices(prev => prev.map(d =>
                    d.id === selectedDevice.id ? result.device : d
                ));
                setShowEditModal(false);
                resetForm();
            }
        } catch (error) {
            console.error('Edit device error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Delete device
    const handleDeleteDevice = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/hr/attendance/devices?id=${selectedDevice.id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                const updatedDevices = devices.filter(d => d.id !== selectedDevice.id);
                setDevices(updatedDevices);
                calculateStats(updatedDevices);
                setShowDeleteModal(false);
                setSelectedDevice(null);
            }
        } catch (error) {
            console.error('Delete device error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get device users
    const handleGetUsers = async (device) => {
        setSelectedDevice(device);
        setDeviceUsers([]);
        setShowUsersModal(true);

        try {
            const response = await fetch(`/api/hr/attendance/devices?action=users&id=${device.id}`);
            const result = await response.json();

            if (result.success) {
                setDeviceUsers(result.users);
            }
        } catch (error) {
            console.error('Get users error:', error);
        }
    };

    // Open edit modal
    const openEditModal = (device) => {
        setSelectedDevice(device);
        setFormData({
            deviceName: device.deviceName,
            deviceIp: device.deviceIp,
            devicePort: device.devicePort,
            protocol: device.protocol || 'udp',
            serialNumber: device.serialNumber || '',
            model: device.model || '',
            location: device.location || '',
            isActive: device.isActive,
            autoSync: device.autoSync || false,
            syncInterval: device.syncInterval || 5
        });
        setTestResult(null);
        setShowEditModal(true);
    };

    // Open settings modal
    const openSettingsModal = (device) => {
        setSelectedDevice(device);
        setFormData({
            ...formData,
            autoSync: device.autoSync || false,
            syncInterval: device.syncInterval || 5,
            isActive: device.isActive
        });
        setShowSettingsModal(true);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            deviceName: '',
            deviceIp: '',
            devicePort: 4370,
            protocol: 'udp',
            serialNumber: '',
            model: '',
            location: '',
            isActive: true,
            autoSync: true,
            syncInterval: 5
        });
        setFormErrors({});
        setTestResult(null);
        setSelectedDevice(null);
    };

    // Table columns
    const columns = [
        {
            key: 'deviceName',
            label: 'اسم الجهاز',
            render: (_, row) => (
                <div>
                    <div className="font-semibold">{row.deviceName}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {row.model} • {row.serialNumber || 'N/A'}
                    </div>
                </div>
            )
        },
        {
            key: 'connection',
            label: 'الاتصال',
            render: (_, row) => (
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                    <div className="font-mono">{row.deviceIp}:{row.devicePort}</div>
                    <div className="text-xs">{row.protocol?.toUpperCase()}</div>
                </div>
            )
        },
        {
            key: 'location',
            label: 'الموقع',
            render: (_, row) => row.location || '-'
        },
        {
            key: 'isOnline',
            label: 'الحالة',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${row.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <Badge color={row.isOnline ? 'green' : 'red'}>
                        {row.isOnline ? 'متصل' : 'غير متصل'}
                    </Badge>
                </div>
            )
        },
        {
            key: 'lastSyncAt',
            label: 'آخر مزامنة',
            render: (_, row) => (
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                    {row.lastSyncAt ? new Date(row.lastSyncAt).toLocaleString('ar-SA') : 'لم تتم المزامنة'}
                </div>
            )
        },
        {
            key: 'todayRecords',
            label: 'سجلات اليوم',
            render: (_, row) => (
                <span className={`font-bold text-lg ${
                    row.todayRecords > 0
                        ? darkMode ? 'text-green-400' : 'text-green-600'
                        : darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
                }`}>
                    {row.todayRecords || 0}
                </span>
            )
        },
        {
            key: 'totalUsers',
            label: 'المستخدمين',
            render: (_, row) => (
                <button
                    onClick={() => handleGetUsers(row)}
                    className={`font-medium underline ${darkMode ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'}`}
                >
                    {row.totalUsers || 0}
                </button>
            )
        },
        {
            key: 'actions',
            label: 'الإجراءات',
            render: (_, row) => (
                <div className="flex gap-1 flex-wrap">
                    {/* Sync Button */}
                    <button
                        onClick={() => handleSync(row)}
                        disabled={syncing[row.id]}
                        className={`p-2 rounded-lg transition-colors ${
                            syncing[row.id]
                                ? 'opacity-50 cursor-not-allowed'
                                : darkMode
                                    ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                        }`}
                        title="مزامنة"
                    >
                        <svg className={`w-4 h-4 ${syncing[row.id] ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    {/* Test Connection */}
                    <button
                        onClick={() => handleTestConnection(row)}
                        disabled={testing[row.id]}
                        className={`p-2 rounded-lg transition-colors ${
                            testing[row.id]
                                ? 'opacity-50 cursor-not-allowed'
                                : darkMode
                                    ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                                    : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                        }`}
                        title="اختبار الاتصال"
                    >
                        {testing[row.id] ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </button>

                    {/* Settings */}
                    <button
                        onClick={() => openSettingsModal(row)}
                        className={`p-2 rounded-lg transition-colors ${
                            darkMode
                                ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50'
                                : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 hover:bg-purple-100'
                        }`}
                        title="الإعدادات"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    {/* Edit */}
                    <button
                        onClick={() => openEditModal(row)}
                        className={`p-2 rounded-lg transition-colors ${
                            darkMode
                                ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 hover:bg-yellow-100'
                        }`}
                        title="تعديل"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => {
                            setSelectedDevice(row);
                            setShowDeleteModal(true);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                            darkMode
                                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
                        }`}
                        title="حذف"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            )
        }
    ];

    // Form input component
    const FormInput = ({ label, name, type = 'text', required, error, ...props }) => (
        <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                    error
                        ? 'border-red-500'
                        : darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                } focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent`}
                {...props}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );

    return (
        <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                    <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{stats.total}</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>إجمالي الأجهزة</div>
                </div>
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-green-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    <div className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.online}</div>
                    <div className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700 dark:text-green-300'}`}>متصل</div>
                </div>
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    <div className={`text-3xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{stats.offline}</div>
                    <div className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700 dark:text-red-300'}`}>غير متصل</div>
                </div>
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                    <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.todayRecords}</div>
                    <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700 dark:text-blue-300'}`}>سجلات اليوم</div>
                </div>
            </div>

            {/* Header Actions */}
            <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    أجهزة البصمة المسجلة
                </h3>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        onClick={handleSyncAll}
                        disabled={loading}
                    >
                        <svg className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        مزامنة الكل
                    </Button>
                    <Button onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                    }}>
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        إضافة جهاز جديد
                    </Button>
                </div>
            </div>

            {/* Devices Table */}
            <DataTable
                columns={columns}
                data={devices}
                loading={loading}
                darkMode={darkMode}
                emptyMessage="لا توجد أجهزة مسجلة"
            />

            {/* Add Device Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    resetForm();
                }}
                title="إضافة جهاز بصمة جديد"
                darkMode={darkMode}
            >
                <div className="space-y-4">
                    <FormInput label="اسم الجهاز" name="deviceName" required error={formErrors.deviceName} placeholder="مثال: جهاز البوابة الرئيسية" />

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label="عنوان IP" name="deviceIp" required error={formErrors.deviceIp} placeholder="192.168.1.100" dir="ltr" />
                        <FormInput label="المنفذ" name="devicePort" type="number" error={formErrors.devicePort} placeholder="4370" dir="ltr" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>البروتوكول</label>
                            <select
                                value={formData.protocol}
                                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                                }`}
                            >
                                <option value="udp">UDP (افتراضي)</option>
                                <option value="tcp">TCP</option>
                            </select>
                        </div>
                        <FormInput label="الموديل" name="model" placeholder="ZK-F18" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label="الرقم التسلسلي" name="serialNumber" placeholder="SN123456" dir="ltr" />
                        <FormInput label="الموقع" name="location" placeholder="المبنى الرئيسي" />
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.autoSync}
                                onChange={(e) => setFormData({ ...formData, autoSync: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}>مزامنة تلقائية</span>
                        </label>

                        {formData.autoSync && (
                            <div className="flex items-center gap-2">
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>كل</span>
                                <input
                                    type="number"
                                    value={formData.syncInterval}
                                    onChange={(e) => setFormData({ ...formData, syncInterval: parseInt(e.target.value) })}
                                    className={`w-16 px-2 py-1 rounded border text-center ${
                                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
                                    }`}
                                    min="1"
                                    max="60"
                                />
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>دقيقة</span>
                            </div>
                        )}
                    </div>

                    {/* Test Connection Button */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleTestConnection()}
                            disabled={testingConnection || !formData.deviceIp}
                            className="flex-1"
                        >
                            {testingConnection ? (
                                <>
                                    <svg className="w-4 h-4 ml-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    جاري الاختبار...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    اختبار الاتصال
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div className={`p-3 rounded-lg ${
                            testResult.success
                                ? darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                                : darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                            {testResult.success ? (
                                <div>
                                    <div className="font-semibold flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        تم الاتصال بنجاح
                                    </div>
                                    {testResult.version && <div className="text-sm mt-1">الإصدار: {testResult.version}</div>}
                                    {testResult.capacity && (
                                        <div className="text-sm mt-1">
                                            المستخدمين: {testResult.capacity.userCount}/{testResult.capacity.userCapacity}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    فشل الاتصال: {testResult.message}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <Button onClick={handleAddDevice} disabled={loading} className="flex-1">
                            {loading ? 'جاري الإضافة...' : 'إضافة الجهاز'}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
                            إلغاء
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Device Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    resetForm();
                }}
                title="تعديل جهاز البصمة"
                darkMode={darkMode}
            >
                <div className="space-y-4">
                    <FormInput label="اسم الجهاز" name="deviceName" required error={formErrors.deviceName} />

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label="عنوان IP" name="deviceIp" required error={formErrors.deviceIp} dir="ltr" />
                        <FormInput label="المنفذ" name="devicePort" type="number" dir="ltr" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>البروتوكول</label>
                            <select
                                value={formData.protocol}
                                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                                }`}
                            >
                                <option value="udp">UDP</option>
                                <option value="tcp">TCP</option>
                            </select>
                        </div>
                        <FormInput label="الموديل" name="model" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label="الرقم التسلسلي" name="serialNumber" dir="ltr" />
                        <FormInput label="الموقع" name="location" />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 rounded"
                        />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}>الجهاز نشط</span>
                    </label>

                    <div className="flex gap-2 pt-4">
                        <Button onClick={handleEditDevice} disabled={loading} className="flex-1">
                            {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }}>
                            إلغاء
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="تأكيد الحذف"
                darkMode={darkMode}
            >
                <div className="space-y-4">
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}>
                        هل أنت متأكد من حذف الجهاز <strong>{selectedDevice?.deviceName}</strong>؟
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600 dark:text-red-400'}`}>
                        هذا الإجراء لا يمكن التراجع عنه.
                    </p>
                    <div className="flex gap-2 pt-4">
                        <Button variant="danger" onClick={handleDeleteDevice} disabled={loading} className="flex-1">
                            {loading ? 'جاري الحذف...' : 'نعم، احذف الجهاز'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                            إلغاء
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Sync Results Modal */}
            <Modal
                isOpen={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                title="نتائج المزامنة"
                darkMode={darkMode}
            >
                {syncResults && (
                    <div className="space-y-4">
                        <div className={`p-3 rounded-lg ${
                            syncResults.success
                                ? darkMode ? 'bg-green-900/30' : 'bg-green-100'
                                : darkMode ? 'bg-red-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                            <div className={`font-semibold ${
                                syncResults.success
                                    ? darkMode ? 'text-green-300' : 'text-green-800'
                                    : darkMode ? 'text-red-300' : 'text-red-800 dark:text-red-200'
                            }`}>
                                {syncResults.device}: {syncResults.success ? 'تمت المزامنة بنجاح' : 'فشلت المزامنة'}
                            </div>
                            {syncResults.logs && (
                                <div className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                                    عدد السجلات: {syncResults.logs.length}
                                </div>
                            )}
                        </div>

                        {syncResults.results && (
                            <div className="space-y-2">
                                {syncResults.results.map((result, index) => (
                                    <div key={index} className={`p-2 rounded-lg flex justify-between items-center ${
                                        result.success
                                            ? darkMode ? 'bg-green-900/20' : 'bg-green-50'
                                            : darkMode ? 'bg-red-900/20' : 'bg-red-50 dark:bg-red-900/20'
                                    }`}>
                                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}>{result.deviceName}</span>
                                        <Badge color={result.success ? 'green' : 'red'}>
                                            {result.success ? `${result.logsCount} سجل` : 'فشل'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Button onClick={() => setShowSyncModal(false)} className="w-full">
                            إغلاق
                        </Button>
                    </div>
                )}
            </Modal>

            {/* Device Users Modal */}
            <Modal
                isOpen={showUsersModal}
                onClose={() => setShowUsersModal(false)}
                title={`مستخدمو الجهاز: ${selectedDevice?.deviceName}`}
                darkMode={darkMode}
                size="lg"
            >
                <div className="space-y-4">
                    {deviceUsers.length === 0 ? (
                        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            جاري تحميل المستخدمين...
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full">
                                <thead className={`sticky top-0 ${darkMode ? 'bg-gray-800' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
                                    <tr>
                                        <th className={`text-right p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>رقم المستخدم</th>
                                        <th className={`text-right p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>الاسم</th>
                                        <th className={`text-right p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>الصلاحية</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deviceUsers.map((user, index) => (
                                        <tr key={index} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
                                            <td className={`p-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user.userId}</td>
                                            <td className={`p-2 ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{user.name || '-'}</td>
                                            <td className="p-2">
                                                <Badge color={user.privilege === 14 ? 'red' : user.privilege > 0 ? 'yellow' : 'gray'}>
                                                    {user.privilege === 14 ? 'مدير' : user.privilege > 0 ? 'مسجل' : 'مستخدم'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Button onClick={() => setShowUsersModal(false)} className="w-full">
                        إغلاق
                    </Button>
                </div>
            </Modal>

            {/* Settings Modal */}
            <Modal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                title={`إعدادات الجهاز: ${selectedDevice?.deviceName}`}
                darkMode={darkMode}
            >
                <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 rounded"
                        />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}>الجهاز نشط</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.autoSync}
                            onChange={(e) => setFormData({ ...formData, autoSync: e.target.checked })}
                            className="w-4 h-4 rounded"
                        />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}>المزامنة التلقائية</span>
                    </label>

                    {formData.autoSync && (
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                فترة المزامنة (بالدقائق)
                            </label>
                            <input
                                type="number"
                                value={formData.syncInterval}
                                onChange={(e) => setFormData({ ...formData, syncInterval: parseInt(e.target.value) })}
                                className={`w-full px-3 py-2 rounded-lg border ${
                                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
                                }`}
                                min="1"
                                max="60"
                            />
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <Button
                            onClick={async () => {
                                await fetch('/api/hr/attendance/devices', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        id: selectedDevice.id,
                                        isActive: formData.isActive,
                                        autoSync: formData.autoSync,
                                        syncInterval: formData.syncInterval
                                    })
                                });
                                setDevices(prev => prev.map(d =>
                                    d.id === selectedDevice.id
                                        ? { ...d, isActive: formData.isActive, autoSync: formData.autoSync, syncInterval: formData.syncInterval }
                                        : d
                                ));
                                setShowSettingsModal(false);
                            }}
                            className="flex-1"
                        >
                            حفظ الإعدادات
                        </Button>
                        <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                            إلغاء
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
