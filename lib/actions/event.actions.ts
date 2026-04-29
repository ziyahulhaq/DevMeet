'use server';

import { mapEventRow } from "@/database";
import pool from "@/lib/db";

export const getEvents = async () => {
    const result = await pool.query("SELECT * FROM events ORDER BY id DESC");

    return result.rows.map(mapEventRow);
}

export const getEventBySlug = async (slug: string) => {
    if (!slug || slug.trim() === "") {
        return null;
    }

    const result = await pool.query(
        "SELECT * FROM events WHERE slug = $1",
        [slug.trim().toLowerCase()]
    );

    return result.rows[0] ? mapEventRow(result.rows[0]) : null;
}

export const getSimilarEventsBySlug = async (slug: string) => {
    try {
        const eventResult = await pool.query(
            "SELECT id, tags FROM events WHERE slug = $1",
            [slug]
        );
        const event = eventResult.rows[0] ? mapEventRow(eventResult.rows[0]) : null;

        if (!event || event.tags.length === 0) {
            return [];
        }

        const similarEvents = await pool.query(
            `SELECT *
             FROM events
             WHERE id <> $1
               AND to_jsonb(tags) ?| $2::text[]
             ORDER BY id DESC`,
            [event.id, event.tags]
        );

        return similarEvents.rows.map(mapEventRow);
    } catch {
        return [];
    }
}
