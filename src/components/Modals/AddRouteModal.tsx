"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Route, Plus, Trash, X, Route as RouteIcon } from 'lucide-react';

interface AddRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddRouteModal: React.FC<AddRouteModalProps> = ({ isOpen, onClose }) => {
  const { addRoute, vehicles, drivers, addToast } = useApp();

  const [routeName, setRouteName] = useState('');
  const [routeNumber, setRouteNumber] = useState('');
  const [busId, setBusId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [distance, setDistance] = useState(15);
  const [duration, setDuration] = useState(40);
  const [departureTime, setDepartureTime] = useState('07:30 AM');
  const [expectedArrivalTime, setExpectedArrivalTime] = useState('08:15 AM');
  
  // Stops management
  const [stops, setStops] = useState<{ name: string; lat: number; lng: number; scheduledTime: string }[]>([
    { name: 'Indiranagar Circle Stop 1', lat: 12.9785, lng: 77.6408, scheduledTime: '07:35 AM' },
    { name: 'Koramangala Stop 2', lat: 12.9348, lng: 77.6189, scheduledTime: '07:50 AM' },
  ]);

  if (!isOpen) return null;

  const handleAddStop = () => {
    // Generate slight offset coordinates near Bangalore for mockup
    const lastStop = stops[stops.length - 1] || { lat: 12.9716, lng: 77.5946 };
    setStops(prev => [
      ...prev,
      {
        name: `Stop ${prev.length + 1}`,
        lat: lastStop.lat + (Math.random() - 0.5) * 0.015,
        lng: lastStop.lng + (Math.random() - 0.5) * 0.015,
        scheduledTime: '08:00 AM'
      }
    ]);
  };

  const handleRemoveStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index));
  };

  const handleStopChange = (index: number, field: string, value: string | number) => {
    setStops(prev => prev.map((st, i) => i === index ? { ...st, [field]: value } : st));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName.trim() || !routeNumber.trim() || stops.length === 0) {
      addToast('Please provide route details and at least one stop.', 'error');
      return;
    }

    addRoute({
      name: routeName.trim(),
      routeNumber: routeNumber.trim(),
      busId,
      driverId,
      studentsCount: 0,
      distance,
      duration,
      status: 'scheduled',
      departureTime,
      expectedArrivalTime,
      stops: stops.map(st => ({
        name: st.name.trim(),
        lat: Number(st.lat),
        lng: Number(st.lng),
        scheduledTime: st.scheduledTime
      }))
    });

    addToast(`Route ${routeNumber} added successfully!`, 'success');
    
    // Clear and close
    setRouteName('');
    setRouteNumber('');
    setBusId('');
    setDriverId('');
    setStops([
      { name: 'Indiranagar Circle Stop 1', lat: 12.9785, lng: 77.6408, scheduledTime: '07:35 AM' },
      { name: 'Koramangala Stop 2', lat: 12.9348, lng: 77.6189, scheduledTime: '07:50 AM' },
    ]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-lg">Add New Bus Route</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800">
          <div className="grid grid-cols-2 gap-4">
            {/* Route Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Route Code / Number *
              </label>
              <input
                type="text"
                placeholder="e.g. Route 23"
                value={routeNumber}
                onChange={(e) => setRouteNumber(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                required
              />
            </div>

            {/* Route Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Route Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Greenfield ↔ Indiranagar Zone"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                required
              />
            </div>

            {/* Assigned Bus */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Assign Vehicle
              </label>
              <select
                value={busId}
                onChange={(e) => setBusId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
              >
                <option value="">-- Choose Bus --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.busNumber} ({v.model})</option>
                ))}
              </select>
            </div>

            {/* Assigned Driver */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Assign Driver
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
              >
                <option value="">-- Choose Driver --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                ))}
              </select>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Distance (km)
              </label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Expected Duration (mins)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                required
              />
            </div>

            {/* Departure */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Departure Time
              </label>
              <input
                type="text"
                placeholder="07:30 AM"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
              />
            </div>

            {/* Arrival */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Expected Arrival
              </label>
              <input
                type="text"
                placeholder="08:30 AM"
                value={expectedArrivalTime}
                onChange={(e) => setExpectedArrivalTime(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
              />
            </div>
          </div>

          {/* Stops List */}
          <div className="border-t border-slate-100 my-4 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Route Stops / Waypoints</h4>
              <button
                type="button"
                onClick={handleAddStop}
                className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Stop
              </button>
            </div>

            <div className="space-y-2">
              {stops.map((stop, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150 fade-in">
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                    {idx + 1}
                  </div>
                  
                  {/* Name */}
                  <input
                    type="text"
                    placeholder="Stop Name"
                    value={stop.name}
                    onChange={(e) => handleStopChange(idx, 'name', e.target.value)}
                    className="flex-1 px-2.5 py-1 border border-slate-200 bg-white rounded-lg text-xs"
                    required
                  />

                  {/* Scheduled Time */}
                  <input
                    type="text"
                    placeholder="7:45 AM"
                    value={stop.scheduledTime}
                    onChange={(e) => handleStopChange(idx, 'scheduledTime', e.target.value)}
                    className="w-20 px-2.5 py-1 border border-slate-200 bg-white rounded-lg text-xs text-center"
                    required
                  />

                  {/* Coordinates mock hidden or small */}
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lat"
                    value={stop.lat}
                    onChange={(e) => handleStopChange(idx, 'lat', Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-slate-200 bg-white rounded-lg text-[10px] text-center"
                    required
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lng"
                    value={stop.lng}
                    onChange={(e) => handleStopChange(idx, 'lng', Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-slate-200 bg-white rounded-lg text-[10px] text-center"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveStop(idx)}
                    disabled={stops.length <= 1}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 cursor-pointer"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
              Add Route
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
