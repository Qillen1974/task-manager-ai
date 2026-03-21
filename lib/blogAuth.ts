import { NextRequest } from "next/server";
import { error } from "@/lib/apiResponse";

export function verifyBlogApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authenticated: false as const, error: error("Missing API key", 401, "MISSING_API_KEY") };
  }
  const key = authHeader.replace("Bearer ", "");
  if (key !== process.env.BLOG_API_KEY) {
    return { authenticated: false as const, error: error("Invalid API key", 401, "INVALID_API_KEY") };
  }
  return { authenticated: true as const };
}
