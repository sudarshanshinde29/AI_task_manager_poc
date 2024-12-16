import { getAccessToken } from '../config/google-oauth';
import { EventDetails } from '../types';
const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

// Utility function to handle API requests
async function googleCalendarRequest(
  env: CloudflareBindings,
  method: string,
  endpoint: string,
  body: Record<string, any> | null = null
): Promise<any> {
  const accessToken = await getAccessToken(env);

  const response = await fetch(`${GOOGLE_CALENDAR_API_URL}/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Calendar API Error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// 1. Create an Event
export async function createEvent(
  env: CloudflareBindings,
  calendarId: string,
  eventDetails: EventDetails,
): Promise<any> {
  try {
    return await googleCalendarRequest(env, 'POST', `calendars/${calendarId}/events`, eventDetails);
  } catch (error:any) {
    throw new Error(`Failed to create event: ${error.message}`);
  }
}

// 2. Update an Event
export async function updateEvent(
  env: CloudflareBindings,
  calendarId: string,
  eventId: string,
  updatedDetails: Record<string, any>
): Promise<any> {
  try {
    return await googleCalendarRequest(env, 'PUT', `calendars/${calendarId}/events/${eventId}`, updatedDetails);
  } catch (error:any) {
    throw new Error(`Failed to update event: ${error.message}`);
  }
}

// 3. Delete an Event
export async function deleteEvent(
  env: CloudflareBindings,
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    await googleCalendarRequest(env, 'DELETE', `calendars/${calendarId}/events/${eventId}`);
  } catch (error:any) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }
}

// 4. Retrieve Events
export async function getEvents(
    env: CloudflareBindings,
    calendarId: string,
    timeMin: string,
    timeMax: string
  ): Promise<any[]> {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true', // Ensures recurring events are split into individual instances
      orderBy: 'startTime',
    });
  
    // Make the API request
    const response = await googleCalendarRequest(env, 'GET', `calendars/${calendarId}/events?${params}`);
  
    // Log the response for debugging
    console.log('API Response:', JSON.stringify(response, null, 2));
  
    // Safely extract the items array
    if (!response || !response.items || !Array.isArray(response.items)) {
      throw new Error('Invalid response: Missing or malformed items array');
    }
  
    return response.items; // Return only the items array
  }
  
  

// 5. Check Available Slots
export async function getAvailableSlots(
  env: CloudflareBindings,
    calendarId: string,
    timeMin: string,
    timeMax: string
  ): Promise<{ start: string; end: string }[]> {
    try {
      const events = await getEvents(env, calendarId, timeMin, timeMax);
  
      // Extract and sort busy slots
      const busySlots = events
        .map((event: any) => ({
          start: new Date(event.start.dateTime).getTime(),
          end: new Date(event.end.dateTime).getTime(),
        }))
        .sort((a, b) => a.start - b.start);
  
      const freeSlots: { start: string; end: string }[] = [];
  
      // Convert timeMin and timeMax to timestamps
      const timeMinMs = new Date(timeMin).getTime();
      const timeMaxMs = new Date(timeMax).getTime();
  
      // 1. Add free slot before the first busy slot
      if (busySlots.length === 0 || timeMinMs < busySlots[0].start) {
        freeSlots.push({
          start: new Date(timeMinMs).toISOString(),
          end: new Date(busySlots.length > 0 ? busySlots[0].start : timeMaxMs).toISOString(),
        });
      }
  
      // 2. Add free slots between busy slots
      for (let i = 0; i < busySlots.length - 1; i++) {
        if (busySlots[i].end < busySlots[i + 1].start) {
          freeSlots.push({
            start: new Date(busySlots[i].end).toISOString(),
            end: new Date(busySlots[i + 1].start).toISOString(),
          });
        }
      }
  
      // 3. Add free slot after the last busy slot
      if (busySlots.length === 0 || busySlots[busySlots.length - 1].end < timeMaxMs) {
        freeSlots.push({
          start: new Date(busySlots.length > 0 ? busySlots[busySlots.length - 1].end : timeMinMs).toISOString(),
          end: new Date(timeMaxMs).toISOString(),
        });
      }
  
      return freeSlots;
    } catch (error: any) {
      throw new Error(`Failed to check available slots: ${error.message}`);
    }
  }
  
