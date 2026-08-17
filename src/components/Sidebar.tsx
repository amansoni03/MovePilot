"use client";

import React from 'react';
import { 
  LayoutDashboard, Map, Route, Users, ShieldAlert, 
  Settings, Bell, FileBarChart, Bus, UserCheck, 
  ClipboardList, Plus, AlertOctagon, QrCode, Sparkles
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddRoute: () => void;
  onOpenAddVehicle: () => void;
  onOpenScanBoarding: () => void;
  onOpenEmergency: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddRoute,
  onOpenAddVehicle,
  onOpenScanBoarding,
  onOpenEmergency,
  isOpenMobile,
  setIsOpenMobile
}) => {
  const { emergencies } = useApp();
  const activeAlerts = emergencies.filter(e => e.status !== 'resolved').length;

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tracking', name: 'Live Tracking', icon: <Map className="w-5 h-5" /> },
    { id: 'routes', name: 'Routes', icon: <Route className="w-5 h-5" /> },
    { id: 'optimizer', name: 'AI Route Optimizer', icon: <Sparkles className="w-5 h-5 text-amber-400" /> },
    { id: 'students', name: 'Students', icon: <Users className="w-5 h-5" /> },
    { id: 'drivers', name: 'Drivers', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'vehicles', name: 'Vehicles', icon: <Bus className="w-5 h-5" /> },
    { id: 'attendance', name: 'Attendance', icon: <ClipboardList className="w-5 h-5" /> },
    { 
      id: 'emergencies', 
      name: 'Emergency Events', 
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: activeAlerts > 0 ? activeAlerts : undefined
    },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'reports', name: 'Reports', icon: <FileBarChart className="w-5 h-5" /> },
    { id: 'settings', name: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpenMobile(false); // Close sidebar on mobile
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-400 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-900 bg-slate-950">
        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-slate-950 shadow-inner flex-shrink-0 animate-pulse">
          <Bus className="w-6 h-6 stroke-[2]" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-white tracking-wide leading-tight">School Transport</h1>
          <p className="text-[10px] font-semibold text-yellow-400 tracking-widest uppercase">Safety Console</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold cursor-pointer group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                  : 'hover:bg-slate-900 hover:text-slate-100 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold leading-none ${
                  isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Actions Panel */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button
            onClick={onOpenAddRoute}
            className="flex flex-col items-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-900"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add Route</span>
          </button>
          <button
            onClick={onOpenAddVehicle}
            className="flex flex-col items-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-900"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Bus</span>
          </button>
          <button
            onClick={onOpenScanBoarding}
            className="flex flex-col items-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-900"
          >
            <QrCode className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span>Scan Student</span>
          </button>
          <button
            onClick={onOpenEmergency}
            className="flex flex-col items-center gap-2 p-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-950/30 transition-colors cursor-pointer"
          >
            <AlertOctagon className="w-4 h-4 text-red-500" />
            <span>SOS Alert</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-[260px] h-screen sticky top-0 flex-shrink-0 z-40 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative w-[260px] max-w-xs h-full flex flex-col z-10 shadow-2xl animate-fade-in-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
