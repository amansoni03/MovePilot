"use client";

import React, { useState } from 'react';
import { useApp, Student } from '@/context/AppContext';
import { Search, CheckCircle2, XCircle, UserMinus, QrCode, SlidersHorizontal, Info, UserPlus, Edit } from 'lucide-react';

interface StudentsViewProps {
  onOpenScanBoarding: () => void;
  onOpenAddStudent?: () => void;
  onOpenEditStudent?: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onOpenScanBoarding, onOpenAddStudent, onOpenEditStudent }) => {
  const { students, vehicles, routes, markStudentBoarding } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'boarded' | 'not boarded' | 'dropped off' | 'absent'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filter and Search logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pickupStop.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesFilter = statusFilter === 'all' || s.boardingStatus === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getBusNumber = (busId: string) => {
    return vehicles.find(v => v.id === busId)?.busNumber || 'None';
  };

  const getRouteNumber = (routeId: string) => {
    return routes.find(r => r.id === routeId)?.routeNumber || 'None';
  };

  return (
    <div className="space-y-6 text-slate-800 fade-in">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, ID, or stop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs bg-slate-50 font-medium"
          />
        </div>

        {/* Boarding Filters & Scan button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 border border-slate-100 bg-slate-50 px-2 py-1 rounded-xl text-xs font-semibold text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Status:</span>
            {(['all', 'boarded', 'not boarded', 'dropped off', 'absent'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold transition-all cursor-pointer ${
                  statusFilter === f
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenScanBoarding}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <QrCode className="w-4 h-4" /> RFID Simulator
          </button>

          {onOpenAddStudent && (
            <button
              onClick={onOpenAddStudent}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-blue-600/10"
            >
              <UserPlus className="w-4 h-4" /> Enroll Student
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table list - 2 columns */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Bus/Route</th>
                  <th className="px-5 py-3">Pickup Stop</th>
                  <th className="px-5 py-3">Boarding</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-750">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-450">
                      No matching student records found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const isActive = selectedStudent?.id === student.id;
                    return (
                      <tr 
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          isActive ? 'bg-blue-50/10' : ''
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {student.name[0]}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{student.name}</h4>
                              <span className="text-[10px] text-slate-400 font-semibold block leading-tight">
                                ID: {student.id} • Class {student.class}-{student.section}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">{getBusNumber(student.busId)}</div>
                          <span className="text-[10px] text-slate-450 font-medium block">{getRouteNumber(student.routeId)}</span>
                        </td>
                        <td className="px-5 py-4 truncate max-w-[130px]">{student.pickupStop}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            student.boardingStatus === 'boarded' ? 'bg-blue-100 text-blue-800' :
                            student.boardingStatus === 'dropped off' ? 'bg-emerald-100 text-emerald-800' :
                            student.boardingStatus === 'absent' ? 'bg-red-100 text-red-800 font-bold' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {student.boardingStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => markStudentBoarding(student.id, 'boarded')}
                              className="p-1 hover:bg-blue-50 text-blue-600 rounded-lg cursor-pointer"
                              title="Mark Boarded"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => markStudentBoarding(student.id, 'dropped off')}
                              className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer"
                              title="Mark Dropped Off"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </button>
                            <button
                              onClick={() => markStudentBoarding(student.id, 'absent')}
                              className="p-1 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer"
                              title="Mark Absent"
                            >
                              <UserMinus className="w-4 h-4" />
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

        {/* Selected Student Details card - 1 column */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Student Profile</h3>
            {selectedStudent && onOpenEditStudent && (
              <button
                onClick={() => onOpenEditStudent(selectedStudent)}
                className="flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Record
              </button>
            )}
          </div>

          {selectedStudent ? (
            <div className="space-y-4 text-xs font-semibold text-slate-700 fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
                  {selectedStudent.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedStudent.name}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    ID: {selectedStudent.id} • Class {selectedStudent.class}-{selectedStudent.section}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Bus:</span>
                  <span className="text-slate-800 font-bold">{getBusNumber(selectedStudent.busId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Route:</span>
                  <span className="text-slate-800 font-bold">{getRouteNumber(selectedStudent.routeId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pickup Stop:</span>
                  <span className="text-slate-800 font-bold">{selectedStudent.pickupStop}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Boarding Status:</span>
                  <span className="text-slate-850 font-bold capitalize">{selectedStudent.boardingStatus}</span>
                </div>
                {selectedStudent.boardingTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Boarding Time:</span>
                    <span className="text-slate-800 font-bold">{selectedStudent.boardingTime}</span>
                  </div>
                )}
                {selectedStudent.dropTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Drop-off Time:</span>
                    <span className="text-slate-800 font-bold">{selectedStudent.dropTime}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent Details</h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Parent Name:</span>
                  <span className="text-slate-800 font-bold">{selectedStudent.parentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact Number:</span>
                  <span className="text-blue-600 font-bold">{selectedStudent.parentContact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Emergency Number:</span>
                  <span className="text-red-500 font-bold">{selectedStudent.emergencyContact}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-450 text-xs">
              <Info className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p>No student selected</p>
              <p className="text-[10px] text-slate-400">Choose a student from the list to view profile, timings, and parent contacts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
