"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Bus, X } from 'lucide-react';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ isOpen, onClose }) => {
  const { addVehicle, drivers, addToast } = useApp();

  const [busNumber, setBusNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('Tata Starbus 40S');
  const [capacity, setCapacity] = useState(40);
  const [driverId, setDriverId] = useState('');
  const [gpsDeviceId, setGpsDeviceId] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [fitnessExpiry, setFitnessExpiry] = useState('');
  const [pollutionExpiry, setPollutionExpiry] = useState('');
  const [maintenanceStatus, setMaintenanceStatus] = useState<'good' | 'expiring' | 'expired'>('good');
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance'>('active');

  if (!isOpen) return null;

  // Drivers that are not currently assigned to any bus
  const unassignedDrivers = drivers.filter(d => !d.busId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busNumber.trim() || !registrationNumber.trim() || !gpsDeviceId.trim()) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    addVehicle({
      busNumber: busNumber.toUpperCase(),
      registrationNumber: registrationNumber.toUpperCase(),
      model,
      capacity,
      driverId,
      routeId: '',
      gpsStatus: 'connected',
      gpsDeviceId: gpsDeviceId.trim(),
      insuranceExpiry: insuranceExpiry || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      fitnessExpiry: fitnessExpiry || new Date(Date.now() + 180*24*60*60*1000).toISOString().split('T')[0],
      pollutionExpiry: pollutionExpiry || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
      maintenanceStatus,
      status,
      maxSpeedLimit: 50,
    });

    addToast(`Vehicle ${busNumber} added successfully!`, 'success');
    
    // Clear and close
    setBusNumber('');
    setRegistrationNumber('');
    setGpsDeviceId('');
    setDriverId('');
    setCapacity(40);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-lg">Add New School Bus</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-850">
          <div className="grid grid-cols-2 gap-4">
            {/* Bus Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Bus ID/Number *
              </label>
              <input
                type="text"
                placeholder="e.g. BUS 36"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                required
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Registration Number *
              </label>
              <input
                type="text"
                placeholder="e.g. KA-03-EQ-9876"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                required
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
              >
                <option value="Tata Starbus 40S">Tata Starbus 40S</option>
                <option value="Ashok Leyland Lynx">Ashok Leyland Lynx</option>
                <option value="Force Traveller 26">Force Traveller 26</option>
                <option value="Eicher Starline">Eicher Starline</option>
              </select>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Seating Capacity
              </label>
              <input
                type="number"
                min="10"
                max="80"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                required
              />
            </div>

            {/* GPS Device ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                GPS Device ID (AIS-140) *
              </label>
              <input
                type="text"
                placeholder="e.g. GPS-AIS-9999"
                value={gpsDeviceId}
                onChange={(e) => setGpsDeviceId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                required
              />
            </div>

            {/* Driver Assignment */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Assign Driver
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
              >
                <option value="">-- No Driver --</option>
                {unassignedDrivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.experience} yrs exp)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4 pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Safety & Compliance Certificates</h4>
            <div className="grid grid-cols-3 gap-3">
              {/* Insurance */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Insurance Expiry
                </label>
                <input
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                />
              </div>

              {/* Fitness */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Fitness Cert Expiry
                </label>
                <input
                  type="date"
                  value={fitnessExpiry}
                  onChange={(e) => setFitnessExpiry(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                />
              </div>

              {/* Pollution */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Pollution Cert Expiry
                </label>
                <input
                  type="date"
                  value={pollutionExpiry}
                  onChange={(e) => setPollutionExpiry(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            {/* Maintenance */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Maintenance Status
              </label>
              <select
                value={maintenanceStatus}
                onChange={(e) => setMaintenanceStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
              >
                <option value="good">Good</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Fleet Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Fleet Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-blue-600/10"
            >
              Add Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
