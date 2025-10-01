import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Helper to format a string with date tokens.
 *
 * See [dayjs docs](https://day.js.org/docs/en/display/format) for available tokens.
 * Unlike dayjs, tokens must be wrapped in square to be formatted, i.e. `[YYYY-MM-DD]`.
 * Text outside of square brackets is not modified. This allows for easy formatting of
 * strings that contain both date tokens and regular text inside of a YAML
 * configuration.
 *
 * @param x String template to format.
 * @param date The date to format with.
 * @param timezone The timezone to format the date in.
 * @returns The string template with date tokens replaced.
 */
export function formatDateString(
  x: string,
  date: Date,
  timezone: string
): string {
  return x.replace(/\[(.+?)\]/g, (_, token) =>
    dayjs(date).tz(timezone).format(token)
  )
}
