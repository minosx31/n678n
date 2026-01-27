import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const processServiceUrl = process.env.PROCESS_SERVICE_URL
    if (!processServiceUrl) {
      return NextResponse.json(
        { error: "PROCESS_SERVICE_URL is not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()

    const response = await fetch(processServiceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const responseText = await response.text()

    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      try {
        const data = JSON.parse(responseText)
        return NextResponse.json(data, { status: response.status })
      } catch {
        return NextResponse.json(
          { message: responseText },
          { status: response.status }
        )
      }
    }

    return NextResponse.json(
      { message: responseText },
      { status: response.status }
    )
  } catch (error) {
    console.error("Process save error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to save process"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
