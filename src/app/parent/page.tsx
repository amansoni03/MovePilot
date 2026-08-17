"use client";

import React, { useState } from 'react';
import { AppProvider, useApp, Student } from '@/context/AppContext';
import { LiveMap } from '@/components/LiveMap';
import { ToastContainer } from '@/components/ToastContainer';
import { 
  Bus, User, LogOut, Phone, ShieldCheck, MapPin, Gauge, Clock, 
  CheckCircle2, XCircle, UserMinus, AlertTriangle, ShieldAlert, Award, QrCode, Lock, Key
} from 'lucide-react';

function ParentDashboardContent() {
  const { students, vehicles, routes, drivers, emergencies, markChildAbsentToday, addToast } = useApp();

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState('STU-0001');
  const [parentContactInput, setParentContactInput] = useState('+91 99887 70001');
  const [passwordInput, setPasswordInput] = useState('123456');
  const [authError, setAuthError] = useState('');

  // Logged-in Student state
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const formattedId = studentIdInput.trim().toUpperCase();
    const formattedContact = parentContactInput.trim();

    if (!formattedId) {
      setAuthError('Please enter your Student ID.');
      return;
    }

    // Match student record
    const match = students.find(s => 
      s.id === formattedId || 
      s.id.replace('STU-', '') === formattedId.replace('STU-', '')
    );

    if (!match) {
      setAuthError(`No student record found for ID "${formattedId}". (Try STU-0001)`);
      return;
    }

    setCurrentStudent(match);
    setIsLoggedIn(true);
    addToast(`Welcome back, ${match.parentName}! Access granted to ${match.name}'s bus tracker.`, 'success');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentStudent(null);
    addToast('Logged out of Parent Portal.', 'info');
  };

  // Associated entities for current student
  const student = currentStudent ? (students.find(s => s.id === currentStudent.id) || currentStudent) : null;
  const bus = student ? vehicles.find(v => v.id === student.busId) : null;
  const route = student ? routes.find(r => r.id === student.routeId) : null;
  const driver = student ? drivers.find(d => d.id === (route?.driverId || bus?.driverId)) : null;
  const activeEmergency = bus ? emergencies.find(e => e.busId === bus.id && e.status === 'active') : null;

  // Proximity Alert Check (Simulated check if bus is running & approaching child's stop)
  const isBusRunning = route?.status === 'running';
  const isNearStop = isBusRunning && bus?.currentSpeed! > 0;
  const proximityDistance = 450; // meters

  // Handle Mark Absent Today
  const handleMarkAbsent = () => {
    if (!student) return;
    if (confirm(`Are you sure you want to mark ${student.name} ABSENT for today's bus commute? This will immediately notify the driver and school transport admin.`)) {
      markChildAbsentToday(student.id, 'Parent marked absent via Parent Portal');
      addToast(`${student.name} marked ABSENT today. Driver & school notified.`, 'warning');
    }
  };

  // ==========================================
  // UNAUTHENTICATED LOGIN SCREEN
  // ==========================================
  if (!isLoggedIn || !student) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-white text-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-100 relative z-10 space-y-6 fade-in">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-blue-600/30">
              <Bus className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Parent Portal Login</h1>
            <p className="text-xs text-slate-400 font-semibold">
              Enter your Student ID & registered phone number to track your child's bus in real time.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Student ID *</label>
              <div className="relative">
                <QrCode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-0001"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registered Parent Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="+91 99887 70001"
                  value={parentContactInput}
                  onChange={(e) => setParentContactInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-blue-600/20"
            >
              Sign In to Parent Dashboard
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick Demo Presets:</span>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => { setStudentIdInput('STU-0001'); setParentContactInput('+91 99887 70001'); }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Aditi Iyer (STU-0001)
              </button>
              <button
                type="button"
                onClick={() => { setStudentIdInput('STU-0012'); setParentContactInput('+91 99887 70012'); }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Sai Das (STU-0012)
              </button>
            </div>
          </div>
        </div>

        <ToastContainer />
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED PARENT DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col fade-in">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-600/20">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">School Transport Parent Portal</h1>
            <span className="text-[10px] text-slate-400 font-semibold block leading-tight">Live Student Bus Tracking & Safety Center</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
            <User className="w-4 h-4 text-blue-600" />
            <div className="text-left">
              <span className="text-xs font-bold text-slate-900 block leading-tight">{student.parentName}</span>
              <span className="text-[9px] text-slate-400 font-semibold block leading-tight">Parent of {student.name}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">

        {/* 🚨 Emergency Alert Banner (If bus is in Emergency Breakdown) */}
        {activeEmergency && (
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl">
                <ShieldAlert className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-bold uppercase rounded-full tracking-wider">
                  CRITICAL INCIDENT ALERT
                </span>
                <h3 className="text-base font-bold mt-1">EMERGENCY PROTOCOL ACTIVE: {activeEmergency.type}</h3>
                <p className="text-xs text-red-100 mt-0.5">{activeEmergency.description}</p>
              </div>
            </div>
            
            <a
              href="tel:+919876550000"
              className="px-5 py-2.5 bg-white text-red-700 hover:bg-red-50 rounded-2xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
            >
              <Phone className="w-4 h-4" /> Call School Transport Control
            </a>
          </div>
        )}

        {/* 🔔 Dynamic 5-Minute Proximity Alert Banner */}
        {isNearStop && !activeEmergency && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Live Proximity Alert</span>
                <h4 className="font-bold text-xs">
                  {bus?.busNumber} is ~{proximityDistance} meters away — Approaching {student.pickupStop}!
                </h4>
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-emerald-800 rounded-full text-[10px] font-extrabold uppercase shadow-xs">
              ETA: ~4 mins
            </span>
          </div>
        )}

        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: Child Profile & Boarding Status */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Child Boarding Profile</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  student.boardingStatus === 'boarded' ? 'bg-blue-100 text-blue-800' :
                  student.boardingStatus === 'dropped off' ? 'bg-emerald-100 text-emerald-800' :
                  student.boardingStatus === 'absent' ? 'bg-red-100 text-red-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {student.boardingStatus}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl border-2 border-white shadow-md">
                  {student.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{student.name}</h4>
                  <span className="text-xs text-slate-400 font-semibold block">
                    ID: {student.id} • Class {student.class}-{student.section}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-50">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pickup Stop:</span>
                  <span className="text-slate-900 font-bold truncate max-w-[170px]">{student.pickupStop}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Bus:</span>
                  <span className="text-slate-900 font-bold">{bus?.busNumber || 'BUS 01'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Boarding Time:</span>
                  <span className="text-slate-900 font-bold">{student.boardingTime || 'Not Boarded Yet'}</span>
                </div>
                {student.dropTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Drop-off Time:</span>
                    <span className="text-slate-900 font-bold">{student.dropTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 🔔 1-Tap "Mark Child Absent Today" Button */}
            <button
              onClick={handleMarkAbsent}
              disabled={student.boardingStatus === 'absent'}
              className="w-full py-2.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <UserMinus className="w-4 h-4" /> Mark {student.name.split(' ')[0]} ABSENT Today
            </button>
          </div>

          {/* Card 2: Driver Profile & Eco Safety Rating */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" /> Driver Information
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> Safety Verified
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <img
                  src={driver?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit'}
                  alt={driver?.name}
                  className="w-14 h-14 rounded-full bg-slate-50 border-2 border-white shadow-md"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{driver?.name || 'Amit Sharma'}</h4>
                  <span className="text-xs text-slate-400 font-semibold block">
                    Exp: {driver?.experience || 6} yrs • License: {driver?.licenseNumber || 'DL-10000'}
                  </span>
                </div>
              </div>

              {/* Teltonika Eco Safety Score */}
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Teltonika Eco-Safety Rating</span>
                  <span className="text-xs font-bold text-emerald-900">Green Driving Telemetry Verified</span>
                </div>
                <div className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-extrabold text-sm shadow-xs">
                  {driver?.ecoSafetyScore || 96}/100
                </div>
              </div>
            </div>

            <a
              href={`tel:${driver?.phone || '+919876550000'}`}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-blue-600" /> Call Driver ({driver?.phone || '+91 98765 50000'})
            </a>
          </div>

          {/* Card 3: Bus Fleet Telemetry & GPS */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-blue-600" /> Bus Telemetry & GPS
                </h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase rounded-full">
                  Teltonika FMC920
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bus Registration:</span>
                  <strong className="text-slate-900">{bus?.registrationNumber || 'KA-03-EQ-2001'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model:</span>
                  <strong className="text-slate-900">{bus?.model || 'Ashok Leyland Lynx'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Speed:</span>
                  <strong className="text-slate-900">{bus?.currentSpeed || 33} km/h (Limit: 50 km/h)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Route Expected Arrival:</span>
                  <strong className="text-blue-600">{route?.expectedArrivalTime || '08:30 AM'}</strong>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" /> GPS Signal
              </span>
              <span className="text-emerald-600 font-bold uppercase text-[10px] px-2 py-0.5 bg-emerald-100 rounded-full">
                Connected (Live)
              </span>
            </div>
          </div>

        </div>

        {/* Live Interactive Map Section */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Live Bus Location Map</h3>
              <p className="text-xs text-slate-400 font-semibold">Real-time GPS coordinates of {bus?.busNumber || 'BUS 01'} on {route?.routeNumber || 'Route 1'}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Simulation Active
            </span>
          </div>

          <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
            <LiveMap />
          </div>
        </div>

      </main>

      <ToastContainer />
    </div>
  );
}

export default function ParentDashboard() {
  return (
    <AppProvider>
      <ParentDashboardContent />
    </AppProvider>
  );
}
