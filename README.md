# Geely Starray EM-i iPhone Widget

A private-data-first iPhone home-screen widget for the Australian 2026 Geely Starray EM-i plug-in hybrid.

## Planned display
- Remaining petrol range (km)
- Battery charge (%)
- Electric range (km), when reported by the vehicle
- Odometer (km)
- Vehicle image (optional)
- Last successful update time

## Architecture
1. A Cloudflare Worker serves a small authenticated JSON endpoint.
2. Vehicle data is stored in a Cloudflare KV namespace.
3. An iPhone widget built with [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) reads the endpoint.
4. A scheduled collector will be added only after the Geely APAC/Australia authentication flow is verified.

## Important integration status
The Geely connection is **not implemented yet**. The community `geely-connect` project reports support for Australian Starray PHEV vehicles through Geely's APAC cloud, but it uses a specialised authentication flow (including a provisioned mTLS client certificate and request signing). We must validate whether that flow can be implemented reliably in Cloudflare Workers before enabling unattended polling.

Do not put Geely passwords, OTPs, private keys, client certificates, API tokens, or vehicle identifiers in this repository. Store secrets as Cloudflare Worker secrets. Do not commit real vehicle data.

## Phase 1: deploy the data API
1. Create a KV namespace in Cloudflare.
2. Put its ID in `worker/wrangler.toml`.
3. Deploy the Worker and configure `WIDGET_TOKEN` and `INGEST_TOKEN` as Worker secrets.
4. Use the authenticated `POST /api/update` endpoint to store a test payload.
5. Configure the Scriptable widget with the Worker URL and widget token.

## Data format
The collector should eventually write a JSON object with this shape (unknown values may be `null`):

```json
{
  "petrol_range_km": 620,
  "battery_percent": 85,
  "electric_range_km": 72,
  "odometer_km": 1234,
  "vehicle_image_url": null,
  "updated_at": "2026-11-15T04:00:00.000Z"
}
```

These numbers are examples only, not readings from your vehicle.

## iPhone notes
Install Scriptable, add `widget/GeelyStarray.js` as a script, set the Worker URL and token in the script's configuration, then add a Scriptable widget to the Home Screen and select the script. iOS controls widget refresh timing, so a five-minute server polling interval does not guarantee the widget itself will redraw every five minutes.
