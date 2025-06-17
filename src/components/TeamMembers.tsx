// src/components/TeamMembers.tsx
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

export type Member = { id: string; created_at: string; name: string; role: string | null; };

const TeamMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('team_members').select('*').order('created_at', { ascending: true });
      if (error) console.error('Error fetching team members:', error); else setMembers(data);
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault(); if (!newName.trim()) { alert('Please enter a name.'); return; }
    setIsSubmitting(true);
    const { data, error } = await supabase.from('team_members').insert({ name: newName, role: newRole }).select().single();
    if (error) { console.error('Error adding member:', error); alert('Failed to add member.'); }
    else if (data) { setMembers(currentMembers => [...currentMembers, data]); setNewName(''); setNewRole(''); }
    setIsSubmitting(false);
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) { console.error('Error deleting member:', error); alert('Failed to delete member.'); }
      else { setMembers(currentMembers => currentMembers.filter(member => member.id !== id)); }
    }
  };

  if (loading) return null;

  return (
    <div className="admin-module">
      <h4>Team Members</h4>
      <ul className="data-list">
        {members.map((member) => (
          <li key={member.id} className="data-item">
            <span><strong>{member.name}</strong> - {member.role || 'No role'}</span>
            <button onClick={() => handleDeleteMember(member.id)} className="btn btn-delete">&times;</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddMember} className="data-form">
        <h4>Add a New Member</h4>
        <div className="form-grid">
          <div className="form-field"><label htmlFor="name">Name</label><input id="name" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} disabled={isSubmitting} required /></div>
          <div className="form-field"><label htmlFor="role">Role</label><input id="role" type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} disabled={isSubmitting} /></div>
        </div>
        <button type="submit" disabled={isSubmitting} className="btn btn-submit">{isSubmitting ? 'Adding...' : 'Add Member'}</button>
      </form>
    </div>
  );
};
export default TeamMembers;