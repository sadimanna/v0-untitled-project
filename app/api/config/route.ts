export async function GET() {
  try {
    // Force the backend URL to use port 3002
    const backendUrl = "http://localhost:3002"
    console.log("Fetching config from:", backendUrl)
    
    const response = await fetch(`${backendUrl}/api/config`)
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }
    
    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching config:", error)
    return new Response(
      JSON.stringify({ error: "Failed to fetch configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
} 