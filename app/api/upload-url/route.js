import { NextResponse } from 'next/server';

// Deprecated: we no longer provide client-side pre-signed upload URLs.
// Use POST /api/materials/upload with multipart/form-data instead.

export async function POST() {
  return NextResponse.json({ error: 'Use /api/materials/upload' }, { status: 410 });
}
