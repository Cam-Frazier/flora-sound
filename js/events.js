(() => {
  const calendarId = 'c_c1586bd210f3ecb74b3f3c340a42b40d46270561d4a1c0fe7ade27b0d0c79a19@group.calendar.google.com';
  const apiKey = 'AIzaSyDZNvD7AEElm1ikJZyKXAyZFI2Y-Oy2lvo';
  const timezone = 'America/Vancouver';
  const eventList = document.getElementById('events-list');
  const status = document.getElementById('events-status');

  if (!eventList || !status) return;

  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  })[char]);

  const getStartDate = event => new Date(event.start.dateTime || `${event.start.date}T00:00:00`);
  const getEndDate = event => new Date(event.end.dateTime || `${event.end.date}T00:00:00`);
  const isAllDay = event => Boolean(event.start.date);

  function getTicketUrl(description = '') {
    const labelled = description.match(/(?:tickets?|ticket link)\s*:\s*(https?:\/\/[^\s<]+)/i);
    if (labelled) return labelled[1].replace(/[),.;]+$/, '');
    const firstUrl = description.match(/https?:\/\/[^\s<]+/i);
    return firstUrl ? firstUrl[0].replace(/[),.;]+$/, '') : '';
  }

  function dateParts(event) {
    const start = getStartDate(event);
    return {
      month: new Intl.DateTimeFormat('en-CA', { month: 'short', timeZone: timezone }).format(start),
      day: new Intl.DateTimeFormat('en-CA', { day: '2-digit', timeZone: timezone }).format(start),
      weekday: new Intl.DateTimeFormat('en-CA', { weekday: 'long', timeZone: timezone }).format(start)
    };
  }

  function formatSchedule(event) {
    const start = getStartDate(event);
    const end = getEndDate(event);
    const date = new Intl.DateTimeFormat('en-CA', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: timezone
    }).format(start);

    if (isAllDay(event)) return date;

    const timeFormat = new Intl.DateTimeFormat('en-CA', {
      hour: 'numeric', minute: '2-digit', timeZone: timezone
    });
    return `${date} · ${timeFormat.format(start)}–${timeFormat.format(end)}`;
  }

  function eventCard(event) {
    const parts = dateParts(event);
    const ticketUrl = getTicketUrl(event.description);
    const location = event.location ? `<p class="event-location">${escapeHtml(event.location)}</p>` : '';
    const description = event.description
      ? `<p class="event-description">${escapeHtml(event.description.replace(/https?:\/\/\S+/g, '').replace(/(?:tickets?|ticket link)\s*:\s*/ig, '').trim())}</p>`
      : '';
    const ticketButton = ticketUrl
      ? `<a class="btn event-ticket" href="${escapeHtml(ticketUrl)}" target="_blank" rel="noopener">Get Tickets</a>`
      : '';
    const detailsButton = event.htmlLink
      ? `<a class="text-link event-details" href="${escapeHtml(event.htmlLink)}" target="_blank" rel="noopener">Event Details</a>`
      : '';

    return `
      <article class="event-card">
        <div class="event-date" aria-hidden="true">
          <span>${escapeHtml(parts.month)}</span>
          <strong>${escapeHtml(parts.day)}</strong>
        </div>
        <div class="event-content">
          <p class="event-schedule">${escapeHtml(formatSchedule(event))}</p>
          <h3>${escapeHtml(event.summary || 'Flora Sound System Event')}</h3>
          ${location}
          ${description}
          <div class="event-actions">${ticketButton}${detailsButton}</div>
        </div>
      </article>`;
  }

  async function loadEvents() {
    const params = new URLSearchParams({
      key: apiKey,
      timeMin: new Date().toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '12',
      timeZone: timezone
    });

    const endpoint = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`Calendar request failed (${response.status})`);
      const data = await response.json();
      const events = (data.items || []).filter(event => event.status !== 'cancelled');

      if (!events.length) {
        status.textContent = 'New gatherings are taking root. Check back soon for upcoming dates.';
        status.classList.add('is-empty');
        return;
      }

      status.hidden = true;
      eventList.innerHTML = events.map(eventCard).join('');
    } catch (error) {
      console.error(error);
      status.textContent = 'The events calendar could not be loaded right now. Please use “View Full Calendar” below.';
      status.classList.add('is-error');
    }
  }

  loadEvents();
})();
