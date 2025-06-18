import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { Event as RbcEvent, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CustomCalendarEvent extends RbcEvent {
  resource?: {
    type: 'leave' | 'holiday';
    leave_type?: string;
    note?: string | null;
    role?: string | null;
  };
}

const CustomToolbar = (toolbar: ToolbarProps<CustomCalendarEvent>) => {
  const goToBack = () => { toolbar.onNavigate('PREV'); };
  const goToNext = () => { toolbar.onNavigate('NEXT'); };
  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group"><button type="button" onClick={goToBack}>&lt; Back</button></span>
      <span className="rbc-toolbar-label">{toolbar.label}</span>
      <span className="rbc-btn-group"><button type="button" onClick={goToNext}>Next &gt;</button></span>
    </div>
  );
};

const Home = () => {
  const [events, setEvents] = useState<CustomCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CustomCalendarEvent | null>(null);

  useEffect(() => {
    const fetchAndFormatData = async () => {
      setLoading(true);
      const [leavesResponse, holidaysResponse] = await Promise.all([
        supabase.from('leaves').select('*, team_members(name, role)'),
        supabase.from('public_holidays').select('*')
      ]);

      if (leavesResponse.error || holidaysResponse.error) {
        console.error('Error fetching data:', leavesResponse.error || holidaysResponse.error); setLoading(false); return;
      }

      const formattedLeaves: CustomCalendarEvent[] = leavesResponse.data.map(leave => ({
        title: leave.team_members?.name || 'Unknown',
        start: new Date(leave.start_date),
        end: new Date(leave.end_date),
        allDay: true,
        resource: { type: 'leave', leave_type: leave.leave_type, note: leave.note, role: leave.team_members?.role }
      }));

      const formattedHolidays: CustomCalendarEvent[] = holidaysResponse.data.map(holiday => ({
        title: holiday.name,
        start: new Date(holiday.date),
        end: new Date(holiday.date),
        allDay: true,
        resource: { type: 'holiday' }
      }));

      setEvents([...formattedLeaves, ...formattedHolidays]);
      setLoading(false);
    };
    fetchAndFormatData();
  }, []);

  // UPDATED: This function now opens the modal for ANY event click
  const handleSelectEvent = (event: CustomCalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const eventStyleGetter = (event: CustomCalendarEvent) => {
    let backgroundColor = '#3174ad';
    if (event.resource?.type === 'leave') { backgroundColor = '#f5a623'; }
    else if (event.resource?.type === 'holiday') { backgroundColor = '#E53E3E'; }
    const style = { backgroundColor, borderRadius: '5px', opacity: 0.9, color: 'white', border: '0px', display: 'block' };
    return { style: style };
  };

  if (loading) return <p>Loading calendar...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '1rem' }}>

      <style type="text/css">{`
        .rbc-toolbar { margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
        .rbc-toolbar-label { font-size: 1.5em; font-weight: bold; }
        .rbc-toolbar button { cursor: pointer; background: #f7f7f7; border: 1px solid #ccc; padding: 8px 16px; border-radius: 4px; }
        .rbc-toolbar button:hover { background: #e6e6e6; }
        .rbc-header { background: #f7f7f7; padding: 10px 3px; border-bottom: 1px solid #ddd; font-weight: bold; text-align: right; padding-right: 10px;}
        .rbc-month-view { border: 1px solid #ddd; border-radius: 6px; }
        .rbc-off-range-bg { background: #f9f9f9; }
        .rbc-today { background-color: #eaf6ff; }
        .rbc-month-row { min-height: 120px; }
        .rbc-event { padding: 1px 5px; font-size: 0.8em; cursor: pointer; }
        .rbc-date-cell { text-align: right; padding-right: 10px; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; padding: 2rem; border-radius: 8px; max-width: 500px; width: 90%; position: relative; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .modal-close-btn { position: absolute; top: 10px; right: 15px; border: none; background: transparent; font-size: 1.5rem; cursor: pointer; }
        .modal-content h3 { margin-top: 0; }
        .modal-content p { margin: 0.5rem 0; }
        .modal-content strong { color: #333; }
      `}</style>

      <div style={{ textAlign: 'center' }}>
        <h1>CTL Leave Calendar</h1>
      </div>

      <div style={{ flex: 1, minHeight: '500px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          onSelectEvent={handleSelectEvent}
          views={['month']}
          view='month'
          onView={() => {}}
          components={{ toolbar: CustomToolbar }}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '1rem' }}>
        <Link to="/admin" style={{textDecoration:'none', padding: '10px 20px', backgroundColor: '#333', color: 'white', borderRadius: '5px', fontWeight: 'bold'}}>
          Go to Admin Dashboard
        </Link>
      </div>

      {/* UPDATED: The modal now checks what kind of event was clicked */}
      {isModalOpen && selectedEvent && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>

            {/* If it's a leave, show leave details */}
            {selectedEvent.resource?.type === 'leave' && (
              <>
                <h3>Leave Details</h3>
                <p><strong>Name:</strong> {selectedEvent.title}</p>
                <p><strong>Role:</strong> {selectedEvent.resource?.role || 'N/A'}</p>
                <p><strong>Type:</strong> {selectedEvent.resource?.leave_type}</p>
                <p><strong>Dates:</strong> {format(selectedEvent.start as Date, 'PPP')} to {format(selectedEvent.end as Date, 'PPP')}</p>
                {selectedEvent.resource?.note && (
                  <><hr/><p><strong>Note:</strong> {selectedEvent.resource.note}</p></>
                )}
              </>
            )}

            {/* If it's a holiday, show holiday details */}
            {selectedEvent.resource?.type === 'holiday' && (
               <>
                <h3>Public Holiday</h3>
                <p><strong>{selectedEvent.title}</strong></p>
                <p><strong>Date:</strong> {format(selectedEvent.start as Date, 'PPP')}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;