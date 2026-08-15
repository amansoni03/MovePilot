"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FileBarChart, Download, Calendar, ArrowUpRight, TrendingUp, AlertOctagon, UserCheck } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { students, routes, emergencies, vehicles, addToast } = useApp();
  const [dateFilter, setDateFilter] = useState('2026-08-15');

  // Dynamic calculations for charts
  const tripsCompleted = routes.filter(r => r.status === 'completed').length;
  const runningTrips = routes.filter(r => r.status === 'running').length;
  const delayedBuses = vehicles.filter(v => v.currentSpeed > 60).length + 2; // mockup offset
  const boardingCount = students.filter(s => s.boardingStatus === 'boarded' || s.boardingStatus === 'dropped off').length;
  const absentCount = students.filter(s => s.boardingStatus === 'absent').length;
  const total = students.length || 1;

  const exportCSV = (dataType: 'attendance' | 'emergencies' | 'vehicles') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (dataType === 'attendance') {
      headers = ['Student ID', 'Name', 'Class', 'Pickup Stop', 'Status', 'Boarded Time', 'Dropped Time'];
      rows = students.map(s => [
        s.id, s.name, `${s.class}-${s.section}`, s.pickupStop, s.boardingStatus, s.boardingTime || 'N/A', s.dropTime || 'N/A'
      ]);
      filename = `Attendance_Report_${dateFilter}.csv`;
    } else if (dataType === 'emergencies') {
      headers = ['Event ID', 'Bus ID', 'Route ID', 'Incident Type', 'Severity', 'Status', 'Time', 'Description'];
      rows = emergencies.map(e => [
        e.id, e.busId, e.routeId, e.type, e.severity, e.status, e.time, e.description
      ]);
      filename = `Emergency_ SOS_Log_${dateFilter}.csv`;
    } else {
      headers = ['Bus Number', 'Registration Number', 'Model', 'Capacity', 'Driver ID', 'Route ID', 'GPS Connected', 'Status'];
      rows = vehicles.map(v => [
        v.busNumber, v.registrationNumber, v.model, String(v.capacity), v.driverId || 'N/A', v.routeId || 'N/A', v.gpsStatus, v.status
      ]);
      filename = `Vehicle_Inventory_Report_${dateFilter}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(`Report downloaded successfully: ${filename}`, 'success');
  };

  return (
    <div className="space-y-6 text-slate-800 fade-in">
      {/* Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none text-slate-700 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV('attendance')}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-100 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Attendance
          </button>
          <button
            onClick={() => exportCSV('emergencies')}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-100 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export SOS Logs
          </button>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card: Trips Stats */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Completed Runs</span>
            <span className="text-2xl font-bold mt-1 block">{tripsCompleted} <span className="text-xs text-slate-400 font-medium">trips</span></span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
            <span>Running right now: <strong>{runningTrips}</strong></span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Card: Transferred */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Students Boarded</span>
            <span className="text-2xl font-bold mt-1 block">{boardingCount} <span className="text-xs text-slate-400 font-medium">kids</span></span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
            <span>Absent today: <strong>{absentCount}</strong></span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        {/* Card: Delay */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Average delay</span>
            <span className="text-2xl font-bold mt-1 block">12 <span className="text-xs text-slate-400 font-medium">minutes</span></span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
            <span>Delayed routes: <strong>{delayedBuses}</strong></span>
            <ArrowUpRight className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
        </div>

        {/* Card: Emergency SOS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Safety events</span>
            <span className="text-2xl font-bold mt-1 block text-red-650">{emergencies.length} <span className="text-xs text-slate-400 font-medium">logged</span></span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
            <span>Resolved: <strong>{emergencies.filter(e => e.status === 'resolved').length}</strong></span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
        </div>
      </div>

      {/* Visual Chart Widgets (HTML representations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Delay Analytics Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Route delay performance (mins)</h3>
          
          <div className="space-y-4 text-xs font-semibold">
            {[
              { route: 'Route 12 - radial', delay: 15, color: 'bg-red-500' },
              { route: 'Route 07 - Greenfield', delay: 4, color: 'bg-emerald-500' },
              { route: 'Route 03 - Hillside', delay: 18, color: 'bg-red-500' },
              { route: 'Route 18 - Lakeview', delay: 0, color: 'bg-slate-300' },
              { route: 'Route 05 - St. Mary', delay: 8, color: 'bg-amber-500' },
            ].map((r, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>{r.route}</span>
                  <span>{r.delay} mins</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${r.color}`} 
                    style={{ width: `${Math.max(r.delay * 4, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Percentage Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Daily attendance compliance</h3>
          
          <div className="flex items-center justify-around h-44 text-center">
            {/* Boarded */}
            <div className="space-y-2">
              <div className="relative w-24 h-24 rounded-full border-8 border-blue-500 flex items-center justify-center font-bold text-lg text-blue-600">
                {Math.round((boardingCount / total) * 100)}%
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Boarded</span>
            </div>

            {/* Absent */}
            <div className="space-y-2">
              <div className="relative w-24 h-24 rounded-full border-8 border-red-500 flex items-center justify-center font-bold text-lg text-red-650">
                {Math.round((absentCount / total) * 100)}%
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Absent</span>
            </div>

            {/* Unscanned */}
            <div className="space-y-2">
              <div className="relative w-24 h-24 rounded-full border-8 border-slate-300 flex items-center justify-center font-bold text-lg text-slate-600">
                {Math.round(((total - boardingCount - absentCount) / total) * 100)}%
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
