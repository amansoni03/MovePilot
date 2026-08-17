"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Award, Phone, ShieldCheck } from 'lucide-react';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDriverModal: React.FC<AddDriverModalProps> = ({ isOpen, onClose }) => {
  const { vehicles, routes, addDriver, addToast } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2029-12-31');
  const [experience, setExperience] = useState<number>(6);
  const [safetyStatus, setSafetyStatus] = useState<'safe' | 'warning' | 'suspended'>('safe');
  const [ecoSafetyScore, setEcoSafetyScore] = useState<number>(96);
  const [busId, setBusId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast('Please enter the driver\'s name.', 'error');
      return;
    }

    const assignedBus = vehicles.find(v => v.id === busId);
    const assignedRouteId = assignedBus?.routeId || '';

    addDriver({
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      phone: phone || '+91 98765 59999',
      licenseNumber: licenseNumber || `DL-${Math.floor(10000 + Math.random() * 90000)}/KA03`,
      licenseExpiry: licenseExpiry || '2029-12-31',
      busId,
      routeId: assignedRouteId,
      experience: experience || 5,
      safetyStatus,
      ecoSafetyScore: ecoSafetyScore || 95
    });

    addToast(`Driver ${name} onboarded successfully!`, 'success');
    onClose();
    setName('');
    setPhone('');
    setLicenseNumber('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 fade-in text-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-100 text-blue-700 p-2 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Onboard New Driver</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Add driver details, license info, and bus assignment</p>
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
              placeholder="e.g. Vikramaditya Singh"
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
                placeholder="+91 98765 50099"
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
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Driving License Number *</label>
              <input
                type="text"
                required
                placeholder="DL-10099/KA03"
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
            <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Assign Bus (Optional)</label>
            <select
              value={busId}
              onChange={(e) => setBusId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
            >
              <option value="">-- Leave Unassigned (Available Pool) --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.busNumber} ({v.registrationNumber}) - {routes.find(r => r.id === v.routeId)?.routeNumber || 'Unscheduled'}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-md shadow-blue-600/10"
            >
              Onboard Driver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
