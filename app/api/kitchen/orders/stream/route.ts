import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`))

      // Set up interval to keep connection alive
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "PING" })}\n\n`))
      }, 30000)

      // Clean up on close
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
