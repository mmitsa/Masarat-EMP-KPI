/**
 * مكون البحث واختيار الموظف
 * Employee Search Select Component
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, UserIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import api from '../../../lib/api';

const EmployeeSearchSelect = ({
    value,
    onChange,
    label = 'اختر الموظف',
    placeholder = 'ابحث بالاسم أو الرقم الوظيفي...',
    required = false,
    error = null,
    disabled = false,
    employees: externalEmployees = null,
    showDepartment = true,
    showNationalId = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // جلب الموظفين
    useEffect(() => {
        if (externalEmployees) {
            setEmployees(externalEmployees);
            setFilteredEmployees(externalEmployees);
        } else {
            fetchEmployees();
        }
    }, [externalEmployees]);

    // تحديث الموظف المختار عند تغيير القيمة
    useEffect(() => {
        if (value && employees.length > 0) {
            const emp = employees.find(e => e.id === value || e.id?.toString() === value?.toString());
            setSelectedEmployee(emp || null);
        } else {
            setSelectedEmployee(null);
        }
    }, [value, employees]);

    // إغلاق القائمة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await api.hr.getEmployees({ page: 1, pageSize: 500 });
            const data = response?.data || response?.employees || response || [];
            setEmployees(Array.isArray(data) ? data : []);
            setFilteredEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching employees:', error);
            // API unavailable — show empty state
            setEmployees([]);
            setFilteredEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    // البحث مع debounce
    const handleSearch = useCallback((term) => {
        setSearchTerm(term);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            if (!term.trim()) {
                setFilteredEmployees(employees);
                return;
            }

            const searchLower = term.toLowerCase();
            const filtered = employees.filter(emp => {
                const name = (emp.fullName || emp.nameAr || emp.name || '').toLowerCase();
                const empNumber = (emp.employeeNumber || emp.employee_number || '').toLowerCase();
                const nationalId = (emp.nationalId || emp.national_id || '').toLowerCase();
                const department = (emp.department || emp.departmentName || '').toLowerCase();

                return name.includes(searchLower) ||
                       empNumber.includes(searchLower) ||
                       nationalId.includes(searchLower) ||
                       department.includes(searchLower);
            });

            setFilteredEmployees(filtered);
        }, 300);
    }, [employees]);

    const handleSelect = (employee) => {
        setSelectedEmployee(employee);
        onChange?.(employee.id, employee);
        setIsOpen(false);
        setSearchTerm('');
        setFilteredEmployees(employees);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setSelectedEmployee(null);
        onChange?.(null, null);
        setSearchTerm('');
        setFilteredEmployees(employees);
    };

    const getEmployeeName = (emp) => {
        return emp?.fullName || emp?.nameAr || emp?.name || '-';
    };

    const getEmployeeNumber = (emp) => {
        return emp?.employeeNumber || emp?.employee_number || '-';
    };

    return (
        <div className="w-full" ref={containerRef}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
            )}

            {/* Input Container */}
            <div className="relative">
                <div
                    className={`
                        relative w-full min-h-[42px] px-3 py-2
                        bg-white dark:bg-gray-900 border rounded-lg cursor-pointer
                        transition-all duration-200
                        ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}
                        ${error ? 'border-red-500' : ''}
                        ${disabled ? 'bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                >
                    {/* Selected Employee Display */}
                    {selectedEmployee ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                        {getEmployeeName(selectedEmployee)}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2">
                                        <span>{getEmployeeNumber(selectedEmployee)}</span>
                                        {showDepartment && selectedEmployee.department && (
                                            <>
                                                <span>•</span>
                                                <span>{selectedEmployee.department}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!disabled && (
                                <button
                                    onClick={handleClear}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between text-gray-400">
                            <span>{placeholder}</span>
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                    )}
                </div>

                {/* Dropdown */}
                {isOpen && !disabled && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="ابحث بالاسم أو الرقم الوظيفي..."
                                    className="w-full pr-9 pl-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                                    autoFocus
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilteredEmployees(employees);
                                        }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2"
                                    >
                                        <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Employee List */}
                        <div className="max-h-60 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    جاري التحميل...
                                </div>
                            ) : filteredEmployees.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    {searchTerm ? 'لا توجد نتائج مطابقة' : 'لا يوجد موظفون'}
                                </div>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        onClick={() => handleSelect(emp)}
                                        className={`
                                            flex items-center gap-3 px-3 py-2 cursor-pointer
                                            hover:bg-blue-50 transition-colors
                                            ${selectedEmployee?.id === emp.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                        `}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                                            <UserIcon className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                {getEmployeeName(emp)}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 truncate">
                                                <span className="font-mono">{getEmployeeNumber(emp)}</span>
                                                {showDepartment && emp.department && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{emp.department}</span>
                                                    </>
                                                )}
                                                {showNationalId && emp.nationalId && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{emp.nationalId}</span>
                                                    </>
                                                )}
                                            </div>
                                            {emp.position && (
                                                <div className="text-xs text-gray-400 truncate">
                                                    {emp.position}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer with count */}
                        {!loading && filteredEmployees.length > 0 && (
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t text-xs text-gray-500 dark:text-gray-400 text-center">
                                {filteredEmployees.length === employees.length
                                    ? `إجمالي ${employees.length} موظف`
                                    : `${filteredEmployees.length} من ${employees.length} موظف`
                                }
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default EmployeeSearchSelect;
