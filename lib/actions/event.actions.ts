'use server';

import { mapEventRow } from "@/database";
import sql from "@/lib/db";

export const getEvents = async () => {
    const rows = await sql`SELECT * FROM events ORDER BY id DESC`;

    return rows.map(mapEventRow);
}

export const getEventBySlug = async (slug: string) => {
    if (!slug || slug.trim() === "") {
        return null;
    }

    const rows = await sql`SELECT * FROM events WHERE slug = ${slug.trim().toLowerCase()}`;

    return rows[0] ? mapEventRow(rows[0]) : null;
}

export const getSimilarEventsBySlug = async (slug: string) => {
    try {
        const eventRows = await sql`SELECT id, tags FROM events WHERE slug = ${slug}`;
        const event = eventRows[0] ? mapEventRow(eventRows[0]) : null;

        if (!event || event.tags.length === 0) {
            return [];
        }

        const similarEvents = await sql`
            SELECT *
             FROM events
             WHERE id <> ${event.id}
               AND to_jsonb(tags) ?| ${event.tags}::text[]
             ORDER BY id DESC
        `;

        return similarEvents.map(mapEventRow);
    } catch {
        return [];
    }
}
