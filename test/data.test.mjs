import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appLook,
  appStatisticId,
  barColor,
  catalogSize,
  dayKeys,
  formatDuration,
  hashColor,
  mean,
  parseLimit,
  parseTopApps,
  perDay,
  readApps,
  readAppsAttribute,
  readableOn,
  screenTimeEntities,
  siblings,
  statusOf,
  toMinutes,
  translate,
} from "../dist/life-dashboard-screen-time-card.js";

const state = (value, unit, attributes = {}) => ({ state: String(value), attributes: { unit_of_measurement: unit, ...attributes } });

// A fake hass with one Life Dashboard phone: today, yesterday, two app sensors, the sync time.
function phone() {
  const device = "dev1";
  const entities = {
    "sensor.pixel_screen_time_today": { entity_id: "sensor.pixel_screen_time_today", device_id: device, platform: "life_dashboard", translation_key: "screen_time_today" },
    "sensor.pixel_screen_time_yesterday": { entity_id: "sensor.pixel_screen_time_yesterday", device_id: device, platform: "life_dashboard", translation_key: "screen_time_yesterday" },
    "sensor.pixel_youtube_screen_time": { entity_id: "sensor.pixel_youtube_screen_time", device_id: device, platform: "life_dashboard", translation_key: "app_screen_time" },
    "sensor.pixel_whatsapp_screen_time": { entity_id: "sensor.pixel_whatsapp_screen_time", device_id: device, platform: "life_dashboard", translation_key: "app_screen_time" },
    "sensor.other_steps": { entity_id: "sensor.other_steps", device_id: "dev2", platform: "life_dashboard", translation_key: "steps_today" },
  };
  const states = {
    "sensor.pixel_screen_time_today": state(3.2667, "h", { date: "2026-11-16", app_count: 10, top_apps: "YouTube (50 min), WhatsApp (33 min), Chrome (31 min)" }),
    "sensor.pixel_screen_time_yesterday": state(2.8834, "h"),
    "sensor.pixel_youtube_screen_time": state(0.8334, "h", { app: "YouTube", package: "com.google.android.youtube", date: "2026-11-16" }),
    "sensor.pixel_whatsapp_screen_time": state(0.55, "h", { app: "WhatsApp", package: "com.whatsapp", date: "2026-11-15" }),
  };
  return { entities, states };
}

test("toMinutes reads the unit, and rejects what is not a duration", () => {
  assert.equal(toMinutes(state(3.5, "h")), 210);
  assert.equal(toMinutes(state(90, "min")), 90);
  assert.equal(toMinutes(state(120, "s")), 2);
  assert.equal(toMinutes(state(45, undefined)), 45);
  assert.equal(toMinutes(state("unavailable", "h")), null);
  assert.equal(toMinutes(state(-1, "h")), null);
  assert.equal(toMinutes(state("", "h")), null);
  assert.equal(toMinutes(undefined), null);
});

test("parseLimit takes every way a limit gets written", () => {
  assert.equal(parseLimit("3:30"), 210);
  assert.equal(parseLimit("2h"), 120);
  assert.equal(parseLimit("1h 15m"), 75);
  assert.equal(parseLimit("45min"), 45);
  assert.equal(parseLimit(90), 90);
  assert.equal(parseLimit("90"), 90);
  assert.equal(parseLimit({ hours: 2, minutes: 30, seconds: 0 }), 150);
  for (const none of [undefined, null, "", 0, -5, "soon", {}]) assert.equal(parseLimit(none), 0);
});

test("parseTopApps reads the integration's text, also names with commas or brackets", () => {
  assert.deepEqual(parseTopApps("YouTube (50 min), WhatsApp (33 min)"), [
    { package: null, name: "YouTube", minutes: 50 },
    { package: null, name: "WhatsApp", minutes: 33 },
  ]);
  assert.deepEqual(parseTopApps("Hello, World (5 min)").map((row) => row.name), ["Hello, World"]);
  assert.deepEqual(parseTopApps("Notes (work) (12 min)").map((row) => row.name), ["Notes (work)"]);
  assert.deepEqual(parseTopApps(undefined), []);
  assert.deepEqual(parseTopApps("nothing here"), []);
});

test("readAppsAttribute takes a list or an object keyed by package, and skips junk", () => {
  assert.deepEqual(readAppsAttribute([{ package: "a.b", name: "A", minutes: 5 }, null, { name: "B", minutes: "x" }, { minutes: 3 }]), [
    { package: "a.b", name: "A", minutes: 5 },
  ]);
  assert.deepEqual(readAppsAttribute({ "a.b": { name: "A", minutes: 7 }, "c.d": "nope" }), [{ package: "a.b", name: "A", minutes: 7 }]);
  assert.deepEqual(readAppsAttribute("text"), []);
});

