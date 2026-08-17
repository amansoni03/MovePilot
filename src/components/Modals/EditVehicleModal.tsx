"use client";

import React, { useState, useEffect } from 'react';
import { useApp, Vehicle } from '@/context/AppContext';
import { Bus, X, Trash2 } from 'lucide-react';

interface EditVehicleModalProps {
  isOpen: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}

export const EditVehicleModal: React.FC<EditVehicleModalProps> = ({ isOpen, vehicle, onClose }) => {
  const { editVehicle, deleteVehicle, drivers, routes, addToast } = useApp();

  const [busNumber, setBusNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [model, setModel] = useState('Tata Starbus 40S');
  const [capacity, setCapacity] = useState(40);
  const [driverId, setDriverId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [gpsDeviceId, setGpsDeviceId] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [fitnessExpiry, setFitnessExpiry] = useState('');
  const [pollutionExpiry, setPollutionExpiry] = useState('');
  const [maintenanceStatus, setMaintenanceStatus] = useState<Vehicle['maintenanceStatus']>('good');
  const [status, setStatus] = useState<Vehicle['status']>('active');

  useEffect(() => {
    if (vehicle) {
      setBusNumber(vehicle.busNumber);
      setRegistrationNumber(vehicle.registrationNumber);
      setModel(vehicle.model);
      setCapacity(vehicle.capacity);
      setDriverId(vehicle.driverId);
      setRouteId(vehicle.routeId);
      setGpsDeviceId(vehicle.gpsDeviceId);
      setInsuranceExpiry(vehicle.insuranceExpiry);
      setFitnessExpiry(vehicle.fitnessExpiry);
      setPollutionExpiry(vehicle.pollutionExpiry);
      setMaintenanceStatus(vehicle.maintenanceStatus);
      setStatus(vehicle.status);
    }
  }, [vehicle]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    editVehicle({
      ...vehicle,
      busNumber: busNumber.toUpperCase(),
      registrationNumber: registrationNumber.toUpperCase(),
      model,
      capacity,
      driverId,
      routeId,
      gpsDeviceId,
      insuranceExpiry,
      fitnessExpiry,
      pollutionExpiry,
      maintenanceStatus,
      status
    });

    addToast(`Vehicle ${busNumber} updated successfully!`, 'success');
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove bus "${vehicle.busNumber}" from fleet?`)) {
      deleteVehicle(vehicle.id);
      addToast(`Vehicle ${vehicle.busNumber} removed.`, 'warning');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-base">Edit School Bus Details</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs font-semibold">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Bus ID / Number *
              </label>
              <input
                type="text"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Registration Number *
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none font-semibold"
              >
                <option value="Tata Starbus 40S">Tata Starbus 40S</option>
                <option value="Ashok Leyland Lynx">Ashok Leyland Lynx</option>
                <option value="Force Traveller 26">Force Traveller 26</option>
                <option value="Eicher Starline">Eicher Starline</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Seating Capacity</label>
              <input
                type="number"
                min="10"
                max="80"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hardware GPS IMEI / ID</label>
              <input
                type="text"
                value={gpsDeviceId}
                onChange={(e) => setGpsDeviceId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Driver</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none font-semibold"
              >
                <option value="">-- No Driver --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.experience} yrs exp)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Safety & Compliance Certificates</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Insurance Expiry</label>
                <input
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Fitness Expiry</label>
                <input
                  type="date"
                  value={fitnessExpiry}
                  onChange={(e) => setFitnessExpiry(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Pollution Expiry</label>
                <input
                  type="date"
                  value={pollutionExpiry}
                  onChange={(e) => setPollutionExpiry(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Maintenance Status</label>
              <select
                value={maintenanceStatus}
                onChange={(e) => setMaintenanceStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none font-semibold"
              >
                <option value="good">Good</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="maintenance">In Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fleet Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none font-semibold"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="emergency">Emergency Breakdown</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all text-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Bus
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
