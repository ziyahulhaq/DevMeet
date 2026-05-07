import pool from "@/lib/db";
import { mapEventRow } from "@/database";

export const runtime = "nodejs";

const REQUIRED_TEXT_FIELDS = [
  "title",
  "description",
  "overview",
  "venue",
  "location",
  "date",
  "time",
  "mode",
  "audience",
  "organizer",
] as const;

type CloudinaryError = {
  http_code?: number;
  httpCode?: number;
  message?: string;
  name?: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string | null;
  error?: {
    message?: string;
  };
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, init);
}

function getTextField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTags(value: string) {
  const parsed = JSON.parse(value);

  if (!Array.isArray(parsed) || parsed.some((tag) => typeof tag !== "string")) {
    throw new Error("`tags` must be a JSON array of strings.");
  }

  return parsed.map((tag) => tag.trim()).filter(Boolean);
}

function normalizeAgendaItem(item: unknown) {
  if (typeof item === "string") {
    return item.trim();
  }

  if (item && typeof item === "object") {
    const agendaItem = item as Record<string, unknown>;
    const parts = [agendaItem.time, agendaItem.topic, agendaItem.speaker]
      .filter((part) => typeof part === "string" && part.trim() !== "")
      .map((part) => (part as string).trim());

    if (parts.length > 0) {
      return parts.join(" - ");
    }
  }

  throw new Error(
    "`agenda` must be a JSON array of strings or agenda objects with time/topic/speaker fields."
  );
}

function normalizeAgenda(value: string) {
  const parsed = JSON.parse(value);

  if (!Array.isArray(parsed)) {
    throw new Error("`agenda` must be a JSON array.");
  }

  return parsed.map(normalizeAgendaItem).filter(Boolean);
}

function getCloudinaryErrorDetails(error: unknown) {
  if (error instanceof Error) {
    const cloudinaryError = error as Error & CloudinaryError;

    return {
      httpCode: cloudinaryError.httpCode ?? cloudinaryError.http_code ?? 500,
      message: error.message,
    };
  }

  if (error && typeof error === "object") {
    const cloudinaryError = error as CloudinaryError;
    const message = cloudinaryError.message ?? "Unknown Cloudinary error";
    const httpCode = cloudinaryError.httpCode ?? cloudinaryError.http_code ?? 500;

    if (httpCode === 403) {
      return {
        httpCode,
        message:
          `${message}. The configured Cloudinary key can authenticate, ` +
          `but it does not have upload/create permission.`,
      };
    }

    return { httpCode, message };
  }

  return {
    httpCode: 500,
    message: "Unknown Cloudinary error",
  };
}

async function sha1Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-1", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function createCloudinarySignature(params: Record<string, string>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiSecret) {
    throw new Error("Cloudinary API secret is not configured.");
  }

  const payload = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return sha1Hex(`${payload}${apiSecret}`);
}

async function uploadEventImage(file: File) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("Cloudinary cloud name is not configured.");
  }

  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const uploadForm = new FormData();

  uploadForm.append("file", file);
  uploadForm.append("folder", "DevEvent");

  if (uploadPreset) {
    uploadForm.append("upload_preset", uploadPreset);
  } else {
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!apiKey) {
      throw new Error("Cloudinary API key is not configured.");
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedParams = {
      folder: "DevEvent",
      timestamp,
    };

    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", timestamp);
    uploadForm.append("signature", await createCloudinarySignature(signedParams));
  }

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: uploadForm,
  });
  const result = (await response.json().catch(() => ({}))) as CloudinaryUploadResponse;

  if (!response.ok) {
    const message = result.error?.message ?? "Cloudinary upload failed.";
    throw Object.assign(new Error(message), { httpCode: response.status });
  }

  if (!result.secure_url) {
    throw new Error("Cloudinary upload completed without a secure URL.");
  }

  if (!result.secure_url.startsWith("https://res.cloudinary.com/")) {
    throw new Error("Cloudinary returned an unexpected image URL.");
  }

  return result.secure_url;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (
      !contentType.includes("multipart/form-data") &&
      !contentType.includes("application/x-www-form-urlencoded")
    ) {
      return jsonResponse(
        {
          message: "Unsupported Content-Type",
          error:
            'Use "form-data" in Postman and let Postman set the multipart Content-Type automatically.',
          receivedContentType: contentType || "missing",
        },
        { status: 415 }
      );
    }

    const formData = await req.formData();
    const missingFields = REQUIRED_TEXT_FIELDS.filter(
      (field) => getTextField(formData, field) === ""
    );

    if (missingFields.length > 0) {
      return jsonResponse(
        {
          message: "Missing required fields",
          missingFields,
        },
        { status: 400 }
      );
    }

    const file = formData.get("image");

    if (!(file instanceof File) || file.size === 0) {
      return jsonResponse(
        { message: "Image file is required" },
        { status: 400 }
      );
    }

    let tags: string[];
    let agenda: string[];

    try {
      tags = normalizeTags(getTextField(formData, "tags"));
      agenda = normalizeAgenda(getTextField(formData, "agenda"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid JSON data format";

      return jsonResponse({ message }, { status: 400 });
    }

    let image: string;

    try {
      image = await uploadEventImage(file);
    } catch (error) {
      console.error("Cloudinary upload failed:", getCloudinaryErrorDetails(error));
      throw error;
    }

    const title = getTextField(formData, "title");
    const slug = getTextField(formData, "slug") || createSlug(title);
    const createdResult = await pool.query(
      `
      INSERT INTO events (
        title,
        slug,
        description,
        overview,
        venue,
        location,
        date,
        time,
        mode,
        audience,
        organizer,
        image,
        tags,
        agenda
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13::text[],
        $14::text[]
      )
      RETURNING *
    `,
      [
        title,
        slug,
        getTextField(formData, "description"),
        getTextField(formData, "overview"),
        getTextField(formData, "venue"),
        getTextField(formData, "location"),
        getTextField(formData, "date"),
        getTextField(formData, "time"),
        getTextField(formData, "mode"),
        getTextField(formData, "audience"),
        getTextField(formData, "organizer"),
        image,
        tags,
        agenda,
      ]
    );
    const createdRows = createdResult.rows;

    const createdEvent = mapEventRow(createdRows[0]);

    return jsonResponse(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 }
    );
  } catch (error) {
    const { httpCode, message } = getCloudinaryErrorDetails(error);

    console.error(error);

    return jsonResponse(
      { message: "Event Creation Failed", error: message },
      { status: httpCode === 403 ? 502 : 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY id DESC");
    const rows = result.rows;
    const events = rows.map(mapEventRow);

    return jsonResponse(
      { message: "Events fetched successfully", events },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error while fetching events";

    return jsonResponse(
      { message: "Event fetching failed", error: message },
      { status: 500 }
    );
  }
}
