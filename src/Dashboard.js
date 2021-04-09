import { useState } from "react"
import { isDOMComponentElement } from "react-dom/test-utils";
import { Link } from "react-router-dom";
import { eventsByCategory } from "./services";

function dateStr(d) {
  let date = new Date(d);
  return date.toLocaleString();
  // let day = date.getDate();
  // let month = date.getMonth();
  // let year = date.getFullYear() % 100;
  // let hr = date.getHours();
  // let mins = date.getMinutes();
}

function consolidateEvents(eventsByCategory) {
  let events = [];
  for (const category of eventsByCategory) {
    events = events.concat(category.events);
  }
  events.sort((e) => e.name);
  return events;
}

function sortEventsBySlug(events) {
  let eventsBySlug = {};
  for (const event of events) {
    eventsBySlug[event.slug] = event;
  }
  return eventsBySlug;
}

function sortEventsBySub(events) {
  let nonSubmissionEvents = events.filter((e) => !e.isSubmissionEvent);
  let submissionEvents = events.filter((e) => e.isSubmissionEvent);
  let now = new Date();
  let submissionClosedEvents = submissionEvents.filter((e) => now > new Date(e.submissionEndDate));
  let submissionOpenEvents = submissionEvents.filter((e) => new Date(e.submissionStartDate) < now && now < new Date(e.submissionEndDate));
  let submissionToOpenEvents = submissionEvents.filter((e) => now < new Date(e.submissionStartDate));

  return { "noSubs": nonSubmissionEvents, "toOpen": submissionToOpenEvents, "open": submissionOpenEvents, "closed": submissionClosedEvents };

}

export function Dashboard({ setLogout }) {
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventsBySub, setEventsBySub] = useState([]);
  const [eventsBySlug, setEventsBySlug] = useState([]);

  eventsByCategory().then((categories) => {
    const events = consolidateEvents(categories);
    console.log(events);
    const _eventsBySlug = sortEventsBySlug(events);
    const _eventsBySub = sortEventsBySub(events);
    setEventsBySlug(_eventsBySlug);
    setEventsBySub(_eventsBySub);
    setEventsLoaded(true);
  });

  return <div style={{ display: "flex", flexDirection: "column" }}>
    <button onClick={setLogout}>Logout</button>
    {!eventsLoaded ?
      <div>Loading .. </div> :
      <EventsList eventsBySub={eventsBySub} eventsBySlug={eventsBySlug} />}
  </div>
}

export function EventsList({ eventsBySub, eventsBySlug }) {
  const eventEntry = ({ name, slug, submissionStartDate, submissionEndDate }) =>
    <div className="event-link">
      <Link to={slug}>
        {name}
      </Link>
      <div className="event-link-sub-details">
        <div><div className="-label">Sub Open:</div> {dateStr(submissionStartDate)}</div>
        <div><div className="-label">Sub Close:</div> {dateStr(submissionEndDate)}</div>
      </div>
    </div>;
  const eventEntryNoSubs = ({ name, slug }) =>
    <div className="event-link">
      <Link to={slug}>
        {name}
      </Link>
    </div>;

  return <div className="event-categories">
    <details>
      <summary>Submission Closed ({eventsBySub.closed.length}) </summary>
      <div className="event-list">
        {eventsBySub.closed.map(eventEntry)}
      </div>
    </details>
    <details>
      <summary>Submission Open ({eventsBySub.open.length}) </summary>
      <div>
        {eventsBySub.open.map(eventEntry)}
      </div>
    </details>
    <details>
      <summary>Submission To Be Opened ({eventsBySub.toOpen.length}) </summary>
      <div>
        {eventsBySub.toOpen.map(eventEntry)}
      </div>
    </details>
    <details>
      <summary>No Submissions ({eventsBySub.noSubs.length}) </summary>
      <div>
        {eventsBySub.noSubs.map(eventEntryNoSubs)}
      </div>
    </details>
  </div >
}