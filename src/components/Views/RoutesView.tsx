"use client";

import React, { useState } from 'react';
import { useApp, Route } from '@/context/AppContext';
import { 
  Search, Play, Square, Trash, MapPin, 
  Clock, Route as RouteIcon, Plus, Info, ShieldAlert 
} from 'lucide-react';

interface RoutesViewProps {
  onOpenAddRoute: () => void;
}

export const RoutesView: React.FC<RoutesViewProps> = ({ onOpenAddRoute }) => {
  const { routes, vehicles, drivers, startRoute, stopRoute, deleteRoute, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Search filter
  const filteredRoutes = routes.filter(r => 
    r.routeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBusName = (busId: string) => {
    return vehicles.find(v => v.id === busId)?.busNumber || 'None';
  };

  const getDriverName = (driverId: string) => {
    return drivers.find(d => d.id === driverId)?.name || 'Unassigned';
  };

  const handleStartRoute = (id: string, code: string) => {
    startRoute(id);
    addToast(`Route ${code} has started running!`, 'success');
  };

  const handleStopRoute = (id: string, code: string) => {
    stopRoute(id);
    addToast(`Route ${code} has completed its trip.`, 'info');
  };

  return (
    <div className="space-y-6 text-slate-800 fade-in">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by route code or zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs bg-slate-50 font-medium"
          />
        </div>

        <button
          onClick={onOpenAddRoute}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/10 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Route
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table List of Routes - 2 columns */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-3">Route Code</th>
                  <th className="px-5 py-3">Zone / Name</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3 text-center">Stops</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                      No routes found.
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map((route) => {
                    const isActive = selectedRoute?.id === route.id;
                    return (
                      <tr 
                        key={route.id}
                        onClick={() => setSelectedRoute(route)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          isActive ? 'bg-blue-50/10' : ''
                        }`}
                      >
                        <td className="px-5 py-4 font-bold text-slate-900">{route.routeNumber}</td>
                        <td className="px-5 py-4 font-medium max-w-[150px] truncate">{route.name}</td>
                        <td className="px-5 py-4">{getBusName(route.busId)}</td>
                        <td className="px-5 py-4 font-medium">{getDriverName(route.driverId)}</td>
                        <td className="px-5 py-4 text-center">{route.stops.length}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            route.status === 'running' ? 'bg-emerald-100 text-emerald-800' :
                            route.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {route.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {route.status !== 'running' ? (
                              <button
                                onClick={() => handleStartRoute(route.id, route.routeNumber)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                title="Start Route Run"
                              >
                                <Play className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStopRoute(route.id, route.routeNumber)}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors cursor-pointer"
                                title="Complete Route Run"
                              >
                                <Square className="w-4 h-4 fill-amber-600 text-amber-600" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                deleteRoute(route.id);
                                if (selectedRoute?.id === route.id) setSelectedRoute(null);
                                addToast(`Route ${route.routeNumber} deleted.`, 'warning');
                              }}
                              className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Route"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Route Waypoints Panel - 1 column */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Route stops & times</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Select a route on the left to display path stops</p>
            </div>
          </div>

          {selectedRoute ? (
            <div className="space-y-4 fade-in">
              <div className="space-y-1 font-semibold text-xs text-slate-655 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="flex justify-between">
                  <span>Assigned Bus:</span>
                  <span className="text-slate-800 font-bold">{getBusName(selectedRoute.busId)}</span>
                </p>
                <p className="flex justify-between">
                  <span>Assigned Driver:</span>
                  <span className="text-slate-800 font-bold">{getDriverName(selectedRoute.driverId)}</span>
                </p>
                <p className="flex justify-between">
                  <span>Total Distance:</span>
                  <span className="text-slate-800 font-bold">{selectedRoute.distance} km</span>
                </p>
                <p className="flex justify-between">
                  <span>Expected Trip Duration:</span>
                  <span className="text-slate-800 font-bold">{selectedRoute.duration} mins</span>
                </p>
              </div>

              {/* Waypoint stops timeline */}
              <div className="relative pl-6 border-l border-blue-100 space-y-4 ml-3 py-1 text-xs">
                {selectedRoute.stops.map((stop, sIdx) => (
                  <div key={sIdx} className="relative font-semibold">
                    {/* Circle icon on the timeline */}
                    <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                      stop.status === 'arrived' ? 'bg-emerald-500' : 'bg-slate-300'
                    }`} />
                    
                    <div className="flex justify-between gap-1.5 items-start">
                      <div>
                        <h4 className="font-bold text-slate-800">{stop.name}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">Stop #{sIdx+1}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-750 block">{stop.scheduledTime}</span>
                        {stop.actualTime && (
                          <span className="text-[9px] text-emerald-600 font-bold block">Arrived: {stop.actualTime}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Info className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p>No route selected</p>
              <p className="text-[10px] text-slate-400">Choose a route from the list to previewstops schedule</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
