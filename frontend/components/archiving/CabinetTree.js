/**
 * CabinetTree Component - شجرة الخزائن الهرمية
 * عرض الخزائن بشكل شجري قابل للطي والنقر
 *
 * @version 1.0.0
 * @date 2026-02-14
 */

import React, { useState } from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../ui';

const CabinetTreeNode = ({
  cabinet,
  level = 0,
  onSelect,
  selectedId,
  onEdit,
  onDelete,
  onAddChild,
  showActions = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = cabinet.children && cabinet.children.length > 0;
  const isSelected = selectedId === cabinet.id;

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect?.(cabinet);
  };

  return (
    <div className="select-none">
      {/* Cabinet Node */}
      <div
        className={`
          flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
          ${isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-50 text-gray-700 dark:text-gray-200'
          }
          group
        `}
        style={{ paddingRight: `${level * 1.5}rem` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={toggleExpand}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            <ChevronLeftIcon
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </button>
        )}

        {/* Folder Icon */}
        <div className="flex-shrink-0">
          {isExpanded && hasChildren ? (
            <FolderOpenIcon className="w-5 h-5 text-yellow-500" />
          ) : (
            <FolderIcon className="w-5 h-5 text-yellow-500" />
          )}
        </div>

        {/* Cabinet Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {cabinet.nameAr || cabinet.name}
            </span>
            {cabinet.documentsCount > 0 && (
              <Badge variant="outline" size="sm">
                <DocumentTextIcon className="w-3 h-3 ml-1" />
                {cabinet.documentsCount}
              </Badge>
            )}
          </div>
          {cabinet.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {cabinet.description}
            </p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild?.(cabinet);
              }}
              className="p-1.5 hover:bg-green-100 text-green-600 dark:text-green-400 rounded transition-colors"
              title="إضافة خزينة فرعية"
            >
              <PlusIcon className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(cabinet);
              }}
              className="p-1.5 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded transition-colors"
              title="تعديل"
            >
              <PencilIcon className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(cabinet);
              }}
              className="p-1.5 hover:bg-red-100 text-red-600 dark:text-red-400 rounded transition-colors"
              title="حذف"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="mt-1">
          {cabinet.children.map((child) => (
            <CabinetTreeNode
              key={child.id}
              cabinet={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              showActions={showActions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CabinetTree = ({
  cabinets = [],
  onSelect,
  selectedCabinetId,
  onEdit,
  onDelete,
  onAddChild,
  showActions = true,
  loading = false,
  emptyMessage = 'لا توجد خزائن',
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!cabinets || cabinets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <FolderIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {cabinets.map((cabinet) => (
        <CabinetTreeNode
          key={cabinet.id}
          cabinet={cabinet}
          onSelect={onSelect}
          selectedId={selectedCabinetId}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

export default CabinetTree;
