/**
 * ================================================================
 * Item Selector Component (Autocomplete)
 * ================================================================
 *
 * @component ItemSelector
 * @description اختيار صنف مع Autocomplete
 * @version 1.0.0
 * @date 2026-02-14
 */

import React, { useState, useEffect, useRef } from 'prop-types';
import { useItems } from '../../hooks/useWarehouse';
import { Badge } from '../ui';

export default function ItemSelector({
    value,
    onChange,
    warehouseId,
    placeholder = 'ابحث عن صنف...',
    disabled = false,
    showStock = true,
    className = ''
}) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const wrapperRef = useRef(null);

    // جلب الأصناف
    const { data: itemsData, isLoading } = useItems({ search, warehouseId });
    const items = itemsData?.data || [];

    // إغلاق القائمة عند النقر خارجها
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // تحديث الصنف المختار
    useEffect(() => {
        if (value && items.length > 0) {
            const item = items.find(i => i.id === value);
            if (item) setSelectedItem(item);
        }
    }, [value, items]);

    const handleSelect = (item) => {
        setSelectedItem(item);
        setSearch(item.itemNameAr);
        setIsOpen(false);
        onChange(item);
    };

    const handleClear = () => {
        setSelectedItem(null);
        setSearch('');
        onChange(null);
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Input */}
            <div className="relative">
                <input
                    type="text"
                    value={selectedItem ? selectedItem.itemNameAr : search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                        if (selectedItem) {
                            setSelectedItem(null);
                            onChange(null);
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent disabled:bg-gray-100"
                />

                {/* Icons */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    )}
                    {selectedItem && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    )}
                    {!selectedItem && <SearchIcon className="w-4 h-4 text-gray-400" />}
                </div>
            </div>

            {/* Selected Item Details */}
            {selectedItem && showStock && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-gray-600 dark:text-gray-300">الكود:</span>
                            <span className="font-mono font-semibold mr-2">{selectedItem.itemCode}</span>
                        </div>
                        <div>
                            <span className="text-gray-600 dark:text-gray-300">الرصيد:</span>
                            <Badge variant={selectedItem.currentStock > selectedItem.minimumStock ? 'success' : 'danger'} className="mr-2">
                                {selectedItem.currentStock} {selectedItem.unitNameAr}
                            </Badge>
                        </div>
                    </div>
                </div>
            )}

            {/* Dropdown */}
            {isOpen && items.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className="w-full px-4 py-3 text-start hover:bg-gray-50 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-900 dark:text-white">{item.itemNameAr}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">{item.itemCode}</div>
                                </div>
                                {showStock && (
                                    <Badge variant={item.currentStock > item.minimumStock ? 'success' : 'warning'}>
                                        {item.currentStock} {item.unitNameAr}
                                    </Badge>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No Results */}
            {isOpen && !isLoading && search && items.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
                    لا توجد نتائج
                </div>
            )}
        </div>
    );
}

// Icons
function SearchIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
