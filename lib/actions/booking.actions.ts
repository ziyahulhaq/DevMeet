'use server';

import pool from "@/lib/db";

export const createBooking = async ({ eventId, email }: { eventId: number; slug: string; email: string; }) => {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const existingBooking = await pool.query(
            `SELECT id FROM bookings
             WHERE event_id = $1 AND LOWER(email) = $2
             LIMIT 1`,
            [eventId, normalizedEmail]
        );

        if (existingBooking.rowCount && existingBooking.rowCount > 0) {
            return { success: true, alreadyBooked: true };
        }

        await pool.query(
            `INSERT INTO bookings (event_id, email)
             VALUES ($1, $2)`,
            [eventId, normalizedEmail]
        );

        return { success: true, alreadyBooked: false };
    } catch (e) {
        console.error('create booking failed', e);
        return { success: false, alreadyBooked: false };
    }
}
