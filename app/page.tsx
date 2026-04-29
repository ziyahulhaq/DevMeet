import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEvent} from "@/database";
// import {getEvents} from "@/lib/actions/event.actions";
// import {connection} from "next/server";
import {Suspense} from "react";
import {cacheLife} from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;


const FeaturedEvents = async () => {
       'use cache';
    cacheLife('hours')
    const response = await fetch(`${BASE_URL}/api/events`);
    const { events } = await response.json();
    // await connection();

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
