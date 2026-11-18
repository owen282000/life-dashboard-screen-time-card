<p align="center">
  <img src="https://raw.githubusercontent.com/owen282000/life-dashboard-screen-time-card/main/docs/readme-icon.png" alt="Life Dashboard icon" width="128" height="128">
</p>

<h1 align="center">Life Dashboard Screen Time</h1>

<p align="center">
  <b>Screen time on your Home Assistant dashboard: today, the week, and the whole family.</b><br>
  Three cards in one install, each against a daily limit you set, with every app's own icon and minutes.
</p>

<p align="center">
  <a href="https://my.home-assistant.io/redirect/hacs_repository/?owner=owen282000&repository=life-dashboard-screen-time-card&category=plugin"><img src="https://img.shields.io/badge/Marketplace-Listed-41BDF5" alt="Listed in the Home Assistant Marketplace"></a>
  <a href="https://github.com/owen282000/life-dashboard-screen-time-card/releases/latest"><img src="https://img.shields.io/github/v/release/owen282000/life-dashboard-screen-time-card?label=Release&color=30b77e" alt="Latest release"></a>
  <a href="https://www.home-assistant.io/"><img src="https://img.shields.io/badge/Home%20Assistant-2026.3%2B-41BDF5" alt="Home Assistant 2026.3 or newer"></a>
  <a href="https://github.com/owen282000/life-dashboard-screen-time-card/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://github.com/owen282000/life-dashboard-screen-time-card#install"><b>Install</b></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/owen282000/life-dashboard-screen-time-card#configure">Configure</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/owen282000/life-dashboard-screen-time-card#where-the-screen-time-comes-from">Sources</a>
  &nbsp;·&nbsp;
  <a href="https://owen282000.com/life-dashboard/">Website</a>
</p>

<p align="center">
  <sub>Life Dashboard: <a href="https://github.com/owen282000/life-dashboard-companion-app">Android app</a> &nbsp;·&nbsp; <a href="https://github.com/owen282000/life-dashboard-companion-app-ios">iPhone app</a> &nbsp;·&nbsp; <a href="https://github.com/owen282000/life-dashboard-ha">Home Assistant integration</a> &nbsp;·&nbsp; <a href="https://github.com/owen282000/life-dashboard-stack">Grafana stack</a> &nbsp;·&nbsp; <a href="https://github.com/owen282000/life-dashboard-sleep-card">Sleep card</a> &nbsp;·&nbsp; <b>Screen time cards</b></sub>
</p>

<p align="center">
  <picture>
    <source media="(max-width: 600px)" srcset="https://raw.githubusercontent.com/owen282000/life-dashboard-screen-time-card/main/docs/readme-hero-phone.png">
    <img src="https://raw.githubusercontent.com/owen282000/life-dashboard-screen-time-card/main/docs/readme-hero.png" alt="The three cards on a dark theme. Today: a ring with 3h 16m of a 3h 30m limit, 14 minutes left, up 23 minutes on yesterday, and YouTube, WhatsApp, Chrome, Instagram and Maps with their minutes. The week: a bar per day against a dashed limit line, two days over it, and today's apps as one stacked bar. The family: Sam, Mila and Noah with their totals against their limits, their top three apps, and Noah over by 59 minutes" width="900">
  </picture>
  <br><sub>Sample data from made-up phones</sub>
</p>

