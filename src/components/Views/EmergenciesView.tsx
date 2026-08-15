"use client";

import React, { useState } from 'react';
import { useApp, EmergencyEvent } from '@/context/AppContext';
import { 
  AlertOctagon, CheckCircle2, ShieldCheck, Clock, MapPin, 
  User, Users, Bus, AlertCircle, Phone, ArrowRight, ShieldAlert 
} from 'lucide-react';

export const EmergenciesView: React.FC = () => {
  const { 
    emergencies, vehicles, drivers, acknowledgeEmergency, 
    respondEmergency, resolveEmergency, assignReplacementBus, addToast 
  } = useApp();

  const [selectedEvent, setSelectedEvent] = useState<EmergencyEvent | null>(null);
  const [repBusId, setRepBusId] = useState('');

  const getBusNumber = (busId: string) => {
    return vehicles.find(v => v.id === busId)?.busNumber || 'None';
  };

  const getDriver = (driverId: string) => {
    return drivers.find(d => d.id === driverId);
  };

  const handleAcknowledge = (id: string) => {
    acknowledgeEmergency(id);
    addToast(`Emergency ${id} acknowledged.`, 'info');
    const ev = emergencies.find(e => e.id === id);
    if (ev) setSelectedEvent({ ...ev, status: 'acknowledged' });
  };

  const handleRespond = (id: string) => {
    respondEmergency(id);
    addToast(`Dispatch response initiated for Emergency ${id}.`, 'info');
    const ev = emergencies.find(e => e.id === id);
    if (ev) setSelectedEvent({ ...ev, status: 'responding' });
  };

  const handleResolve = (id: string) => {
    if (!confirm('Are you sure you want to mark this emergency as RESOLVED? This will restore vehicle status.')) return;
    resolveEmergency(id);
    addToast(`Emergency ${id} resolved successfully!`, 'success');
    const ev = emergencies.find(e => e.id === id);
    if (ev) setSelectedEvent({ ...ev, status: 'resolved' });
  };

  const handleDispatchReplacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !repBusId) return;

    assignReplacementBus(selectedEvent.id, repBusId);
    addToast(`Replacement bus dispatched! Students transferred.`, 'success');
    
    // Refresh
    const updated = emergencies.find(em => em.id === selectedEvent.id);
    if (updated) setSelectedEvent(updated);
    setRepBusId('');
  };

  // Find candidate buses for replacement (not currently in emergency, not the broken bus)
  const replacementCandidates = vehicles.filter(v => 
    v.status === 'active' && 
    v.id !== selectedEvent?.busId
  );

  return (
    <div className="space-y-6 text-slate-800 fade-in">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-red-50/50 p-4 border border-red-100 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-650 animate-pulse">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Emergencies</span>
            <span className="text-xl font-bold text-red-650 mt-0.5 block">
              {emergencies.filter(e => e.status !== 'resolved').length}
            </span>
          </div>
        </div>

        <div className="bg-amber-50/50 p-4 border border-amber-100 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Needs Response</span>
            <span className="text-xl font-bold text-amber-600 mt-0.5 block">
              {emergencies.filter(e => e.status === 'active').length}
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Resolved Incidents</span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">
              {emergencies.filter(e => e.status === 'resolved').length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Emergencies table list - 2 columns */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-3">Event ID</th>
                  <th className="px-5 py-3">Vehicle / Route</th>
                  <th className="px-5 py-3">Incident Type</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {emergencies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      No safety alerts logged.
                    </td>
                  </tr>
                ) : (
                  emergencies.map((e) => {
                    const isActive = selectedEvent?.id === e.id;
                    return (
                      <tr 
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          isActive ? 'bg-red-50/10' : ''
                        }`}
                      >
                        <td className="px-5 py-4 font-bold text-slate-900">{e.id}</td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">{getBusNumber(e.busId)}</div>
                          <span className="text-[10px] text-slate-400 font-semibold block">{e.routeId}</span>
                        </td>
                        <td className="px-5 py-4 font-bold text-red-600">{e.type}</td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-500">{e.time}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            e.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            e.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {e.severity}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            e.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                            e.status === 'responding' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800 font-bold'
                          }`}>
                            {e.status}
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

        {/* Selected SOS details & workflow action - 1 column */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">SOS Workflow Console</h3>
            </div>
          </div>

          {selectedEvent ? (
            <div className="space-y-4 text-xs font-semibold text-slate-700 fade-in">
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono">Incident Report</span>
                <h4 className="font-bold text-slate-900 text-sm">{selectedEvent.type}</h4>
                <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">{selectedEvent.description}</p>
              </div>

              {/* Workflow stage status */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workflow Actions</h4>
                
                <div className="flex flex-col gap-2">
                  {selectedEvent.status === 'active' && (
                    <button
                      onClick={() => handleAcknowledge(selectedEvent.id)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                    >
                      Acknowledge SOS Alert
                    </button>
                  )}

                  {selectedEvent.status === 'acknowledged' && (
                    <button
                      onClick={() => handleRespond(selectedEvent.id)}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                    >
                      Initiate Dispatch Response
                    </button>
                  )}

                  {selectedEvent.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(selectedEvent.id)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                    >
                      Mark Emergency Resolved
                    </button>
                  )}

                  {selectedEvent.status === 'resolved' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold uppercase text-[10px]">Closed Incident</p>
                        <p className="text-[11px] text-emerald-600">Incident resolved at {selectedEvent.resolvedTime}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Replacement Dispatch Form (Only for active emergency breakdown) */}
              {selectedEvent.status !== 'resolved' && selectedEvent.type === 'Vehicle Breakdown' && (
                <form onSubmit={handleDispatchReplacement} className="pt-3 border-t border-slate-100 space-y-2.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dispatch Replacement Bus</h4>
                  <div className="flex gap-2">
                    <select
                      value={repBusId}
                      onChange={(e) => setRepBusId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold focus:outline-none cursor-pointer"
                      required
                    >
                      <option value="">-- Choose Available Bus --</option>
                      {replacementCandidates.map(v => (
                        <option key={v.id} value={v.id}>{v.busNumber} ({v.model.split(' ')[0]})</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Dispatch
                    </button>
                  </div>
                </form>
              )}

              {/* Info checklist */}
              <div className="space-y-2 pt-3 border-t border-slate-100 font-semibold text-slate-650">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehicle details</h4>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Bus className="w-3.5 h-3.5 text-slate-400" /> Bus Number
                  </span>
                  <span className="text-slate-800 font-bold">{getBusNumber(selectedEvent.busId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Students stranded
                  </span>
                  <span className="text-slate-800 font-bold">{selectedEvent.studentsOnboard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Driver Name
                  </span>
                  <span className="text-slate-800 font-bold">{getDriver(selectedEvent.driverId)?.name || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Driver Contact
                  </span>
                  <span className="text-blue-600 font-bold">{getDriver(selectedEvent.driverId)?.phone || '--'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-450 text-xs">
              <AlertCircle className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p>No emergency selected</p>
              <p className="text-[10px] text-slate-400 font-medium">Select an SOS report from the list to initiate responding protocols</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
