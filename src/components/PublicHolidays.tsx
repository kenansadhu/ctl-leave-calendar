// src/components/PublicHolidays.tsx
import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

export type Holiday = { id: string; name: string; date: string; };

const PublicHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('public_holidays').select('*').order('date', { ascending: true });
      if (error) console.error('Error fetching public holidays:', error); else setHolidays(data);
      setLoading(false);
    };
    fetchHolidays();
  }, []);

  const handleAddHoliday = async (e: FormEvent) => {
    e.preventDefault(); if (!newName.trim() || !newDate) { alert('Please provide both a name and a date.'); return; }
    setIsSubmitting(true);
    const { data, error } = await supabase.from('public_holidays').insert({ name: newName, date: newDate }).select().single();
    if (error) { console.error('Error adding holiday:', error); alert('Failed to add holiday.'); }
    else if (data) {
      setHolidays(currentHolidays => [...currentHolidays, data].sort((a, b) => a.date.localeCompare(b.date)));
      setNewName(''); setNewDate('');
    }
    setIsSubmitting(false);
  };

  const handleDeleteHoliday = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      const { error } = await supabase.from('public_holidays').delete().eq('id', id);
      if (error) { console.error('Error deleting holiday:', error); alert('Failed to delete holiday.'); }
      else { setHolidays(currentHolidays => currentHolidays.filter(holiday => holiday.id !== id)); }
    }
  };

  if (loading) return null;

  return (
    <div className="admin-module">
      <h4>Public Holidays</h4>
      <ul className="data-list">
        {holidays.map((holiday) => (
          <li key={holiday.id} className="data-item">
            <span><strong>{holiday.name}</strong> - {holiday.date}</span>
            <button onClick={() => handleDeleteHoliday(holiday.id)} className="btn btn-delete">&times;</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddHoliday} className="data-form">
        <h4>Add a New Holiday</h4>
        <div className="form-grid">
          <div className="form-field"><label htmlFor="holidayName">Name</label><input id="holidayName" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={isSubmitting} required /></div>
          <div className="form-field"><label htmlFor="holidayDate">Date</label><input id="holidayDate" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} disabled={isSubmitting} required /></div>
        </div>
        <button type="submit" disabled={isSubmitting} className="btn btn-submit">{isSubmitting ? 'Adding...' : 'Add Holiday'}</button>
      </form>
    </div>
  );
};
export default PublicHolidays;