"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Search, ClipboardList, CheckCircle2, RefreshCw, Eye } from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { students, vehicles, routes } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');

  // 1. Calculations
  const total = students.length;
  const boarded = students.filter(s => s.boardingStatus === 'boarded').length;
  const dropped = students.filter(s => s.boardingStatus === 'dropped off').length;
  const absent = students.filter(s => s.boardingStatus === 'absent').length;
  const pending = students.filter(s => s.boardingStatus === 'not boarded').length;

  // 2. Filter list
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoute = !selectedRouteId || s.routeId === selectedRouteId;
    return matchesSearch && matchesRoute;
  });

  const getBusNumber = (busId: string) => {
    return vehicles.find(v => v.id === busId)?.busNumber || 'None';
  };

  const getRouteCode = (routeId: string) => {
    return routes.find(r => r.id === routeId)?.routeNumber || 'None';
  };

  return (
    <div className="space-y-6 text-slate-800 fade-in">
      {/* 5 Summary widgets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total students</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{total}</span>
        </div>

        {/* Boarded */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Boarded</span>
          <span className="text-xl font-bold text-blue-600 mt-1 block">{boarded}</span>
        </div>

        {/* Dropped Off */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block">Dropped Off</span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">{dropped}</span>
        </div>

        {/* Absent */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Absent</span>
          <span className="text-xl font-bold text-red-650 mt-1 block">{absent}</span>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pending / Not Boarded</span>
          <span className="text-xl font-bold text-slate-600 mt-1 block">{pending}</span>
        </div>
      </div>

      {/* Roster Table Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
        <div className="flex flex-1 gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs bg-slate-50 font-medium"
            />
          </div>

          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="">All Routes</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.routeNumber}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-semibold">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Pickup Stop</th>
                <th className="px-5 py-3">Boarded time</th>
                <th className="px-5 py-3">Dropped time</th>
                <th className="px-5 py-3">Attendance status</th>
                <th className="px-5 py-3">Parent alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-705">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <span className="text-[9px] text-slate-400 font-semibold">ID: {s.id} • Class {s.class}-{s.section}</span>
                    </td>
                    <td className="px-5 py-4">{getBusNumber(s.busId)}</td>
                    <td className="px-5 py-4 truncate max-w-[150px]">{s.pickupStop}</td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-600">{s.boardingTime || '--:--'}</td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-600">{s.dropTime || '--:--'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        s.boardingStatus === 'boarded' ? 'bg-blue-100 text-blue-800' :
                        s.boardingStatus === 'dropped off' ? 'bg-emerald-100 text-emerald-800' :
                        s.boardingStatus === 'absent' ? 'bg-red-100 text-red-800 font-bold' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {s.boardingStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                        s.boardingStatus !== 'not boarded' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-450'
                      }`}>
                        {s.boardingStatus !== 'not boarded' ? 'Sent (SMS/WA)' : 'Queued'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
