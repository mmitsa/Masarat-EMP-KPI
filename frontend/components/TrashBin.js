import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTrashBin } from '../context/TrashBinContext';

export default function TrashBin({ darkMode = false }) {
  const {
    trashItems,
    unreadCount,
    pendingRestoreRequests,
    showTrashDropdown,
    setShowTrashDropdown,
    requestRestore,
  } = useTrashBin();

  const [activeTab, setActiveTab] = useState('items'); // items | requests
  const [selectedItem, setSelectedItem] = useState(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTrashDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowTrashDropdown]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'deleted': return 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700';
      default: return 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getRestoreStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700';
      case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300';
    }
  };

  const getRestoreStatusText = (status) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'approved': return 'تمت الموافقة';
      case 'rejected': return 'مرفوض';
      default: return '';
    }
  };

  const handleRestoreRequest = () => {
    if (selectedItem) {
      requestRestore(selectedItem.id, restoreReason);
      setShowRestoreModal(false);
      setSelectedItem(null);
      setRestoreReason('');
    }
  };

  const recentItems = trashItems.slice(0, 5);
  const totalCount = unreadCount + pendingRestoreRequests;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trash Icon Button */}
      <button
        onClick={() => setShowTrashDropdown(!showTrashDropdown)}
        className={`p-2 rounded-xl transition-colors relative
          ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showTrashDropdown && (
        <div className={`absolute left-0 mt-2 w-96 rounded-xl shadow-2xl border z-50
          ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>

          {/* Header */}
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗑️</span>
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  سلة المهملات
                </h3>
              </div>
              <Link
                href="/trash"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium"
                onClick={() => setShowTrashDropdown(false)}
              >
                عرض الكل
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mt-3">
              <button
                onClick={() => setActiveTab('items')}
                className={`text-sm pb-2 border-b-2 transition ${
                  activeTab === 'items'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
                    : `border-transparent ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`
                }`}
              >
                المحذوفات والمرفوضات
                {unreadCount > 0 && (
                  <span className="mr-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`text-sm pb-2 border-b-2 transition ${
                  activeTab === 'requests'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
                    : `border-transparent ${darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`
                }`}
              >
                طلبات الإرجاع
                {pendingRestoreRequests > 0 && (
                  <span className="mr-1 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 text-xs rounded-full">
                    {pendingRestoreRequests}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'items' && (
              <>
                {recentItems.length === 0 ? (
                  <div className={`px-4 py-8 text-center ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                    <span className="text-4xl block mb-2">🗑️</span>
                    <p className="text-sm">سلة المهملات فارغة</p>
                  </div>
                ) : (
                  recentItems.map((item) => (
                    <div
                      key={item.id}
                      className={`px-4 py-3 border-b last:border-b-0 transition-colors
                        ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getActionColor(item.action)}`}>
                              {item.actionName}
                            </span>
                            <span className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                              {formatDate(item.actionDate)}
                            </span>
                          </div>
                          <h4 className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            {item.title}
                          </h4>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.systemName} • {item.requester.name}
                          </p>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                            بواسطة: {item.actionBy.name}
                          </p>

                          {/* Restore Status or Button */}
                          <div className="mt-2">
                            {item.restoreRequested ? (
                              <span className={`text-xs px-2 py-1 rounded-full ${getRestoreStatusColor(item.restoreStatus)}`}>
                                طلب إرجاع: {getRestoreStatusText(item.restoreStatus)}
                              </span>
                            ) : item.canRestore ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem(item);
                                  setShowRestoreModal(true);
                                }}
                                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                              >
                                طلب إرجاع
                              </button>
                            ) : (
                              <span className={`text-xs ${darkMode ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>
                                لا يمكن الإرجاع
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'requests' && (
              <div className={`px-4 py-6 text-center ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                <span className="text-4xl block mb-2">📋</span>
                <p className="text-sm">طلبات الإرجاع الواردة</p>
                <p className="text-xs mt-1">سيظهر هنا طلبات إرجاع المعاملات من موظفيك</p>
                <Link
                  href="/trash?tab=requests"
                  className="inline-block mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
                  onClick={() => setShowTrashDropdown(false)}
                >
                  إدارة الطلبات
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}>
                {trashItems.length} عنصر في السلة
              </span>
              <Link
                href="/trash"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
                onClick={() => setShowTrashDropdown(false)}
              >
                إدارة السلة ←
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Restore Request Modal */}
      {showRestoreModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowRestoreModal(false)}>
          <div
            className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white dark:bg-gray-900'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100 dark:border-gray-800'}`}>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                طلب إرجاع معاملة
              </h3>
            </div>

            <div className="p-6">
              {/* Selected Item Info */}
              <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedItem.icon}</span>
                  <div>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {selectedItem.title}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedItem.typeName} • {selectedItem.originalId}
                    </p>
                  </div>
                </div>
                <div className={`mt-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                  <p><strong>سبب الرفض:</strong> {selectedItem.reason}</p>
                </div>
              </div>

              {/* Restore Reason */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}`}>
                  سبب طلب الإرجاع (اختياري)
                </label>
                <textarea
                  value={restoreReason}
                  onChange={(e) => setRestoreReason(e.target.value)}
                  placeholder="اشرح سبب طلب إرجاع هذه المعاملة..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border text-sm resize-none
                    ${darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
                    } focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent`}
                />
              </div>

              {/* Info */}
              <div className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'}`}>
                <p>سيتم إرسال طلب الإرجاع إلى <strong>{selectedItem.actionBy.name}</strong> للمراجعة.</p>
              </div>
            </div>

            <div className={`px-6 py-4 border-t flex gap-3 justify-end ${darkMode ? 'border-gray-800' : 'border-gray-100 dark:border-gray-800'}`}>
              <button
                onClick={() => setShowRestoreModal(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition
                  ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-200'}`}
              >
                إلغاء
              </button>
              <button
                onClick={handleRestoreRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                إرسال طلب الإرجاع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
