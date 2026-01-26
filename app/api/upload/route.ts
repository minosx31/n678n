import { NextResponse } from "next/server"


export async function POST(request: Request) {
  try {
    const handlerUrl = process.env.DOCUMENT_SERVICE_URL
    if (!handlerUrl) {
      return NextResponse.json({ error: "DOCUMENT_SERVICE_URL is not configured" }, { status: 500 })
    }

    const formData = await request.formData()
    const files = formData.getAll("document").filter((item) => item instanceof File) as File[]

    if (files.length !== 1) {
      return NextResponse.json({ error: "Exactly one document must be uploaded" }, { status: 400 })
    }

    const documentName = formData.get("documentName")
    if (!documentName) {
      return NextResponse.json({ error: "documentName is required" }, { status: 400 })
    }

    const response = await fetch(handlerUrl, {
      method: "POST",
      body: formData,
    })

    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    const text = await response.text()
    return NextResponse.json({ message: text }, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
