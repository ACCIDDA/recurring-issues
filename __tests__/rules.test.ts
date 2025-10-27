import { calculateNextDate, fromFloating, toFloating } from '../src/rules'

describe('calculateNextDate', () => {
  it('should calculate the next date based on the recurrence rule', () => {
    const nextDate = calculateNextDate(
      'FREQ=DAILY;INTERVAL=1',
      'UTC',
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-02T12:00:00Z')
    )
    expect(nextDate).toEqual(new Date('2024-01-03T00:00:00Z'))
  })

  it('should return null if there are no future occurrences', () => {
    const nextDate = calculateNextDate(
      'FREQ=DAILY;COUNT=2',
      'UTC',
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-03T00:00:00Z')
    )
    expect(nextDate).toBeNull()
  })

  it('should handle human-readable recurrence rules', () => {
    const nextDate = calculateNextDate(
      'Every day',
      'UTC',
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-02T12:00:00Z')
    )
    expect(nextDate).toEqual(new Date('2024-01-03T00:00:00Z'))
  })

  it('should handle timezones correctly', () => {
    const nextDate = calculateNextDate(
      'FREQ=DAILY;INTERVAL=1',
      'America/New_York',
      new Date('2024-01-01T00:00:00-05:00'),
      new Date('2024-01-02T12:00:00-05:00')
    )
    expect(nextDate).toEqual(new Date('2024-01-03T00:00:00-05:00'))
  })

  it('should handle positive offset timezones', () => {
    const nextDate = calculateNextDate(
      'FREQ=HOURLY;INTERVAL=6',
      'Asia/Tokyo',
      new Date('2024-01-01T09:00:00+09:00'),
      new Date('2024-01-01T11:00:00+09:00')
    )
    expect(nextDate).toEqual(new Date('2024-01-01T15:00:00+09:00'))
  })

  it('should handle daylight saving transitions for negative offsets', () => {
    const nextDate = calculateNextDate(
      'FREQ=DAILY;INTERVAL=1',
      'America/Los_Angeles',
      new Date('2024-03-10T00:00:00-08:00'),
      new Date('2024-03-10T12:00:00-07:00')
    )
    expect(nextDate).toEqual(new Date('2024-03-11T00:00:00-07:00'))
  })

  it('should respect until boundaries', () => {
    // UNTIL is defined in UTC, so this value
    // corresponds to 2024-01-03 00:00 in New York.
    const rule = 'FREQ=DAILY;UNTIL=20240103T050000Z'
    const timezone = 'America/New_York'

    const nextDate = calculateNextDate(
      rule,
      timezone,
      new Date('2024-01-01T00:00:00-05:00'),
      new Date('2024-01-02T12:00:00-05:00')
    )
    expect(nextDate).toEqual(new Date('2024-01-03T00:00:00-05:00'))

    const noFutureDates = calculateNextDate(
      rule,
      timezone,
      new Date('2024-01-01T00:00:00-05:00'),
      new Date('2024-01-03T12:00:00-05:00')
    )
    expect(noFutureDates).toBeNull()
  })

  it('should respect until boundaries provided as text', () => {
    const rule = 'Every day until January 3, 2024'
    const timezone = 'America/New_York'
    const start = new Date('2024-01-01T00:00:00-05:00')

    const nextDate = calculateNextDate(
      rule,
      timezone,
      start,
      new Date('2024-01-02T12:00:00-05:00')
    )
    expect(nextDate).toEqual(new Date('2024-01-03T00:00:00-05:00'))

    const noFutureDates = calculateNextDate(
      rule,
      timezone,
      start,
      new Date('2024-01-03T12:00:00-05:00')
    )
    expect(noFutureDates).toBeNull()
  })

  it('example of a meeting occurring every Monday', () => {
    const rule = 'every monday'
    const timezone = 'UTC'
    const now = new Date('2025-10-26T23:59:00Z') // Midnight minus one minute

    const nextDate = calculateNextDate(rule, timezone, now)
    expect(nextDate).toEqual(new Date('2025-10-27T23:59:00Z'))
  })

  it('example of a meeting occurring every Monday in eastern time', () => {
    const rule = 'every monday'
    const timezone = 'America/New_York'
    const now = new Date('2025-10-26T23:59:00Z') // Midnight minus one minute

    const nextDate = calculateNextDate(rule, timezone, now)
    expect(nextDate).toEqual(new Date('2025-10-27T23:59:00Z'))
  })
})

describe('timezone helpers', () => {
  it('toFloating and fromFloating should be inverses', () => {
    const timezone = 'Australia/Sydney'
    const original = new Date('2024-04-15T10:30:45.123+10:00')

    const floating = toFloating(original, timezone)
    const roundTrip = fromFloating(floating, timezone)

    expect(roundTrip.toISOString()).toEqual(original.toISOString())
  })
})
