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

      const numericFields = [
        "petrol_range_km",
        "battery_percent",
        "electric_range_km",
        "odometer_km"
      ];
      const clean = {};
      for (const key of numericFields) {
        if (payload[key] === undefined || payload[key] === null) continue;
        const value = Number(payload[key]);
        if (!Number.isFinite(value) || value < 0) {
          return json({ error: `invalid_${key}` }, 400);
        }
        if (key === "battery_percent" && value > 100) {
          return json({ error: "invalid_battery_percent" }, 400);
        }
        clean[key] = value;
      }
      if (payload.vehicle_image_url !== undefined && payload.vehicle_image_url !== null) {
        try {
          const imageUrl = new URL(payload.vehicle_image_url);
          if (imageUrl.protocol !== "https:") throw new Error("https_required");
          clean.vehicle_image_url = imageUrl.toString();
        } catch {
          return json({ error: "invalid_vehicle_image_url" }, 400);
        }
      }
      if (payload.updated_at !== undefined) {
        const parsed = Date.parse(payload.updated_at);
        if (!Number.isFinite(parsed)) return json({ error: "invalid_updated_at" }, 400);
        clean.updated_at = new Date(parsed).toISOString();
      } else {
        clean.updated_at = new Date().toISOString();
      }
      if (Object.keys(clean).length === 1 && clean.updated_at) {
        return json({ error: "no_supported_fields" }, 400);
      }
      await env.VEHICLE_DATA.put(DATA_KEY, JSON.stringify(clean));
      return json({ ok: true, updated_at: clean.updated_at });
    }

    return json({ error: "not_found" }, 404);
  }
};
