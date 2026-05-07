import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEvent, mapEventRow} from "@/database";
import pool from "@/lib/db";
// import {getEvents} from "@/lib/actions/event.actions";
import {Suspense} from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FeaturedEvents = async () => {
    const result = await pool.query("SELECT * FROM events ORDER BY id DESC");
    const rows = result.rows;
    const events = rows.map(mapEventRow);

    // const events = await getEvents();

    return (
        <ul className="events">
            {events && events.length > 0 && events.map((event: IEvent) => (
                <li key={event.title} className="list-none">
                    <EventCard {...event} />
                </li>
            ))}
        </ul>
    );
}

const Page = async () => {
    return (
        <section>
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can&apos;t Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

                <Suspense fallback={<div>Loading...</div>}>
                    <FeaturedEvents />
                </Suspense>
            </div>
        </section>
    )
}

export default Page;
