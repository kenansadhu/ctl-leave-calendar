import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { Event as RbcEvent, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CustomCalendarEvent extends RbcEvent {
  resource?: { type: 'leave' | 'holiday' };
}

const CustomToolbar = (toolbar: ToolbarProps<CustomCalendarEvent>) => {
  const goToBack = () => { toolbar.onNavigate('PREV'); };
  const goToNext = () => { toolbar.onNavigate('NEXT'); };

  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={goToBack}>&lt; Back</button>
      </span>
      <span className="rbc-toolbar-label">{toolbar.label}</span>
      <span className="rbc-btn-group">
        <button type="button" onClick={goToNext}>Next &gt;</button>
      </span>
    </div>
  );
};

const Home = () => {
  const [events, setEvents] = useState<CustomCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const fetchAndFormatData = async () => {
      setLoading(true);
      const [leavesResponse, holidaysResponse] = await Promise.all([
        supabase.from('leaves').select('*, team_members(name)'),
        supabase.from('public_holidays').select('*')
      ]);

      if (leavesResponse.error || holidaysResponse.error) {
        console.error('Error fetching data:', leavesResponse.error || holidaysResponse.error); setLoading(false); return;
      }

      const formattedLeaves: CustomCalendarEvent[] = leavesResponse.data.map(leave => ({
        title: leave.team_members?.name || 'Unknown', start: new Date(leave.start_date),
        end: addDays(new Date(leave.end_date), 1), resource: { type: 'leave' }
      }));

      const formattedHolidays: CustomCalendarEvent[] = holidaysResponse.data.map(holiday => ({
        title: holiday.name, start: new Date(holiday.date),
        end: new Date(holiday.date), allDay: true, resource: { type: 'holiday' }
      }));

      setEvents([...formattedLeaves, ...formattedHolidays]);
      setLoading(false);
    };
    fetchAndFormatData();
  }, []);

  const eventStyleGetter = (event: CustomCalendarEvent) => {
    let backgroundColor = '#3174ad';
    if (event.resource?.type === 'leave') { backgroundColor = '#f5a623'; }
    else if (event.resource?.type === 'holiday') { backgroundColor = '#E53E3E'; }
    const style = { backgroundColor, borderRadius: '5px', opacity: 0.9, color: 'white', border: '0px', display: 'block' };
    return { style: style };
  };

  if (loading) {
    return <p>Loading calendar...</p>;
  }

  return (
    <div style={{ padding: '1rem 2rem' }}>
      {/* This style block contains all the "prettier" enhancements */}
      <style type="text/css">{`
        .rbc-toolbar { margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
        .rbc-toolbar-label { font-size: 1.5em; font-weight: bold; }
        .rbc-toolbar button { cursor: pointer; background: #f7f7f7; border: 1px solid #ccc; padding: 8px 16px; border-radius: 4px; }
        .rbc-toolbar button:hover { background: #e6e6e6; }
        .rbc-header { background: #f7f7f7; padding: 10px 3px; border-bottom: 1px solid #ddd; font-weight: bold; }
        .rbc-month-view { border: 1px solid #ddd; border-radius: 6px; }
        .rbc-off-range-bg { background: #f9f9f9; }
        .rbc-today { background-color: #eaf6ff; }
      `}</style>

      <div style={{ textAlign: 'center' }}>
        <h1>CTL Leave Calendar</h1>
      </div>

      <div style={{ height: '80vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          views={['month']}
          view='month'
          onView={() => {}}
          components={{
            toolbar: CustomToolbar
          }}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/admin" style={{textDecoration:'none', padding: '10px 20px', backgroundColor: '#333', color: 'white', borderRadius: '5px', fontWeight: 'bold'}}>
          Go to Admin Dashboard
        </Link>
      </div>

    </div>
  );
};

export default Home;