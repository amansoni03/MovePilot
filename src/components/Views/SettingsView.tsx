"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings, Save, RefreshCw, Smartphone, ShieldCheck, HelpCircle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetDemoData, addToast } = useApp();

  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [gpsSimulation, setGpsSimulation] = useState(settings.gpsSimulation);
  const [parentNotifications, setParentNotifications] = useState(settings.parentNotifications);
  const [delayAlerts, setDelayAlerts] = useState(settings.delayAlerts);
  const [speedLimit, setSpeedLimit] = useState(settings.speedLimit);
  const [routeDeviationThreshold, setRouteDeviationThreshold] = useState(settings.routeDeviationThreshold);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      schoolName,
      gpsSimulation,
      parentNotifications,
      delayAlerts,
      speedLimit,
      routeDeviationThreshold
    });
    addToast('Configuration settings updated successfully!', 'success');
  };

  const handleReset = () => {
    if (confirm('Warning: This will delete all custom routes, buses, and boarding logs, resetting to seeded dashboard defaults. Continue?')) {
      resetDemoData();
      addToast('Demo database reset successfully.', 'warning');
      
      // Sync local component state
      setSchoolName(settings.schoolName);
      setGpsSimulation(settings.gpsSimulation);
      setParentNotifications(settings.parentNotifications);
      setDelayAlerts(settings.delayAlerts);
      setSpeedLimit(settings.speedLimit);
      setRouteDeviationThreshold(settings.routeDeviationThreshold);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 text-slate-800 fade-in">
      <form onSubmit={handleSave} className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">Transport System Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold text-slate-700">
          {/* School Name */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              School Name
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
              required
            />
          </div>

          {/* Speed Limit */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              School Speed Limit Alert Threshold (km/h)
            </label>
            <input
              type="number"
              value={speedLimit}
              onChange={(e) => setSpeedLimit(Number(e.target.value))}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
              required
            />
          </div>

          {/* Deviation Threshold */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Route Deviation Alert Threshold (meters)
            </label>
            <input
              type="number"
              value={routeDeviationThreshold}
              onChange={(e) => setRouteDeviationThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
              required
            />
          </div>
        </div>

        {/* Toggle switches */}
        <div className="border-t border-slate-100 pt-5 space-y-4 text-xs font-semibold text-slate-700">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automation Modules</h4>
          
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="text-slate-800 font-bold">GPS Live Simulation Engine</p>
              <p className="text-[10px] text-slate-400 font-semibold">Allow simulated bus markers to move on Leaflet coordinates.</p>
            </div>
            <input
              type="checkbox"
              checked={gpsSimulation}
              onChange={(e) => setGpsSimulation(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="text-slate-800 font-bold">Automatic Parent SMS/WhatsApp Notification alerts</p>
              <p className="text-[10px] text-slate-400 font-semibold">Triggers notification broadcasts when children board, drop, or buses are delayed.</p>
            </div>
            <input
              type="checkbox"
              checked={parentNotifications}
              onChange={(e) => setParentNotifications(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="text-slate-800 font-bold">Traffic delay calculations</p>
              <p className="text-[10px] text-slate-400 font-semibold">Enable ETA adjustments and delay notices when buses run behind stops schedules.</p>
            </div>
            <input
              type="checkbox"
              checked={delayAlerts}
              onChange={(e) => setDelayAlerts(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/10 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-white border border-red-100 rounded-2xl shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-red-650 text-sm">Danger Zone / Demo Reset</h3>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Resetting database destroys all custom bus routing entries, boarding logs, and simulation histories, reverting context properties back to defaults.
        </p>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl text-xs border border-red-150 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Reset Database defaults
        </button>
      </div>
    </div>
  );
};
