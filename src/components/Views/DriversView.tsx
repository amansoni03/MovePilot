"use client";

import React, { useState } from 'react';
import { useApp, Driver } from '@/context/AppContext';
import { Search, Shield, ShieldCheck, ShieldAlert, Award, Phone, Bus, Info } from 'lucide-react';

export const DriversView: React.FC = () => {
  const { drivers, vehicles, routes, assignDriver, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Assignment states
  const [selectedBusId, setSelectedBusId] = useState('');

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBusNumber = (busId: string) => {
    return vehicles.find(v => v.id === busId)?.busNumber || 'None';
  };

  const getRouteNumber = (routeId: string) => {
    return routes.find(r => r.id === routeId)?.routeNumber || 'None';
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    if (!selectedBusId) {
      addToast('Please select a vehicle to assign.', 'error');
      return;
    }

    const assignedBus = vehicles.find(v => v.id === selectedBusId);
    const assignedRouteId = assignedBus?.routeId || '';

    // assignDriver returns error string if assignment has warning, else null
    const warning = assignDriver(selectedDriver.id, selectedBusId, assignedRouteId);

    if (warning) {
      if (confirm(`${warning}\n\nDo you want to override and assign anyway?`)) {
        // Override assign: manually force assign (for demo, assignDriver can just override or we log it)
        addToast(`Driver ${selectedDriver.name} assignment forced.`, 'warning');
      }
    } else {
      addToast(`Driver ${selectedDriver.name} assigned to ${assignedBus?.busNumber} successfully!`, 'success');
    }

    // Refresh selected driver details
    const updatedDriver = drivers.find(d => d.id === selectedDriver.id);
    if (updatedDriver) setSelectedDriver(updatedDriver);
    setSelectedBusId('');
  };

  // Get available buses (either unassigned, or not in emergency)
  const availableBuses = vehicles.filter(v => v.status !== 'inactive');

  return (
    <div className="space-y-6 text-slate-800 fade-in">
      {/* Top Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by driver name or license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs bg-slate-50 font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Drivers Grid list - 2 columns */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredDrivers.map((driver) => {
            const isSelected = selectedDriver?.id === driver.id;
            return (
              <div
                key={driver.id}
                onClick={() => setSelectedDriver(driver)}
                className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer text-xs font-semibold ${
                  isSelected 
                    ? 'border-blue-600 shadow-lg shadow-blue-500/5' 
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5 mb-3">
                  <img
                    src={driver.avatar}
                    alt={driver.name}
                    className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{driver.name}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block leading-tight">
                      ID: {driver.id} • Exp: {driver.experience} yrs
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-500 font-medium border-t border-slate-50 pt-2.5">
                  <p className="flex justify-between">
                    <span>License:</span>
                    <strong className="text-slate-800">{driver.licenseNumber}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Assigned Bus:</span>
                    <strong className="text-slate-800">{getBusNumber(driver.busId)}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Assigned Route:</span>
                    <strong className="text-slate-800">{getRouteNumber(driver.routeId)}</strong>
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                    driver.status === 'on route' ? 'bg-emerald-100 text-emerald-800' :
                    driver.status === 'available' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {driver.status}
                  </span>

                  <span className="flex items-center gap-1 text-[10px]">
                    {driver.safetyStatus === 'safe' ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Safety verified
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-0.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> Safety warning
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Driver Details & Re-assignment Panel - 1 column */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Driver Assignment</h3>
            </div>
          </div>

          {selectedDriver ? (
            <div className="space-y-4 text-xs font-semibold text-slate-700 fade-in">
              <div className="flex items-center gap-3">
                <img
                  src={selectedDriver.avatar}
                  alt={selectedDriver.name}
                  className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedDriver.name}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    ID: {selectedDriver.id} • License Expiry: {selectedDriver.licenseExpiry}
                  </span>
                </div>
              </div>

              {/* Assignment Form */}
              <form onSubmit={handleAssign} className="space-y-3.5 pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Re-Assign vehicle</h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Select Bus Fleet
                  </label>
                  <select
                    value={selectedBusId}
                    onChange={(e) => setSelectedBusId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none"
                    required
                  >
                    <option value="">-- Select Available Bus --</option>
                    {availableBuses.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.busNumber} ({v.registrationNumber}) - {routes.find(r => r.id === v.routeId)?.routeNumber || 'Unscheduled'}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-md shadow-blue-600/10"
                >
                  Confirm Assignment
                </button>
              </form>

              {/* Bio Details */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Details</h4>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
                  </span>
                  <span className="text-slate-800 font-bold">{selectedDriver.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Bus className="w-3.5 h-3.5 text-slate-400" /> Assigned Bus
                  </span>
                  <span className="text-slate-800 font-bold">{getBusNumber(selectedDriver.busId)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-slate-400" /> License #
                  </span>
                  <span className="text-slate-850 font-bold">{selectedDriver.licenseNumber}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-450 text-xs">
              <Info className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p>No driver selected</p>
              <p className="text-[10px] text-slate-400">Choose a driver card to change assignments or inspect certifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
