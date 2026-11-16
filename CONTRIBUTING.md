# Contributing

Thanks for your interest in improving the Life Dashboard Screen Time cards.

## Getting started

The three cards are one JavaScript file with no dependencies and no build step: `dist/life-dashboard-screen-time-card.js`.

```sh
npm test
```

`npm test` runs the data logic under Node. For the drawing, copy the file into the `www` folder of a test Home Assistant and look at all three cards in a light and a dark theme, at dashboard and phone width.

## What a change should keep

- One file, no dependencies, no build step.
- Every value that comes from a sensor is set as text or escaped.
- A sensor that is missing, unavailable or malformed shows an empty state, never a broken card.
- Brand icons only from Home Assistant's own icon set, never bundled in the file.
- Identity is never color alone: every app has its name next to its icon.
- Sample data only in fixtures and screenshots, never someone's real phone use.

## Commits and pull requests

Commit messages and pull request titles follow `type: Sentence with a capital`, such as `fix: Keep the hour ticks inside the plot`. Add a line under `## [Unreleased]` in `CHANGELOG.md` when a user would notice the change.

## Releasing

Versions are strict semver (`X.Y.Z`) and live in four places that must agree: `VERSION` in `dist/life-dashboard-screen-time-card.js`, `version` in `package.json`, the section in `CHANGELOG.md`, and the git tag, which is the version without a prefix. A GitHub release on the tag is what the Marketplace offers to users.

The Marketplace installs `life-dashboard-screen-time-card.js` from the release, and its download count is the install count. The `Release file` workflow runs the tests and attaches the file when a release is published, and fails when the versions do not match the tag. For an older release without the file, run the workflow by hand with that tag.

## Where things belong

The cards only draw. Sensors and statistics are in the [integration](https://github.com/owen282000/life-dashboard-ha), and syncing is in the phone apps.
