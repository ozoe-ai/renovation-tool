import { NextRequest, NextResponse } from "next/server";
import type { AppState } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzXNXU3VTgc9ZXGhcWnva40xJpNYaUMTM2C9veDKCs3PkRqqQhHI16_2CEiWQnoqg/exec";

export async function POST(request: NextRequest) {
  try {
    const state = (await request.json()) as AppState;

    if (!state || !Array.isArray(state.selectedWorkItems)) {
      return NextResponse.json({ error: "Invalid quote payload." }, { status: 400 });
    }

    const gasUrl = process.env.GAS_WEB_APP_URL || DEFAULT_GAS_WEB_APP_URL;

    const response = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        projectName: state.projectName || "",
        customerName: state.customerName || "",
        honorific: "\u69d8",
        discount: 0,
        items: state.selectedWorkItems,
        selectedWorkItems: state.selectedWorkItems,
        apiSecret: process.env.GAS_API_SECRET || "",
      }),
    });

    const result = await response.json().catch(() => null);
    const succeeded = result?.ok === true || result?.success === true;
    if (!response.ok || !succeeded) {
      return NextResponse.json(
        { error: result?.error || result?.message || "Failed to export quote." },
        { status: response.ok ? 500 : response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl || result.url,
      fileName: result.fileName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export quote.";
    console.error("[export-quote]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
