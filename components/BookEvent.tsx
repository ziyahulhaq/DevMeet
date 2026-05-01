'use client';

import {useState} from "react";
import Link from "next/link";
import {createBooking} from "@/lib/actions/booking.actions";
import posthog from "posthog-js";
import {MessageCircle} from "lucide-react";
import {USER_EMAIL_STORAGE_KEY} from "@/lib/constants";

const BookEvent = ({ eventId, slug }: { eventId: number, slug: string;}) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [alreadyBooked, setAlreadyBooked] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const normalizedEmail = email.trim().toLowerCase();
        const { success, alreadyBooked } = await createBooking({ eventId, slug, email: normalizedEmail });

        if(success) {
            localStorage.setItem(USER_EMAIL_STORAGE_KEY, normalizedEmail);
            setSubmitted(true);
            setAlreadyBooked(alreadyBooked);
            posthog.capture(alreadyBooked ? 'event_booking_exists' : 'event_booked', { eventId, slug, email: normalizedEmail })
        } else {
            console.error('Booking creation failed')
            posthog.captureException('Booking creation failed')
        }
    }

    return (
        <div id="book-event">
            {submitted ? (
                <div className="flex items-center gap-2">
                    <Link href="/messages" aria-label="Open messages" className="message-icon-link">
                        <MessageCircle aria-hidden="true" className="size-5" />
                    </Link>
                    <p className="text-sm">
                        {alreadyBooked ? 'You already booked this event!' : 'Thank you for signing up!'}
                    </p>
                </div>
            ): (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            id="email"
                            placeholder="Enter your email address"
                            required
                        />
                    </div>

                    <button type="submit" className="button-submit">Submit</button>
                </form>
            )}
        </div>
    )
}
export default BookEvent
