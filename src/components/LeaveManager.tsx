// src/components/LeaveManager.tsx
import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

type Member = { id: string; name: string; };
export type Leave = { id: string; start_date: string; end_date: string; leave_type: string; note: string | null; team_members: { name: string; } | null; };

const LeaveManager = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [leavesResponse, membersResponse] = await Promise.all([
        supabase.from('leaves').select('*, team_members(name)').order('start_date', { ascending: false }),
        supabase.from('team_members').select('id, name').order('name', { ascending: true })
      ]);
      if (leavesResponse.error) console.error('Error fetching leaves:', leavesResponse.error); else setLeaves(leavesResponse.data);
      if (membersResponse.error) console.error('Error fetching team members:', membersResponse.error); else setTeamMembers(membersResponse.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddLeave = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !startDate || !endDate || !leaveType) { alert('Please fill out all required fields.'); return; }
    setIsSubmitting(true);
    const { data, error } = await supabase.from('leaves').insert({ member_id: selectedMemberId, start_date: startDate, end_date: endDate, leave_type: leaveType, note: note }).select().single();
    if (error) { console.error('Error adding leave:', error); alert('Failed to add leave.'); }
    else if (data) {
      const member = teamMembers.find(m => m.id === data.member_id);
      const newLeaveEntry: Leave = { ...data, team_members: member ? { name: member.name } : null };
      setLeaves(currentLeaves => [newLeaveEntry, ...currentLeaves]);
      setSelectedMemberId(''); setStartDate(''); setEndDate(''); setLeaveType('Annual Leave'); setNote('');
    }
    setIsSubmitting(false);
  };

  const handleDeleteLeave = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave entry?')) {
      const { error } = await supabase.from('leaves').delete().eq('id', id);
      if (error) { console.error('Error deleting leave:', error); alert('Failed to delete leave.'); }
      else { setLeaves(currentLeaves => currentLeaves.filter(leave => leave.id !== id)); }
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="admin-module">
      <h4>Manage Team Leaves</h4>
      <ul className="data-list">
        {leaves.length > 0 ? (
          leaves.map((leave) => (
            <li key={leave.id} className="data-item">
              <div className="data-item-info">
                <span><strong>{leave.team_members?.name || 'Unknown'}</strong> - {leave.leave_type}</span>
                <small>From: {leave.start_date} To: {leave.end_date}</small>
                {leave.note && <em style={{fontSize: '0.9em', color: '#555', marginTop: '4px'}}>Note: {leave.note}</em>}
              </div>
              <button onClick={() => handleDeleteLeave(leave.id)} className="btn btn-delete">&times;</button>
            </li>
          ))
        ) : ( <p>No leaves found.</p> )}
      </ul>
      <form onSubmit={handleAddLeave} className="data-form">
        <h4>Add a New Leave</h4>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="member">Team Member</label>
            <select id="member" value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} required>
              <option value="" disabled>Select a member</option>
              {teamMembers.map(member => (<option key={member.id} value={member.id}>{member.name}</option>))}
            </select>
          </div>
          <div className="form-field"><label htmlFor="startDate">Start Date</label><input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
          <div className="form-field"><label htmlFor="endDate">End Date</label><input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></div>
          <div className="form-field"><label htmlFor="leaveType">Leave Type</label><input id="leaveType" type="text" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} required /></div>
          <div className="form-field" style={{gridColumn: 'span 2'}}><label htmlFor="note">Note (Optional)</label><textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <button type="submit" disabled={isSubmitting} className="btn btn-submit">{isSubmitting ? 'Adding...' : 'Add Leave'}</button>
      </form>
    </div>
  );
};
export default LeaveManager;