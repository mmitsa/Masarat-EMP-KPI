import React from 'react';

export default function FormSelect({ label, name, value, onChange, options, className = '', error, disabled }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{label}</label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full px-4 py-2.5 border rounded-lg transition bg-white dark:bg-gray-900 ${
                    error
                        ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400'
                } ${disabled ? 'bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed' : ''}`}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
