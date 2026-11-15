const DATA_KEY = "vehicle_status";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function authorized(request, expected) {
  const header = request.headers.get("authorization") || "";
  return Boolean(expected) && header === `Bearer ${expected}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "geely-starray-widget-api" });
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      if (!authorized(request, env.WIDGET_TOKEN)) {
        return json({ error: "unauthorized" }, 401);
      }
      const value = await env.VEHICLE_DATA.get(DATA_KEY);
      if (!value) return json({ error: "no_vehicle_data_yet" }, 404);
      try {
        return json(JSON.parse(value));
      } catch {
        return json({ error: "stored_data_invalid" }, 500);
      }
    }

    if (url.pathname === "/api/update" && request.method === "POST") {
      if (!authorized(request, env.INGEST_TOKEN)) {
        return json({ error: "unauthorized" }, 401);
      }
      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "invalid_json" }, 400);
      }

      const allowed = [
        "petrol_range_km",
        "battery_percent",
        "electric_range_km",
        "odometer_km",
        "vehicle_image_url",
        "updated_at"
      ];
      const clean = {};
      for (const key of allowed) {
        if (payload[key] !== undefined) clean[key] = payload[key];
      }
      if (!Object.keys(clean).length) {
        return json({ error: "no_supported_fields" }, 400);
      }
      clean.updated_at = clean.updated_at || new Date().toISOString();
      await env.VEHICLE_DATA.put(DATA_KEY, JSON.stringify(clean));
      return json({ ok: true, updated_at: clean.updated_at });
    }

    return json({ error: "not_found" }, 404);
  }
};
