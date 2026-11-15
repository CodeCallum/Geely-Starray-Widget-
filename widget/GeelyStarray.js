// Geely Starray EM-i widget for Scriptable
// Set these two values before running.
const API_URL = "https://geely-starray-widget.callumbns.workers.dev";
const WIDGET_TOKEN = "PASTE_WIDGET_TOKEN_HERE";

const req = new Request(`${API_URL}/api/status`);
req.method = "GET";
req.headers = { Authorization: `Bearer ${WIDGET_TOKEN}` };
req.timeoutInterval = 15;

const widget = new ListWidget();
widget.backgroundColor = new Color("#101820");
widget.setPadding(14, 16, 14, 16);

function addMetric(parent, label, value, unit) {
  const stack = parent.addStack();
  stack.layoutVertically();
  const heading = stack.addText(label.toUpperCase());
  heading.font = Font.mediumSystemFont(9);
  heading.textColor = new Color("#9FB0BC");
  heading.textOpacity = 0.95;
  const line = stack.addStack();
  line.centerAlignContent();
  const number = line.addText(value);
  number.font = Font.semiboldSystemFont(22);
  number.textColor = Color.white();
  if (unit) {
    const suffix = line.addText(` ${unit}`);
    suffix.font = Font.systemFont(11);
    suffix.textColor = new Color("#B9C6CE");
  }
}

try {
  if (API_URL.includes("YOUR-WORKER") || WIDGET_TOKEN.includes("PASTE_")) {
    throw new Error("Add your Worker URL and widget token in the script.");
  }
  const data = await req.loadJSON();

  const header = widget.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const title = header.addText("GEELY STARRAY EM-i");
  title.font = Font.boldSystemFont(12);
  title.textColor = Color.white();
  header.addSpacer();
  if (data.vehicle_image_url) {
    try {
      const imageRequest = new Request(data.vehicle_image_url);
      imageRequest.timeoutInterval = 8;
      const carImage = await imageRequest.loadImage();
      const image = header.addImage(carImage);
      image.imageSize = new Size(76, 42);
      image.resizable = true;
      image.applyFittingContentMode();
    } catch (_) {
      // The telemetry widget remains usable if the optional image cannot load.
    }
  }
  widget.addSpacer(10);

  const row1 = widget.addStack();
  row1.layoutHorizontally();
  row1.spacing = 18;
  addMetric(row1, "Petrol range", data.petrol_range_km ?? "—", "km");
  addMetric(row1, "Battery", data.battery_percent ?? "—", "%");

  widget.addSpacer(9);
  const row2 = widget.addStack();
  row2.layoutHorizontally();
  row2.spacing = 18;
  addMetric(row2, "EV range", data.electric_range_km ?? "—", "km");
  addMetric(row2, "Odometer", data.odometer_km ?? "—", "km");

  widget.addSpacer();
  const stamp = data.updated_at ? new Date(data.updated_at) : null;
  const footer = widget.addText(stamp && !isNaN(stamp)
    ? `Updated ${stamp.toLocaleString()}`
    : "Waiting for vehicle data");
  footer.font = Font.systemFont(8);
  footer.textColor = new Color("#9FB0BC");
} catch (error) {
  const title = widget.addText("GEELY STARRAY EM-i");
  title.font = Font.boldSystemFont(12);
  title.textColor = Color.white();
  widget.addSpacer(10);
  const message = widget.addText("No vehicle data available");
  message.font = Font.mediumSystemFont(12);
  message.textColor = new Color("#FFCC80");
  const detail = widget.addText(String(error.message || error));
  detail.font = Font.systemFont(8);
  detail.textColor = new Color("#B9C6CE");
  detail.lineLimit = 3;
}

widget.url = "https://github.com/CodeCallum/Geely-Starray-Widget-";
widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);
Script.setWidget(widget);
if (!config.runsInWidget) await widget.presentMedium();
Script.complete();
