export default async function handler(req, res) {
  const backendBaseUrl = process.env.BACKEND_URL || "http://130.162.171.106:8048";
  const targetUrl = `${backendBaseUrl}${req.url}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { ...req.headers },
      body: req.method !== "GET" ? req.body : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({ error: "Proxy error", details: error.message });
  }
}
