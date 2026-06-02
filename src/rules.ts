import { RRule, type Options } from 'rrule'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Helper to convert a date to a "floating" date in UTC based on the given timezone.
 *
 * @param date A Date object to convert.
 * @param tz The timezone identifier. I.e. "America/New_York".
 * @returns A Date object in UTC representing the same local time as the input date.
 */
export function toFloating(date: Date, tz: string): Date {
  const zoned = dayjs(date).tz(tz)
  return new Date(
    Date.UTC(
      zoned.year(),
      zoned.month(),
      zoned.date(),
      zoned.hour(),
      zoned.minute(),
      zoned.second(),
      zoned.millisecond()
    )
  )
}

/**
 * Helper to convert a "floating" UTC date back to a date in the given timezone.
 *
 * @param date A Date object in UTC to convert.
 * @param tz The timezone identifier. I.e. "America/New_York".
 * @returns A Date object representing the same local time in the specified timezone.
 */
export function fromFloating(date: Date, tz: string): Date {
  const formatted = dayjs.utc(date).format('YYYY-MM-DDTHH:mm:ss.SSS')
  return dayjs.tz(formatted, tz).toDate()
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
  let parsed: Partial<Options>
  try {
    parsed = RRule.parseString(rule)
  } catch {
    parsed = RRule.fromText(rule).origOptions
  }
  const options: Partial<Options> = { ...parsed, tzid: undefined }
  options.dtstart = toFloating(start, timezone)
  if (options.until) {
    // When parsed from text, the until date is in the system's local timezone.
    // We need to interpret it as being in the target timezone instead.
    // Get the local time components and recreate the date in the target timezone.
    const untilDate = options.until
    const localTime = dayjs(untilDate).format('YYYY-MM-DDTHH:mm:ss.SSS')
    const untilInTargetTz = dayjs.tz(localTime, timezone).toDate()
    options.until = toFloating(untilInTargetTz, timezone)
  }
  const rrule = new RRule(options)
  const next = rrule.after(toFloating(now, timezone))
  return next ? fromFloating(next, timezone) : null
}