The cards read what Android already counts for Digital Wellbeing, sent to Home Assistant by the [Life Dashboard app](https://github.com/owen282000/life-dashboard-companion-app) and its [integration](https://github.com/owen282000/life-dashboard-ha). The official Companion app has no minutes per app, so for today's apps and the week you need Life Dashboard. A sensor of your own, such as `history_stats` over the Companion app's interactive sensor, still gives the total and the week.

<a href="https://play.google.com/store/apps/details?id=com.owen282000.lifedashboard&referrer=utm_source%3Dgh-screentime-readme%26utm_medium%3Dreadme"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" height="60" align="middle"></a>

## What you get

- **Today on one phone.** A ring against the daily limit, how much is left or how far over, the difference with yesterday and with the last seven days, and the apps with their minutes. "+ more" shows the rest.
- **The week.** A bar per day with the limit as a line, the days over it marked, and the average. Tap a day to see its apps as one stacked bar.
- **The family.** Everyone in one card, each against their own limit, with their three biggest apps. Tap a person for all their apps. With a `person`, their picture shows.
- **Icons that look like the apps.** A built-in list of 126 popular Android apps with their name, brand color and icon. Any other app gets its first letter on a color of its own. Rename an app, give it your own color, or hide it, per card.
- **Your locale and theme.** English, Arabic, Chinese, Dutch, French, German, Hindi, Italian, Japanese, Portuguese and Spanish, durations in your language, and the colors of your theme in light and dark. The colors for on track, nearly there and over are CSS variables.

## Install

### Through the Home Assistant Marketplace

In **Settings > Marketplace** (HACS before Home Assistant 2026.11), search for **Life Dashboard Screen Time** and download it. The button opens it in your Home Assistant straight away:

[![Open your Home Assistant instance and open this repository in the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=owen282000&repository=life-dashboard-screen-time-card&category=plugin)

Not in the list yet, for example because the Marketplace has not refreshed its list since? Add it yourself: the three dots, **Custom repositories**, and `https://github.com/owen282000/life-dashboard-screen-time-card` as the type **Dashboard**.

On storage mode dashboards the resource is registered for you. If your dashboards are in YAML mode, add it yourself:

```yaml
lovelace:
  resources:
    - url: /hacsfiles/life-dashboard-screen-time-card/life-dashboard-screen-time-card.js
      type: module
```

### By hand

Copy `dist/life-dashboard-screen-time-card.js` into the `www` folder of your Home Assistant configuration and add it as a resource of the type JavaScript module with the URL `/local/life-dashboard-screen-time-card.js`.

## Configure

All three are in the card picker after one install, with a visual editor. Or in YAML:

```yaml
type: custom:life-dashboard-screen-time-card
entity: sensor.your_phone_screen_time_today
limit: "3:30"
```

```yaml
type: custom:life-dashboard-screen-time-week-card
entity: sensor.your_phone_screen_time_today
limit: "3:30"
```

```yaml
type: custom:life-dashboard-screen-time-family-card
people:
  - entity: sensor.sams_pixel_screen_time_today
    person: person.sam
    limit: "3:30"
  - entity: sensor.milas_tablet_screen_time_today
    name: Mila
    limit: "2:00"
```

| Option | Cards | Description |
| --- | --- | --- |
| `entity` | today, week | The phone's screen time today, such as `sensor.your_phone_screen_time_today` |
| `limit` | all | The daily limit: `"3:30"`, `"2h"`, `"45m"` or minutes. With Family Link or Family Safety the limit set there is used when you leave this out. Without any limit the ring fills against the 7-day average |
| `title` | all | Instead of the phone's name, "This week" or "Family" |
| `apps_shown` | today | Apps before "+ more", 5 by default |
| `days` | week | Days in the chart, 3 to 14, 7 by default |
| `people` | family | Per phone: `entity`, and optionally `name`, `person` (for the picture and the name) and its own `limit` |
| `apps` | all | Per package name: `name`, `color`, `icon` (such as `mdi:gamepad-variant`) or `hidden: true` |

```yaml
apps:
  com.whatsapp:
    name: Chats
  com.roblox.client:
    icon: mdi:gamepad-variant
    color: "#e2231a"
  com.google.android.apps.nexuslauncher:
    hidden: true
```

## Where the screen time comes from

- **Life Dashboard** (Android): the app reads the usage statistics Digital Wellbeing shows, with the usage access permission, and the integration makes a device per phone. The cards find the phone's other sensors on their own: yesterday, the app sensors, the last sync, and the week from the integration's long-term statistics. With integration 1.2.0 or newer every app of the day comes along; before that, the top five and the app sensors you switched on (on the phone's device page, under disabled entities). The apps of earlier days need those app sensors.
- **Google Family Link**, through [HAFamilyLink](https://github.com/noiwid/HAFamilyLink): pick a child's **Daily Screen Time** sensor. Its apps come along, the week comes from the sensor's statistics, and the daily limit set in Family Link is used unless you give the card your own.
- **Microsoft Family Safety**, through [HAFamilySafety](https://github.com/noiwid/HAFamilySafety): pick the child's **Screen Time** sensor. The apps come from the account's **Applications** sensor and the limit from its time remaining sensor.
- **Any other sensor** with today's total in hours or minutes that starts at zero each day, such as `history_stats` with `type: time` over `binary_sensor.your_phone_interactive`. The week then comes from that sensor's own statistics. An `apps` attribute, as a list of `package`, `name` and `minutes`, gives the apps too.
- **An iPhone** has no screen time for apps to read: iOS has no API for it.

## Colors

| Variable | Default |
| --- | --- |
| `--life-dashboard-screen-time-ok` | the theme's `--success-color` |
| `--life-dashboard-screen-time-warn` | the theme's `--warning-color`, from 80% of the limit |
| `--life-dashboard-screen-time-over` | the theme's `--error-color` |

## Part of Life Dashboard

These cards sit on top of Life Dashboard's projects, and you only install the parts you need. More at [owen282000.com/life-dashboard](https://owen282000.com/life-dashboard/).

<p align="center">
  <a href="https://github.com/owen282000/life-dashboard-companion-app"><img src="https://raw.githubusercontent.com/owen282000/life-dashboard-screen-time-card/main/docs/family/android.png" alt="Android app: Health Connect and screen time" width="400"></a>
  <a href="https://github.com/owen282000/life-dashboard-ha"><img src="https://raw.githubusercontent.com/owen282000/life-dashboard-screen-time-card/main/docs/family/ha.png" alt="Home Assistant integration: sensors and all your history" width="400"></a>
  <a href="https://github.com/owen282000/life-dashboard-companion-app-ios"><img src="https://raw.githubusercontent.com/owen282000/life-dashboard-screen-time-card/main/docs/family/ios.png" alt="iPhone app: Apple Health" width="400"></a>
  <a href="https://github.com/owen282000/life-dashboard-stack"><img src="https://raw.githubusercontent.com/owen282000/life-dashboard-screen-time-card/main/docs/family/stack.png" alt="Grafana stack: Postgres and Grafana dashboards" width="400"></a>
  <a href="https://github.com/owen282000/life-dashboard-sleep-card"><img src="https://raw.githubusercontent.com/owen282000/life-dashboard-screen-time-card/main/docs/family/sleep-card.png" alt="Sleep card: one night, stage by stage" width="400"></a>
  <img src="https://raw.githubusercontent.com/owen282000/life-dashboard-screen-time-card/main/docs/family/screen-time-card-here.png" alt="Screen time cards: today, the week and the family (this repository)" width="400">
</p>

## Privacy

The cards only read what Home Assistant already gives your browser: the sensors' state and, for the week, the recorder's statistics. They make no requests of their own, have no telemetry or analytics, and there's no server of mine in the path. The app icons come from Home Assistant's own icon set.

## Help and contributing

Bugs go to [issues](https://github.com/owen282000/life-dashboard-screen-time-card/issues) here. Questions go to the integration's [Discussions](https://github.com/owen282000/life-dashboard-ha/discussions). No GitHub account? Use the [feedback board](https://owen282000.com/life-dashboard/feedback/), which needs no account. Everything on it is public, so leave out app lists, logs and webhook URLs.
