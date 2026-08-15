"use client";

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const typeStyles = {
          success: {
            bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          },
          error: {
            bg: 'bg-red-50 border-red-200 text-red-800',
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          },
          warning: {
            bg: 'bg-amber-50 border-amber-200 text-amber-800',
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          },
          info: {
            bg: 'bg-blue-50 border-blue-200 text-blue-800',
            icon: <Info className="w-5 h-5 text-blue-500" />,
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto ${typeStyles.bg} fade-in`}
            role="alert"
          >
            <div className="flex-shrink-0">{typeStyles.icon}</div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
