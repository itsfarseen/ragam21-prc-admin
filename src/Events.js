import { useEffect, useState } from "react"
import { Link, Route, Switch, useParams } from "react-router-dom";
import { eventDetails, eventsByCategory } from "./services";

/********************* Utility Functions ***********************************/

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

function sortEventsById(events) {
  let eventsById = {};
  for (const event of events) {
    eventsById[event.id] = event;
  }
  return eventsById;
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

function consolidateRegs(regs, eventsById) {
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
      let event = eventsById[reg.event];
      if (event == null) throw "Event not found: " + reg.event + " - " + eventsById.length;
      ca.add([user.ragamID, event.name]);
    }
  }
  return cas;
}

/********************* Events Page Functions ***********************************/

export function Events({ jwt }) {
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventsBySub, setEventsBySub] = useState([]);
  const [eventsBySlug, setEventsBySlug] = useState([]);
  const [eventsById, setEventsById] = useState([]);

  useEffect(() => {
    eventsByCategory().then((categories) => {
      const events = consolidateEvents(categories);
      const _eventsBySlug = sortEventsBySlug(events);
      const _eventsBySub = sortEventsBySub(events);
      const _eventsById = sortEventsById(events);
      setEventsBySlug(_eventsBySlug);
      setEventsBySub(_eventsBySub);
      setEventsById(_eventsById);
      setEventsLoaded(true);
    });
  }, []);


  if (!eventsLoaded) {
    return <div className="pad1">Loading events .. </div>
  } else {
    return <Switch>
      <Route exact path="/events"><EventsList eventsBySub={eventsBySub} /></Route>
      <Route path="/events/:slug"><Event jwt={jwt} eventsBySlug={eventsBySlug} eventsById={eventsById} /></Route>
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

function Event({ jwt, eventsBySlug, eventsById }) {
  const { slug } = useParams();
  const [cas, setCAs] = useState();
  const event = eventsBySlug[slug];

  useEffect(() => {
    if (eventsById.length === 0) return;
    eventDetails({ jwt, id: event.id }).then((details) => {
      let cas = consolidateRegs(details, eventsById);
      setCAs(cas);
    });
  }, [jwt, eventsById, event.id]);

  if (!cas) {
    return <div className="pad1">Loading event regs .. </div>
  } else {
    let entries = Object.entries(cas);
    entries.sort((a, b) => {
      return a[1].size < b[1].size;
    });
    return <div>
      <h1 className="events-title">{event.name}</h1>
      {entries.map(([id, ragamids]) => {
        ragamids = Array.from(ragamids);
        return <details className="events-ca-entry" key={id}>
          <summary>{id} ({ragamids.length})</summary>
          <div>
            {ragamids.map(([r], idx) => <div>{idx + 1}. {r}</div>)}
          </div>
        </details>;
      })}
    </div>
  }

}

/********************* CAs Page Functions ***********************************/

export function CAs({ jwt }) {
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsById, setEventsById] = useState([]);
  const [eventsRegLoaded, setEventsRegLoaded] = useState(new Set());
  const [casData, setCAsData] = useState({});

  // Load list of events with no subs
  // for each event, add count to CA list.

  useEffect(() => {
    eventsByCategory().then((categories) => {
      let _events = consolidateEvents(categories);
      let _eventsClosed = sortEventsBySub(_events).closed;
      let _eventsById = sortEventsById(_events);
      setEvents(_eventsClosed);
      setEventsById(_eventsById);
      setEventsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (eventsById.length === 0) return;
    for (const event of events) {
      eventDetails({ jwt, id: event.id }).then((data) => {
        const cas = consolidateRegs(data, eventsById);
        setCAsData(casData => {
          let newData = { ...casData };
          for (const ca in cas) {
            let oldSet = casData[ca];
            if (oldSet == null) oldSet = new Set();
            let newSet = new Set([...oldSet, ...cas[ca]]);
            newData[ca] = newSet;
          }
          return newData;
        });
        setEventsRegLoaded((s) => new Set(s).add(event.id))
      });
    }
  }, [events, eventsById, jwt])

  if (!eventsLoaded) {
    return <div className="pad1">Loading events .. </div>
  } else {
    return <div className="flex-column">
      <CALoadStatus events={events} eventsRegLoaded={eventsRegLoaded} />
      <CAList casData={casData} jwt={jwt} />
    </div>
  }
}

function CAList({ casData, jwt }) {
  let entries = Object.entries(casData);
  entries.sort((a, b) => {
    return a[1].size < b[1].size;
  });
  return <div>
    {entries.map(([id, ragamids], idx) => {
      ragamids = Array.from(ragamids);
      return <details className="events-ca-entry" key={id}>
        <summary>{idx + 1}. {id} ({ragamids.length})</summary>
        <div>
          {ragamids.map(([r, ev], idx) => <div key={r + ev}>{idx + 1}. {r} - {ev}</div>)}
        </div>
      </details>;
    })}
  </div>;
}

function CALoadStatus({ events, eventsRegLoaded }) {
  return <div className="pad1">
    <div>
      Loading submission closed events:
    </div>
    {events.map((e, idx) => <div key={e.id}>{idx + 1}. {e.name}: {eventsRegLoaded.has(e.id) ? "OK." : ".."} </div>)}
  </div>
}