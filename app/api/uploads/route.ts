import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const processId = formData.get("processId")?.toString()
    const submittedBy = formData.get("submittedBy")?.toString()
    const fieldKey = formData.get("fieldKey")?.toString()
    const files = formData.getAll("files").filter((item) => item instanceof File) as File[]

    if (!processId || !submittedBy || !fieldKey || files.length === 0) {
      return NextResponse.json({ error: "Missing required upload fields" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()
    const bucket = "request-attachments"
    const uploadedUrls: string[] = []

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const path = `${submittedBy}/${processId}/${fieldKey}/${Date.now()}-${safeName}`

      const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      if (data?.publicUrl) {
        uploadedUrls.push(data.publicUrl)
      }
    }

    return NextResponse.json({ urls: uploadedUrls })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
