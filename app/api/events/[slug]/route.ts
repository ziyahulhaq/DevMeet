import { mapEventRow } from '@/database';
import pool from '@/lib/db';

export const runtime = 'nodejs';

// Define route params type for type safety
type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

/**
 * GET /api/events/[slug]
 * Fetches a single events by its slug
 */
export async function GET(
  _req: Request,
  { params }: RouteParams
): Promise<Response> {
  try {
    // Await and extract slug from params
    const { slug } = await params;

    // Validate slug parameter
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return Response.json(
        { message: 'Invalid or missing slug parameter' },
        { status: 400 }
      );
    }

    // Sanitize slug (remove any potential malicious input)
    const sanitizedSlug = slug.trim().toLowerCase();

    // Query events by slug
    const result = await pool.query('SELECT * FROM events WHERE slug = $1', [
      sanitizedSlug,
    ]);
    const rows = result.rows;
    const event = rows[0] ? mapEventRow(rows[0]) : null;

    // Handle events not found
    if (!event) {
      return Response.json(
        { message: `Event with slug '${sanitizedSlug}' not found` },
        { status: 404 }
      );
    }

    // Return successful response with events data
    return Response.json(
      { message: 'Event fetched successfully', event },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching events by slug:', error);
    }

    // Handle specific error types
    if (error instanceof Error) {
      // Handle database connection errors
      if (error.message.includes('DATABASE_URL')) {
        return Response.json(
          { message: 'Database configuration error' },
          { status: 500 }
        );
      }

      // Return generic error with error message
      return Response.json(
        { message: 'Failed to fetch events', error: error.message },
        { status: 500 }
      );
    }

    // Handle unknown errors
    return Response.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
