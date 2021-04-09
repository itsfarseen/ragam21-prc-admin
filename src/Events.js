import { useEffect, useState } from "react"
import { Link, Route, Switch, useParams } from "react-router-dom";
import { eventDetails, eventsByCategory } from "./services";

function dateStr(d) {
  let date = new Date(d);
  return date.toLocaleString();
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

export function Events({ jwt }) {
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventsBySub, setEventsBySub] = useState([]);
  const [eventsBySlug, setEventsBySlug] = useState([]);

  useEffect(() => {
    eventsByCategory().then((categories) => {
      const events = consolidateEvents(categories);
      const _eventsBySlug = sortEventsBySlug(events);
      const _eventsBySub = sortEventsBySub(events);
      setEventsBySlug(_eventsBySlug);
      setEventsBySub(_eventsBySub);
      setEventsLoaded(true);
    });
  }, []);


  if (!eventsLoaded) {
    return <div className="pad1">Loading events .. </div>
  } else {
    return <Switch>
      <Route exact path="/events"><EventsList eventsBySub={eventsBySub} /></Route>
      <Route path="/events/:slug"><Event jwt={jwt} eventsBySlug={eventsBySlug} /></Route>
    </Switch>
  }
}

export function EventsList({ eventsBySub }) {
  const eventEntry = ({ name, slug, submissionStartDate, submissionEndDate }) =>
    <div className="event-link">
      <Link to={"/events/" + slug}>
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

function consolidateRegs(regs) {
  let cas = {};
  for (const reg of regs) {
    if (reg.submissions.length === 0) continue;
    for (const user of reg.teamMembers) {
      let refCode = user.referralCode;
      if (refCode == null || refCode.trim() === "") refCode = "N/A";
      refCode = refCode.trim().toUpperCase();

      if (cas[refCode] == null) {
        cas[refCode] = new Set();
      }
      let ca = cas[refCode];
      ca.add(user.ragamID);
    }
  }
  return cas;
}

function Event({ jwt, eventsBySlug }) {
  const { slug } = useParams();
  const [cas, setCAs] = useState();
  const event = eventsBySlug[slug];

  useEffect(() => {
    eventDetails({ jwt, id: event.id }).then((details) => {
      let cas = consolidateRegs(details);
      setCAs(cas);
    });
  }, [jwt, event.id]);

  if (!cas) {
    return <div className="pad1">Loading event regs .. </div>
  } else {
    let entries = Object.entries(cas);
    entries.sort((a, b) => {
      if (a[0].startsWith("R21") && b[0].startsWith("R21")) {
        return a[0] > b[0];
      }
      return b[0].startsWith("R21");
    });
    return <div>
      <h1 className="events-title">{event.name}</h1>
      {entries.map(([id, ragamids]) => {
        ragamids = Array.from(ragamids);
        return <details className="events-ca-entry">
          <summary>{id} ({ragamids.length})</summary>
          <div>
            {ragamids.map((r, idx) => <div>{idx + 1}. {r}</div>)}
          </div>
        </details>;
      })}
    </div>
  }

}