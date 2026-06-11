import React from 'react';

export default function FormInput({ label, name, type = 'text', value, onChange, placeholder, className = '', error, disabled }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{label}</label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-4 py-2.5 border rounded-lg transition ${
                    error
                        ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400'
                } ${disabled ? 'bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed' : ''}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
