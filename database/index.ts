export interface IEvent {
  id: number;
  title: string;
  slug: string;
  description: string;
  overview: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  organizer: string;
  image: string;
  tags: string[];
  agenda: string[];
  created_at?: string;
  updated_at?: string;
}

export interface IBooking {
  id: number;
  event_id: number;
  slug: string;
  email: string;
  created_at?: string;
}

function stringifyField(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === "string" ? value : String(value ?? "");
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim() !== "") {
    try {
      const parsed = JSON.parse(value);
      return normalizeStringArray(parsed);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function mapEventRow(row: Record<string, unknown>): IEvent {
  return {
    id: Number(row.id),
    title: stringifyField(row.title),
    slug: stringifyField(row.slug),
    description: stringifyField(row.description),
    overview: stringifyField(row.overview),
    venue: stringifyField(row.venue),
    location: stringifyField(row.location),
    date: stringifyField(row.date),
    time: stringifyField(row.time),
    mode: stringifyField(row.mode),
    audience: stringifyField(row.audience),
    organizer: stringifyField(row.organizer),
    image: stringifyField(row.image),
    tags: normalizeStringArray(row.tags),
    agenda: normalizeStringArray(row.agenda),
    created_at: row.created_at ? stringifyField(row.created_at) : undefined,
    updated_at: row.updated_at ? stringifyField(row.updated_at) : undefined,
  };
}
