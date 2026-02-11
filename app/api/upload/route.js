import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "../middleware/authMiddleware";
import { uploadService, validateFile } from "../services/uploadService";

export const config = {
  api: {
    bodyParser: false, 
  },
};

export async function POST(request) {
  try {
    // ✅ Authenticate user
    const authResult = await verifyFirebaseToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.message },
        { status: 401 }
      );
    }
    const userId = authResult.user.uid;

    // ✅ Parse form data using Web API formData()
    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!uploadedFile) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // ✅ Convert file to buffer
    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ✅ Create file object for validation
    const file = {
      name: uploadedFile.name,
      size: uploadedFile.size,
      type: uploadedFile.type || "application/octet-stream",
      buffer,
    };

    // ✅ Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.message },
        { status: 400 }
      );
    }

    // ✅ Process file using upload service
    const result = await uploadService(file, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload API Error:", error);

    // Handle specific error types
    const status =
      error.message.includes("File too large") ||
      error.message.includes("Unsupported file type") ||
      error.message.includes("No file")
        ? 400
        : 500;

    return NextResponse.json(
      {
        message: error.message,
        error: error.message,
        ...(error.processingError && { processingError: true }),
      },
      { status }
    );
  }
}
