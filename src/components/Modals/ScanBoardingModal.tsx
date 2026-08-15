"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { QrCode, Search, User, MapPin, Phone, Shield, X, Check, UserMinus } from 'lucide-react';

interface ScanBoardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScanBoardingModal: React.FC<ScanBoardingModalProps> = ({ isOpen, onClose }) => {
  const { students, vehicles, routes, markStudentBoarding, addToast } = useApp();
  const [studentIdInput, setStudentIdInput] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<typeof students[0] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSearchedStudent(null);

    const id = studentIdInput.trim().toUpperCase();
    if (!id) {
      setErrorMsg('Please enter a student ID.');
      return;
    }

    const student = students.find(s => s.id === id || s.id.replace('STU-', '') === id);
    if (!student) {
      setErrorMsg(`No student found with ID "${id}". Try STU-0001 to STU-0600.`);
      return;
    }

    setSearchedStudent(student);
  };

  const handleAction = (status: 'boarded' | 'dropped off' | 'absent') => {
    if (!searchedStudent) return;
    
    markStudentBoarding(searchedStudent.id, status);
    addToast(
      `Student ${searchedStudent.name} marked as ${status === 'boarded' ? 'Boarded' : status === 'dropped off' ? 'Dropped Off' : 'Absent'} successfully.`,
      status === 'boarded' || status === 'dropped off' ? 'success' : 'warning'
    );
    
    // Clear and close
    setStudentIdInput('');
    setSearchedStudent(null);
    onClose();
  };

  const associatedRoute = searchedStudent ? routes.find(r => r.id === searchedStudent.routeId) : null;
  const associatedBus = searchedStudent ? vehicles.find(v => v.id === searchedStudent.busId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-lg">RFID / QR Boarding Scanner</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Scanner Input */}
          <form onSubmit={handleSearch} className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Scan Card or Enter Student ID
            </label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. STU-0007, STU-0024"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
              >
                Scan
              </button>
            </div>
            {errorMsg && <p className="text-xs text-red-500 mt-2 font-medium">{errorMsg}</p>}
          </form>

          {/* Student Info Card */}
          {searchedStudent ? (
            <div className="space-y-4 border border-slate-100 p-4 rounded-xl bg-slate-50 fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {searchedStudent.name[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{searchedStudent.name}</h4>
                  <p className="text-xs text-slate-500">
                    ID: {searchedStudent.id} • Class {searchedStudent.class}-{searchedStudent.section}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-200 pt-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Bus & Route</span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {associatedBus?.busNumber || 'None'} ({associatedRoute?.routeNumber || 'None'})
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Pickup Point</span>
                  </div>
                  <p className="font-semibold text-slate-900 truncate" title={searchedStudent.pickupStop}>
                    {searchedStudent.pickupStop}
                  </p>
                </div>

                <div className="space-y-2 col-span-2">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Parent / Emergency Contact</span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {searchedStudent.parentName} ({searchedStudent.parentContact})
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-3">
                <span className="text-slate-500">Current Status:</span>
                <span className={`px-2.5 py-1 rounded-full font-semibold ${
                  searchedStudent.boardingStatus === 'boarded' ? 'bg-blue-100 text-blue-800' :
                  searchedStudent.boardingStatus === 'dropped off' ? 'bg-emerald-100 text-emerald-800' :
                  searchedStudent.boardingStatus === 'absent' ? 'bg-red-100 text-red-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {searchedStudent.boardingStatus.toUpperCase()}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleAction('boarded')}
                  disabled={searchedStudent.boardingStatus === 'boarded'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Boarded
                </button>
                <button
                  onClick={() => handleAction('dropped off')}
                  disabled={searchedStudent.boardingStatus === 'dropped off'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Dropped Off
                </button>
                <button
                  onClick={() => handleAction('absent')}
                  disabled={searchedStudent.boardingStatus === 'absent'}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-red-200"
                >
                  <UserMinus className="w-3.5 h-3.5" /> Absent
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
              <User className="w-12 h-12 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium">Scan code above to retrieve details</p>
              <p className="text-xs text-slate-400 mt-1">Simulated scan will autofill child records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
