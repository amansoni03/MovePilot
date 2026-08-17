"use client";

import React, { useState, useEffect } from 'react';
import { useApp, Driver } from '@/context/AppContext';
import { X, Edit, Trash2 } from 'lucide-react';

interface EditDriverModalProps {
  isOpen: boolean;
  driver: Driver | null;
  onClose: () => void;
}

export const EditDriverModal: React.FC<EditDriverModalProps> = ({ isOpen, driver, onClose }) => {
  const { vehicles, routes, editDriver, deleteDriver, assignDriver, addToast } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [experience, setExperience] = useState<number>(5);
  const [safetyStatus, setSafetyStatus] = useState<'safe' | 'warning' | 'suspended'>('safe');
  const [ecoSafetyScore, setEcoSafetyScore] = useState<number>(95);
  const [busId, setBusId] = useState('');

  useEffect(() => {
    if (driver) {
      setName(driver.name);
      setPhone(driver.phone);
      setLicenseNumber(driver.licenseNumber);
      setLicenseExpiry(driver.licenseExpiry);
      setExperience(driver.experience);
      setSafetyStatus(driver.safetyStatus);
      setEcoSafetyScore(driver.ecoSafetyScore || 95);
      setBusId(driver.busId);
    }
  }, [driver]);

  if (!isOpen || !driver) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const assignedBus = vehicles.find(v => v.id === busId);
    const assignedRouteId = assignedBus?.routeId || '';

    editDriver({
      ...driver,
      name,
      phone,
      licenseNumber,
      licenseExpiry,
      experience,
      safetyStatus,
      ecoSafetyScore,
      busId,
      routeId: assignedRouteId
    });

    if (busId !== driver.busId) {
      assignDriver(driver.id, busId, assignedRouteId);
    }

    addToast(`Driver ${name} records updated.`, 'success');
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to offboard driver "${driver.name}"?`)) {
      deleteDriver(driver.id);
      addToast(`Driver ${driver.name} offboarded.`, 'warning');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 fade-in text-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-100 text-amber-700 p-2 rounded-xl">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Driver Profile</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Update certifications and assignments for {driver.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Driver Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Experience (Years)</label>
              <input
                type="number"
                min={1}
                max={40}
                value={experience}
                onChange={(e) => setExperience(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">License Number *</label>
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">License Expiry Date</label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Safety Status</label>
              <select
                value={safetyStatus}
                onChange={(e) => setSafetyStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              >
                <option value="safe">Safe (Verified)</option>
                <option value="warning">Warning</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Teltonika Eco-Score (0-100)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={ecoSafetyScore}
                onChange={(e) => setEcoSafetyScore(parseInt(e.target.value) || 90)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Assigned Bus Fleet</label>
            <select
              value={busId}
              onChange={(e) => setBusId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
            >
              <option value="">-- Unassigned (Available Pool) --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.busNumber} ({v.registrationNumber}) - {routes.find(r => r.id === v.routeId)?.routeNumber || 'Unscheduled'}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all text-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Offboard Driver
            </button>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-md shadow-blue-600/10"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
