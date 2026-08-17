"use client";

import React, { useState, useEffect } from 'react';
import { useApp, Student } from '@/context/AppContext';
import { X, Edit, Trash2 } from 'lucide-react';

interface EditStudentModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, student, onClose }) => {
  const { routes, vehicles, editStudent, deleteStudent, addToast } = useApp();

  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('5');
  const [section, setSection] = useState('A');
  const [routeId, setRouteId] = useState('');
  const [busId, setBusId] = useState('');
  const [pickupStop, setPickupStop] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  useEffect(() => {
    if (student) {
      setName(student.name);
      setStudentClass(student.class);
      setSection(student.section);
      setRouteId(student.routeId);
      setBusId(student.busId);
      setPickupStop(student.pickupStop);
      setParentName(student.parentName);
      setParentContact(student.parentContact);
      setEmergencyContact(student.emergencyContact);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    editStudent({
      ...student,
      name,
      class: studentClass,
      section,
      routeId,
      busId,
      pickupStop,
      parentName,
      parentContact,
      emergencyContact
    });

    addToast(`Student record for ${name} updated.`, 'success');
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove student record for "${student.name}"?`)) {
      deleteStudent(student.id);
      addToast(`Student ${student.name} deleted.`, 'warning');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 fade-in text-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-100 text-amber-700 p-2 rounded-xl">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Student Record</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Update details for {student.name} ({student.id})</p>
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
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>{r.routeNumber} - {r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Assigned Bus</label>
              <select
                value={busId}
                onChange={(e) => setBusId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.busNumber} ({v.registrationNumber})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Pickup Stop Name</label>
            <input
              type="text"
              value={pickupStop}
              onChange={(e) => setPickupStop(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parent / Guardian Contacts</h4>
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Parent Name</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Mobile Contact</label>
                <input
                  type="text"
                  value={parentContact}
                  onChange={(e) => setParentContact(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none text-slate-800 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all text-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition-all text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-md shadow-blue-600/10"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
