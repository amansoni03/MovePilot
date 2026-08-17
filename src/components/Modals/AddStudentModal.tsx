"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, UserPlus, Users, MapPin, Phone, Shield } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose }) => {
  const { routes, vehicles, addStudent, addToast } = useApp();

  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('5');
  const [section, setSection] = useState('A');
  const [routeId, setRouteId] = useState('');
  const [pickupStop, setPickupStop] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  if (!isOpen) return null;

  const selectedRoute = routes.find(r => r.id === routeId);
  const assignedBusId = selectedRoute?.busId || (vehicles.length > 0 ? vehicles[0].id : 'BUS-001');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast('Please enter the student\'s name.', 'error');
      return;
    }

    addStudent({
      name,
      class: studentClass,
      section,
      routeId: routeId || (routes.length > 0 ? routes[0].id : 'RT-001'),
      busId: assignedBusId,
      pickupStop: pickupStop || (selectedRoute?.stops[0]?.name || 'School Main Gate'),
      parentName: parentName || `Parent of ${name}`,
      parentContact: parentContact || '+91 99887 70000',
      emergencyContact: emergencyContact || '+91 91111 10000'
    });

    addToast(`Student ${name} successfully enrolled!`, 'success');
    onClose();
    setName('');
    setParentName('');
    setParentContact('');
    setEmergencyContact('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 fade-in text-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-100 text-blue-700 p-2 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Enroll New Student</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Add student details, assigned bus route, and parent contacts</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Student Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ananya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Class *</label>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i+1} value={`${i+1}`}>Grade / Class {i+1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Section *</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Assigned Route</label>
              <select
                value={routeId}
                onChange={(e) => {
                  setRouteId(e.target.value);
                  const r = routes.find(rt => rt.id === e.target.value);
                  if (r && r.stops.length > 0) setPickupStop(r.stops[0].name);
                }}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              >
                <option value="">-- Select Route --</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.routeNumber} - {r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Pickup Stop Name</label>
              <input
                type="text"
                placeholder="e.g. Koramangala 5th Block"
                value={pickupStop}
                onChange={(e) => setPickupStop(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent / Guardian Contacts</h4>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Parent / Guardian Name</label>
              <input
                type="text"
                placeholder="e.g. Mr. & Mrs. Sharma"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Mobile Contact *</label>
                <input
                  type="text"
                  placeholder="+91 99887 70001"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Emergency Phone</label>
                <input
                  type="text"
                  placeholder="+91 91111 10001"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-md shadow-blue-600/10"
            >
              Enroll Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
