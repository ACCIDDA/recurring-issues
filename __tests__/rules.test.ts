import { calculateNextDate } from '../src/rules'

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
})
