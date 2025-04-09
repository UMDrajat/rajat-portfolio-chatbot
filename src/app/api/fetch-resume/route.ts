export async function POST(req: Request) {
    const { url } = await req.json();
    try {
      const res = await fetch(url);
      const text = await res.text();
      return new Response(JSON.stringify({ text }));
    } catch (err) {
      console.error('❌ Resume fetch failed:', err);
      return new Response(JSON.stringify({ text: '[Error fetching]' }), { status: 500 });
    }
  }