test("siblings stay on the phone's own device", () => {
  const hass = phone();
  assert.deepEqual(siblings(hass, "sensor.pixel_screen_time_today", "screen_time_yesterday"), ["sensor.pixel_screen_time_yesterday"]);
  assert.equal(siblings(hass, "sensor.pixel_screen_time_today", "steps_today").length, 0);
  assert.deepEqual(siblings(hass, "sensor.unknown", "screen_time_yesterday"), []);
});

test("readApps prefers a list, else the app sensors of today plus top_apps", () => {
  const hass = phone();
  const rows = readApps(hass, "sensor.pixel_screen_time_today");
  // WhatsApp's sensor holds yesterday, so its row comes from top_apps without a package.
  assert.deepEqual(rows.map((row) => [row.package, row.name, Math.round(row.minutes)]), [
    ["com.google.android.youtube", "YouTube", 50],
    [null, "WhatsApp", 33],
    [null, "Chrome", 31],
  ]);
  hass.states["sensor.pixel_screen_time_today"].attributes.apps = [
    { package: "com.whatsapp", name: "WhatsApp", minutes: 33 },
    { package: "com.android.chrome", name: "Chrome", minutes: 0 },
  ];
  assert.deepEqual(readApps(hass, "sensor.pixel_screen_time_today").map((row) => row.package), ["com.whatsapp"]);
});

test("screenTimeEntities finds the phones by translation key, or by name without a registry", () => {
  assert.deepEqual(screenTimeEntities(phone()), ["sensor.pixel_screen_time_today"]);
  assert.deepEqual(screenTimeEntities({ states: { "sensor.tab_screen_time_today": {}, "sensor.x": {} } }), ["sensor.tab_screen_time_today"]);
});

test("statusOf: on track, nearly there, over, or no limit", () => {
  assert.deepEqual(statusOf(60, 120), { tone: "ok", key: "left", value: 60 });
  assert.deepEqual(statusOf(100, 120), { tone: "warn", key: "left", value: 20 });
  assert.deepEqual(statusOf(150, 120), { tone: "over", key: "over", value: 30 });
  assert.equal(statusOf(150, 0).tone, "none");
});

test("appLook: own settings first, then the built-in list, then the package", () => {
  const youtube = appLook({ package: "com.google.android.youtube", name: null, minutes: 1 });
  assert.equal(youtube.name, "YouTube");
  assert.equal(youtube.icon, "mdi:youtube");
  const byName = appLook({ package: null, name: "Minecraft", minutes: 1 });
  assert.equal(byName.icon, "mdi:minecraft");
  const own = appLook({ package: "com.whatsapp", name: "WhatsApp", minutes: 1 }, { "com.whatsapp": { name: "Chats", color: "#123456", hidden: true } });
  assert.deepEqual([own.name, own.color, own.hidden], ["Chats", "#123456", true]);
  const unknown = appLook({ package: "nl.example.parking", name: null, minutes: 1 });
  assert.equal(unknown.name, "Parking");
  assert.equal(unknown.icon, null);
  assert.equal(unknown.color, hashColor("nl.example.parking"));
  assert.ok(catalogSize() > 100);
});

test("glyph and bar colors stay readable", () => {
  assert.equal(readableOn("#FFFC00"), "#111");
  assert.equal(readableOn("#E50914"), "#fff");
  assert.equal(readableOn("hsl(10 45% 42%)"), "#fff");
  assert.equal(barColor("#000000"), "var(--_ink)");
  assert.equal(barColor("#1DB954"), "#1DB954");
  assert.equal(barColor("linear-gradient(135deg,#fff,#000)"), "#D62976");
});

test("statistics: ids, days and averages", () => {
  assert.equal(appStatisticId("01M7JMSE", "com.google.android.youtube"), "life_dashboard:01m7jmse_app_com_google_android_youtube");
  assert.equal(appStatisticId("x", "com.Foo-Bar.app"), "life_dashboard:x_app_com_foo_bar_app");
  const now = Date.parse("2026-11-16T12:00:00Z");
  assert.deepEqual(dayKeys(now, 3, "UTC"), ["2026-11-14", "2026-11-15", "2026-11-16"]);
  // A day that starts at 23:00 UTC (midnight in Amsterdam) lands on its own date.
  const rows = [{ start: Date.parse("2026-11-14T23:00:00Z"), change: 3 }, { start: "2026-11-15T23:00:00Z", change: 2.5 }, { start: 1, change: "x" }];
  assert.deepEqual([...perDay(rows, 60, "Europe/Amsterdam")], [["2026-11-15", 180], ["2026-11-16", 150]]);
  assert.equal(mean([60, null, 0, 120]), 90);
  assert.equal(mean([]), null);
});

test("formatDuration and translate follow the language", () => {
  assert.equal(formatDuration(196, "en"), "3h 16m");
  assert.equal(formatDuration(50, "en"), "50m");
  assert.equal(formatDuration(120, "en"), "2h");
  assert.equal(formatDuration(NaN), "");
  assert.equal(translate("nl-NL", "left", { value: "14m" }), "nog 14m");
  assert.equal(translate("fr", "left", { value: "14m" }), "14m left");
});
