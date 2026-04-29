'use server';

import pool from "@/lib/db";

export const createBooking = async ({ eventId, slug, email }: { eventId: number; slug: string; email: string; }) => {
    try {
        await pool.query(
            `INSERT INTO bookings (event_id, slug, email)
             VALUES ($1, $2, $3)`,
            [eventId, slug, email]
        );

        return { success: true };
    } catch (e) {
        console.error('create booking failed', e);
        return { success: false };
    }
}
