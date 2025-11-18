import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/middleware";
import crypto from "crypto";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * GET /api/teams/[id]/workspace/documents
 * List workspace documents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId } = await params;
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "root";

    // Check if user is a team member
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: auth.userId,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Not a team member" },
        { status: 403 }
      );
    }

    // Get workspace
    const workspace = await db.workspace.findUnique({
      where: { teamId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Get documents in folder (normalize folder parameter)
    const normalizedFolder = folder === "root" ? null : folder;
    const documents = await db.workspaceDocument.findMany({
      where: {
        workspaceId: workspace.id,
        folder: normalizedFolder,
      },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("[Documents GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[id]/workspace/documents
 * Upload a document to workspace
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId } = await params;

    // Check if user can edit
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: auth.userId,
        role: { in: ["ADMIN", "EDITOR"] },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "You don't have permission to upload documents" },
        { status: 403 }
      );
    }

    // Get workspace
    const workspace = await db.workspace.findUnique({
      where: { teamId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderInput = (formData.get("folder") as string) || "root";
    const folder = folderInput === "root" ? null : folderInput;
    const description = (formData.get("description") as string) || "";
    const tags = (formData.get("tags") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // For now, store file URL as a placeholder
    // In production, you'd upload to S3/Vercel Blob Storage
    const fileHash = crypto.randomBytes(16).toString("hex");
    const fileExtension = file.name.split(".").pop();
    const fileName = `${fileHash}.${fileExtension}`;
    const fileUrl = `/uploads/${teamId}/${fileName}`;

    // Create document record
    const document = await db.workspaceDocument.create({
      data: {
        workspaceId: workspace.id,
        fileName,
        originalName: file.name,
        fileType: file.type || "application/octet-stream",
        fileUrl,
        fileSize: file.size,
        uploadedBy: auth.userId,
        folder,
        description,
        tags,
      },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await db.workspaceActivity.create({
      data: {
        workspaceId: workspace.id,
        actorId: auth.userId,
        type: "document_uploaded",
        description: `Uploaded ${file.name}`,
        metadata: {
          documentId: document.id,
          fileName: file.name,
          fileSize: file.size,
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("[Documents POST]", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
