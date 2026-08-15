"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LiveMap } from '@/components/LiveMap';
import { 
  Bus, Users, Route, AlertTriangle, Play, Square, 
  MapPin, Clock, Gauge, ArrowRight, ShieldAlert,
  Calendar, CheckCircle, HelpCircle
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onOpenScanBoarding: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, onOpenScanBoarding }) => {
  const { 
    vehicles, routes, students, emergencies, activities, 
    simulationActive, setSimulationActive, startRoute, stopRoute, addToast
  } = useApp();

  const [selectedRouteFilter, setSelectedRouteFilter] = useState('');

  // 1. Dynamic Calculations
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  
  const totalStudents = students.length;
  const onboardStudents = students.filter(s => s.boardingStatus === 'boarded').length;
  
  const totalRoutes = routes.length;
  const runningRoutes = routes.filter(r => r.status === 'running').length;
  
  const activeAlerts = emergencies.filter(e => e.status !== 'resolved').length;

  const handleToggleSimulation = () => {
    setSimulationActive(!simulationActive);
    addToast(
      `Simulation ${!simulationActive ? 'started' : 'paused'}!`,
      !simulationActive ? 'success' : 'warning'
    );
  };

  // Recent 6 activities
  const recentActivities = activities.slice(0, 6);

  // Fictional Upcoming Trips
  const upcomingTrips = [
    { bus: "BUS 05", route: "Route 5", dest: "St. Mary School", time: "02:30 PM", status: "On Time" },
    { bus: "BUS 09", route: "Route 9", dest: "Greenfield School", time: "02:45 PM", status: "On Time" },
    { bus: "BUS 11", route: "Route 11", dest: "Lake View College", time: "03:00 PM", status: "On Time" },
    { bus: "BUS 14", route: "Route 14", dest: "Sunrise School", time: "03:15 PM", status: "Delayed" },
  ];

  return (
    <div className="space-y-6 fade-in text-slate-800">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Active Vehicles */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Vehicles</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{activeVehicles}</span>
              <span className="text-xs text-slate-400">/ {totalVehicles}</span>
            </div>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(activeVehicles / totalVehicles) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block">{Math.round((activeVehicles / totalVehicles) * 100)}% in service</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Bus className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Students Onboard */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students Onboard</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{onboardStudents}</span>
              <span className="text-xs text-slate-400">/ {totalStudents}</span>
            </div>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(onboardStudents / totalStudents) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block">{Math.round((onboardStudents / totalStudents) * 100)}% of capacity</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Active Routes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Routes</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{runningRoutes}</span>
              <span className="text-xs text-slate-400">/ {totalRoutes}</span>
            </div>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(runningRoutes / totalRoutes) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block">{Math.round((runningRoutes / totalRoutes) * 100)}% running</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Route className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Alerts */}
        <button
          onClick={() => setActiveTab('emergencies')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between text-left hover:border-red-200 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Alerts</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${activeAlerts > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {activeAlerts}
              </span>
              <span className="text-xs text-slate-400">active</span>
            </div>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${activeAlerts > 0 ? 'bg-red-500' : 'bg-slate-450'}`}
                style={{ width: activeAlerts > 0 ? '100%' : '0%' }}
              />
            </div>
            <span className={`text-[10px] font-semibold block ${activeAlerts > 0 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
              {activeAlerts > 0 ? 'Requires immediate action' : 'All systems normal'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            activeAlerts > 0 
              ? 'bg-red-50 text-red-600 group-hover:bg-red-100' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* Main Content Layout: Tracking Map & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Tracking Map Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 lg:col-span-2 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                Live Vehicle Tracking
                <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live GPS
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time simulation of school buses on active routes</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSimulation}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  simulationActive
                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {simulationActive ? (
                  <>
                    <Square className="w-3 h-3 fill-amber-700 text-amber-700" /> Pause Simulation
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-emerald-700 text-emerald-700" /> Resume Simulation
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveTab('tracking')}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Fullscreen Map
              </button>
            </div>
          </div>

          {/* Interactive Map Wrapper */}
          <div className="h-[380px] w-full bg-slate-50 rounded-2xl relative">
            <LiveMap />
          </div>
        </div>

        {/* Right Side Widgets: Recent Activity & Upcoming Trips */}
        <div className="space-y-6">
          {/* Recent Activity Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col h-[280px]">
            <h3 className="font-bold text-slate-900 text-sm">Recent Activity</h3>
            <p className="text-[10px] text-slate-400 font-semibold mb-3">Logs generated from transport operation</p>
            
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {recentActivities.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No activity logs recorded yet.
                </div>
              ) : (
                recentActivities.map((act) => {
                  const typeColors = {
                    boarding: 'bg-blue-100 text-blue-600',
                    start: 'bg-purple-100 text-purple-600',
                    delay: 'bg-amber-100 text-amber-600',
                    emergency: 'bg-red-100 text-red-600',
                    complete: 'bg-emerald-100 text-emerald-600',
                    general: 'bg-slate-100 text-slate-600',
                  }[act.type];

                  return (
                    <div key={act.id} className="flex gap-3 text-xs leading-normal font-semibold">
                      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold ${typeColors}`}>
                        {act.type[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-700 font-medium">{act.text}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{act.time}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Upcoming Trips Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col h-[220px]">
            <h3 className="font-bold text-slate-900 text-sm">Upcoming Return Trips</h3>
            <p className="text-[10px] text-slate-400 font-semibold mb-3">Planned school drop-offs schedules</p>

            <div className="flex-1 overflow-y-auto space-y-3">
              {upcomingTrips.map((trip, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-2 text-xs font-semibold">
                  <div>
                    <h4 className="font-bold text-slate-800">{trip.bus} • {trip.route}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{trip.dest}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-750 font-bold block">{trip.time}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      trip.status === 'Delayed' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Content: Quick Actions Guide */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Console Quick Workflow Demonstration Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-650 font-medium">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</span>
              <h4 className="font-bold text-slate-800 text-sm">Start & Board</h4>
            </div>
            <p>Go to **Live Tracking**, click **BUS 07**, start its route, then click **Scan Student** in the sidebar to mark children boarded.</p>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">2</span>
              <h4 className="font-bold text-slate-800 text-sm">Simulate SOS Breakdowns</h4>
            </div>
            <p>Click **SOS Alert** in the sidebar. Select **BUS 12** or **BUS 07** to report a breakdown. Watch the dashboard count change.</p>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-50 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">3</span>
              <h4 className="font-bold text-slate-800 text-sm">Acknowledge & Resolve</h4>
            </div>
            <p>Go to **Emergency Events**, acknowledge the alarm, dispatch a **Replacement Bus**, notify parents, and click Resolve.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
