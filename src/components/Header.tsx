"use client";

import React, { useState } from 'react';
import { useApp, Notification } from '@/context/AppContext';
import { 
  Bell, Search, Menu, User, Calendar, LogOut, Settings as SettingsIcon, 
  UserCircle, CheckCheck, Circle, AlertTriangle, AlertCircle, CheckCircle2, Info 
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileSidebar,
  searchQuery,
  setSearchQuery
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const pageTitles: Record<string, string> = {
    dashboard: "Dashboard Overview",
    tracking: "Live GPS Tracking",
    routes: "Routes Management",
    students: "Students Directory",
    drivers: "Driver Registry",
    vehicles: "Vehicle Inventory & Safety",
    attendance: "Daily Transportation Attendance",
    emergencies: "Emergency Events & SOS logs",
    notifications: "Notification Logs",
    reports: "Analytics & Performance Reports",
    settings: "System Configuration"
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
  };

  return (
    <header className="sticky top-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-30 shadow-xs select-none">
      {/* Left: Mobile menu & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-slate-800 text-lg md:text-xl tracking-tight">
          {pageTitles[activeTab] || "Safety Console"}
        </h2>
      </div>

      {/* Middle: Search bar (Aggregated filters) */}
      <div className="hidden md:flex relative max-w-md w-full mx-4">
        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Global search (e.g. BUS 07, Amit, STU-0024)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs bg-slate-50 font-medium text-slate-800"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Calendar / Date */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-slate-800">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No recent notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.type === 'error') setActiveTab('emergencies');
                      }}
                      className={`flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer text-xs ${
                        !n.read ? 'bg-blue-50/20 font-medium' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(n.type)}</div>
                      <div className="flex-1">
                        <p className="text-slate-700 leading-tight">{n.message}</p>
                        <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{n.time}</span>
                      </div>
                      {!n.read && (
                        <div className="flex-shrink-0 self-center">
                          <Circle className="w-2.5 h-2.5 fill-blue-600 text-blue-600" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 pt-2 pb-1 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setActiveTab('notifications');
                    setShowNotifications(false);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <div className="hidden sm:block text-left text-xs pr-1">
              <p className="font-bold text-slate-800">Admin</p>
              <p className="text-[10px] text-slate-400 font-semibold leading-none">In-charge</p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 text-slate-800">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-bold text-sm text-slate-800">Muzammil</p>
                <p className="text-xs text-slate-400 font-semibold">transport-admin@greenfield.edu</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfile(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-600 hover:text-slate-850 cursor-pointer"
                >
                  <UserCircle className="w-4 h-4 text-slate-400" /> My Profile
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfile(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-600 hover:text-slate-850 cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400" /> Settings
                </button>
              </div>
              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={() => {
                    alert("Logging out from simulation demo...");
                    setShowProfile(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
