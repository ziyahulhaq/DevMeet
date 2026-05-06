'use server';

import sql from "@/lib/db";

export const createBooking = async ({ eventId, email }: { eventId: number; slug: string; email: string; }) => {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const existingBooking = await sql`
            SELECT id FROM bookings
            WHERE event_id = ${eventId} AND LOWER(email) = ${normalizedEmail}
            LIMIT 1
        `;

        if (existingBooking.length > 0) {
            return { success: true, alreadyBooked: true };
        }

        await sql`
            INSERT INTO bookings (event_id, email)
            VALUES (${eventId}, ${normalizedEmail})
        `;

        return { success: true, alreadyBooked: false };
    } catch (e) {
        console.error('create booking failed', e);
        return { success: false, alreadyBooked: false };
    }
}
