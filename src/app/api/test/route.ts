export const dynamic = "force-dynamic"

export async function GET() {
  // Return a simple JSON response
  return new Response(JSON.stringify({ message: "API route is working" }), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  })
}
