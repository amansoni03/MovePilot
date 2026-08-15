"use client";

import React, { useState } from 'react';
import { useApp, Notification } from '@/context/AppContext';
import { 
  Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, 
  Send, Layers, RefreshCw, CheckCheck 
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { notifications, routes, sendNotification, markAllNotificationsRead, addToast } = useApp();
  
  // Custom message triggers
  const [routeId, setRouteId] = useState('');
  const [type, setType] = useState<Notification['type']>('info');
  const [message, setMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      addToast('Please enter a notification message.', 'error');
      return;
    }

    const route = routes.find(r => r.id === routeId);
    const busId = route?.busId || '';

    sendNotification(type, message.trim(), busId, routeId || undefined);
    addToast('Parent notification queued and sent successfully!', 'success');
    
    // Clear
    setMessage('');
    setRouteId('');
    setType('info');
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800 fade-in">
      {/* Notifications history - 2 columns */}
      <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-xs p-5 flex flex-col h-[calc(100vh-8.5rem)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600 animate-swing" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Parent Notifications Log</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Simulated push messages, SMS, and WhatsApp pings</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              markAllNotificationsRead();
              addToast('All notifications marked read.', 'success');
            }}
            className="flex items-center gap-1 text-xs font-semibold text-blue-650 hover:text-blue-800 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        </div>

        {/* Scrollable logs list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-semibold text-slate-700">
          {notifications.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No notifications logged yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id}
                className={`p-3.5 rounded-xl border flex gap-3.5 items-start ${
                  !n.read ? 'bg-blue-50/10 border-blue-100' : 'bg-slate-50 border-slate-150'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(n.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-slate-800 leading-relaxed font-semibold">{n.message}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                    <span>{n.time}</span>
                    {n.routeId && (
                      <span className="bg-slate-200/60 px-1.5 py-0.5 rounded font-mono font-semibold">{n.routeId}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual Broadcast Form - 1 column */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 h-fit space-y-4 text-slate-800">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm font-sans">Manual Broadcast Alerts</h3>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {/* Target Route */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Target Bus Route
            </label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold focus:outline-none cursor-pointer text-slate-700"
            >
              <option value="">All Active Routes</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.routeNumber} ({r.name.split(' ')[0]})</option>
              ))}
            </select>
          </div>

          {/* Alert Severity */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Alert Severity / Type
            </label>
            <div className="flex gap-2 text-[10px] font-bold uppercase">
              {(['info', 'success', 'warning', 'error'] as const).map(t => {
                const colors = {
                  info: 'border-blue-200 text-blue-800 bg-blue-50',
                  success: 'border-emerald-200 text-emerald-800 bg-emerald-50',
                  warning: 'border-amber-200 text-amber-800 bg-amber-50',
                  error: 'border-red-200 text-red-800 bg-red-50',
                }[t];

                const activeColors = {
                  info: 'bg-blue-600 border-blue-600 text-white',
                  success: 'bg-emerald-600 border-emerald-600 text-white',
                  warning: 'bg-amber-600 border-amber-600 text-white',
                  error: 'bg-red-600 border-red-600 text-white',
                }[t];

                const isSelected = type === t;

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-1.5 border rounded-lg cursor-pointer transition-all ${
                      isSelected ? activeColors : `${colors} hover:opacity-85`
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alert Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Notification Message
            </label>
            <textarea
              placeholder="Enter message to broadcast to parent contacts (e.g. Bus delayed by 15 mins due to traffic)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/10"
          >
            <Send className="w-4 h-4" /> Send Broadcast
          </button>
        </form>
      </div>
    </div>
  );
};
