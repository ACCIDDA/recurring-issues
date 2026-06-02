# Changelog

## v0.1.3

- Bugfix for the calculation of due relative to schedule. The previous behavior
  calculated the due relative to when the action is being ran, which could lead
  to the due and the schedule being the same (i.e. both are "every day"). The
  correct behavior is for the due to be the following day, because if users want
  them to be the same the user can simply omit the due. This still allows for
  due being later on the same day though.

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
