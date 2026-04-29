import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import cloudinary from "@/lib/cloudinary";
import pool from "@/lib/db";
import { mapEventRow } from "@/database";

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
  message?: string;
  name?: string;
};

function getFileExtension(file: File) {
  const extensionFromName = path.extname(file.name).toLowerCase();

  if (extensionFromName) {
    return extensionFromName;
  }

  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".bin";
  }
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
    return {
      httpCode: 500,
      message: error.message,
    };
  }

  if (error && typeof error === "object") {
    const cloudinaryError = error as CloudinaryError;
    const message = cloudinaryError.message ?? "Unknown Cloudinary error";
    const httpCode = cloudinaryError.http_code ?? 500;

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

async function saveImageLocally(buffer: Buffer, file: File) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "events");
  const filename = `${Date.now()}-${randomUUID()}${getFileExtension(file)}`;

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);

  return `/uploads/events/${filename}`;
}

function shouldUseLocalUploadFallback(error: unknown) {
  const isExplicitlyEnabled =
    process.env.ALLOW_LOCAL_UPLOAD_FALLBACK === "true";
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (!isExplicitlyEnabled && !isDevelopment) {
    return false;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const cloudinaryError = error as CloudinaryError;
  return cloudinaryError.http_code === 403;
}

async function uploadEventImage(buffer: Buffer) {
  return new Promise<string>((resolve, reject) => {
    const onUploadComplete = (
      error: unknown,
      result?: { secure_url?: string | null }
    ) => {
      if (error) {
        reject(error);
        return;
      }

      if (!result?.secure_url) {
        reject(new Error("Cloudinary upload completed without a secure URL."));
        return;
      }

      resolve(result.secure_url);
    };

    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    const stream = uploadPreset
      ? cloudinary.uploader.unsigned_upload_stream(uploadPreset, {
          resource_type: "image",
          folder: "DevEvent",
        }, onUploadComplete)
      : cloudinary.uploader.upload_stream(
          { resource_type: "image", folder: "DevEvent" },
          onUploadComplete
        );

    stream.on("error", reject);
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (
      !contentType.includes("multipart/form-data") &&
      !contentType.includes("application/x-www-form-urlencoded")
    ) {
      return NextResponse.json(
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
      return NextResponse.json(
        {
          message: "Missing required fields",
          missingFields,
        },
        { status: 400 }
      );
    }

    const file = formData.get("image");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
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

      return NextResponse.json({ message }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let image: string;

    try {
      image = await uploadEventImage(buffer);
    } catch (error) {
      if (shouldUseLocalUploadFallback(error)) {
        image = await saveImageLocally(buffer, file);
      } else {
        throw error;
      }
    }

    const title = getTextField(formData, "title");
    const slug = getTextField(formData, "slug") || createSlug(title);
    const result = await pool.query(
      `INSERT INTO events (
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
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

    const createdEvent = mapEventRow(result.rows[0]);

    return NextResponse.json(
      { message: "Event created successfully", event: createdEvent },
      { status: 201 }
    );
  } catch (error) {
    const { httpCode, message } = getCloudinaryErrorDetails(error);

    console.error(error);

    return NextResponse.json(
      { message: "Event Creation Failed", error: message },
      { status: httpCode === 403 ? 502 : 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY id DESC");
    const events = result.rows.map(mapEventRow);

    return NextResponse.json(
      { message: "Events fetched successfully", events },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error while fetching events";

    return NextResponse.json(
      { message: "Event fetching failed", error: message },
      { status: 500 }
    );
  }
}
