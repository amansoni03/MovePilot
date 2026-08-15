"use client";

import React, { useState } from 'react';
import { useApp, Vehicle } from '@/context/AppContext';
import { 
  Search, Shield, CheckCircle, AlertTriangle, XCircle, 
  Settings, User, Route, Video, AlertCircle, Plus, Info 
} from 'lucide-react';

interface VehiclesViewProps {
  onOpenAddVehicle: () => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({ onOpenAddVehicle }) => {
  const { vehicles, routes, drivers, changeVehicleStatus, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const filteredVehicles = vehicles.filter(v => 
    v.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRouteCode = (routeId: string) => {
    return routes.find(r => r.id === routeId)?.routeNumber || 'None';
  };

  const getDriverName = (driverId: string) => {
    return drivers.find(d => d.id === driverId)?.name || 'Unassigned';
  };

  const getStatusStyle = (status: Vehicle['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'maintenance': return 'bg-slate-100 text-slate-800';
      case 'emergency': return 'bg-red-100 text-red-800 font-bold';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getDocStatusIcon = (status: Vehicle['maintenanceStatus']) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'expiring': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'expired': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleStatusChange = (status: Vehicle['status']) => {
    if (!selectedVehicle) return;
    changeVehicleStatus(selectedVehicle.id, status);
    addToast(`Vehicle ${selectedVehicle.busNumber} status updated to ${status}.`, 'info');
    setSelectedVehicle(prev => prev ? { ...prev, status } : null);
  };

  return (
    <div className="space-y-6 text-slate-800 fade-in">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by bus number or registration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs bg-slate-50 font-medium"
          />
        </div>

        <button
          onClick={onOpenAddVehicle}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/10 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Vehicles list table - 2 columns */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-3">Bus Number</th>
                  <th className="px-5 py-3">Registration</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">GPS Connectivity</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      No vehicles found.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => {
                    const isActive = selectedVehicle?.id === vehicle.id;
                    return (
                      <tr 
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          isActive ? 'bg-blue-50/10' : ''
                        }`}
                      >
                        <td className="px-5 py-4 font-bold text-slate-900">{vehicle.busNumber}</td>
                        <td className="px-5 py-4 font-medium">{vehicle.registrationNumber}</td>
                        <td className="px-5 py-4">{getRouteCode(vehicle.routeId)}</td>
                        <td className="px-5 py-4 font-medium">{getDriverName(vehicle.driverId)}</td>
                        <td className="px-5 py-4">
                          <span className={`flex items-center gap-1 font-bold ${
                            vehicle.gpsStatus === 'connected' ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              vehicle.gpsStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                            }`} />
                            {vehicle.gpsStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${getStatusStyle(vehicle.status)}`}>
                            {vehicle.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Vehicle details & Safety compliance - 1 column */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Safety compliance</h3>
            </div>
          </div>

          {selectedVehicle ? (
            <div className="space-y-4 text-xs font-semibold text-slate-700 fade-in">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedVehicle.busNumber} Details</h4>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Model: {selectedVehicle.model} • Capacity: {selectedVehicle.capacity} seats
                </span>
              </div>

              {/* Status Update Form */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Vehicle Status</h4>
                <div className="flex gap-1.5">
                  {(['active', 'inactive', 'maintenance'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`flex-1 py-1.5 border text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer ${
                        selectedVehicle.status === s
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety Checklist indicators */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document compliance</h4>
                
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-600">Fitness Certificate</span>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    {getDocStatusIcon(selectedVehicle.maintenanceStatus)}
                    <span className="text-[10px]">{selectedVehicle.fitnessExpiry}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-600">Commercial Insurance</span>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px]">{selectedVehicle.insuranceExpiry}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-600">Pollution Certificate</span>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px]">{selectedVehicle.pollutionExpiry}</span>
                  </div>
                </div>
              </div>

              {/* System hardware check */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Hardware Diagnostics</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">CCTV System</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <Video className="w-3.5 h-3.5" /> Online
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency SOS Button</span>
                  <span className="text-emerald-600 font-bold">Tested & Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">First-aid Kit</span>
                  <span className="text-emerald-600 font-bold">Stocked</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Speed Limit Governor</span>
                  <span className="text-slate-850 font-bold">Max 50 km/h</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-450 text-xs">
              <Info className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p>No vehicle selected</p>
              <p className="text-[10px] text-slate-400">Choose a bus from the registry list to verify compliance details or change status</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
