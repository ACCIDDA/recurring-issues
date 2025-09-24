import rrule from 'rrule'

const { RRule } = rrule

interface RuleOptions {
  freq: RRule.Frequency
  dtstart?: Date
  interval?: number
  wkst?: number | RRule.Weekday
  count?: number
  until?: Date
  tzid?: string
  bysetpos?: number | number[]
  bymonth?: number | number[]
  bymonthday?: number | number[]
  byyearday?: number | number[]
  byweekno?: number | number[]
  byweekday?: number | number[] | RRule.Weekday | RRule.Weekday[]
  byhour?: number | number[]
  byminute?: number | number[]
  bysecond?: number | number[]
  byeaster?: number | number[]
  bynmonthday?: number[]
  bynweekday?: number[]
}

/**
 * Calculate the next date based on the recurrence rule, timezone, & start date.
 *
 * @param rule A recurrence rule in string format, can either be an RFC5545 string or a
 * human-readable text. I.e. "FREQ=DAILY;INTERVAL=1" or "Every day".
 * @param timezone The timezone identifier. I.e. "America/New_York".
 * @param start The start date of the recurrence.
 * @param now The current date to calculate the next occurrence from. Defaults to the
 * current date and time.
 *
 * @returns A Date object representing the next occurrence, or null if there are no
 * future occurrences.
 */
export function calculateNextDate(
  rule: string,
  timezone: string,
  start: Date,
  now = new Date()
): Date | null {
  let options: RuleOptions
  try {
    options = RRule.parseString(rule)
  } catch {
    options = RRule.fromText(rule).origOptions
  }
  options.dtstart = start
  options.tzid = timezone
  return new RRule(options).after(now)
}
