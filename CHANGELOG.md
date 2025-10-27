# Changelog

## v0.1.2

- Bugfix for rounding of now causing issues to skip creation. The previous
  behavior was (assuming UTC for simplicity) for an issue that was scheduled for
  "every monday" and a now of 2025-10-27T10:00:00Z, then rounded now would be
  2025-10-27T00:00:00Z and the next scheduled monday would be
  2025-11-03T00:00:00Z. To correct for this the rounded now has a second
  subtracted from it.

## v0.1.1

- Bugfix to allow for parsing of user provided start dates in configurations.

## v0.1.0

- Initial release of the recurring issues action.
