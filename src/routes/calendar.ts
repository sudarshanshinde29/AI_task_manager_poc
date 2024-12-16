import { Hono } from 'hono';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getAvailableSlots,
} from '../services/calendar-service';

const calendar = new Hono<{ Bindings: CloudflareBindings }>();

// Create an event
calendar.post('/events', async (c) => {
  const env = c.env;
  const body = await c.req.json();
  const calendarId = body.calendarId;
  const eventDetails = body.eventDetails;

  try {
    const event = await createEvent(env, calendarId, eventDetails);
    return c.json({ message: 'Event created successfully', event });
  } catch (error : any) {
    return c.json({ error: error.message }, 500);
  }
});

// Update an event
calendar.put('/events/:id', async (c) => {
  const env = c.env;
  const calendarId = c.req.query('calendarId');
    if (!calendarId) {
    return c.json({ error: 'Missing required query parameter: calendarId' }, 400);
    }
  const eventId = c.req.param('id');
  const updatedDetails = await c.req.json();

  try {
    const event = await updateEvent(env, calendarId, eventId, updatedDetails);
    return c.json({ message: 'Event updated successfully', event });
  } catch (error : any) {
    return c.json({ error: error.message }, 500);
  }
});

// Delete an event
calendar.delete('/events/:id', async (c) => {
  const env = c.env;
  const calendarId = c.req.query('calendarId');
if (!calendarId) {
  return c.json({ error: 'Missing required query parameter: calendarId' }, 400);
}
  const eventId = c.req.param('id');

  try {
    await deleteEvent(env, calendarId, eventId);
    return c.json({ message: 'Event deleted successfully' });
  } catch (error : any) {
    return c.json({ error: error.message }, 500);
  }
});

// Retrieve events within a time range
calendar.get('/events', async (c) => {
  const env = c.env;
  const calendarId = c.req.query('calendarId');
if (!calendarId) {
  return c.json({ error: 'Missing required query parameter: calendarId' }, 400);
}
  const timeMin = c.req.query('timeMin');
if (!timeMin) {
  return c.json({ error: 'Missing required query parameter: timeMin' }, 400);
}
  const timeMax = c.req.query('timeMax');
if (!timeMax) {
  return c.json({ error: 'Missing required query parameter: timeMax' }, 400);
}

  try {
    const events = await getEvents(env, calendarId, timeMin, timeMax);
    return c.json({ events });
  } catch (error : any) {
    return c.json({ error: error.message }, 500);
  }
});

// Check available slots
calendar.get('/availability', async (c) => {
  const env = c.env;
  const calendarId = c.req.query('calendarId');
if (!calendarId) {
  return c.json({ error: 'Missing required query parameter: calendarId' }, 400);
}
  const timeMin = c.req.query('timeMin');
if (!timeMin) {
  return c.json({ error: 'Missing required query parameter: timeMin' }, 400);
}
  const timeMax = c.req.query('timeMax');
if (!timeMax) {
  return c.json({ error: 'Missing required query parameter: timeMax' }, 400);
}

  try {
    const freeSlots = await getAvailableSlots(env, calendarId, timeMin, timeMax);
    return c.json({ freeSlots });
  } catch (error : any) {
    return c.json({ error: error.message }, 500);
  }
});

export default calendar;
