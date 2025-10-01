import { formatDateString } from '../src/format'

describe('formatDateString', () => {
  it('should format a string with date tokens', () => {
    const formatted = formatDateString(
      '[YYYY-MM-DD HH:mm:ss]',
      new Date('2024-01-01T12:34:56Z'),
      'UTC'
    )
    expect(formatted).toBe('2024-01-01 12:34:56')
  })

  it('should handle different timezones', () => {
    const formatted = formatDateString(
      '[YYYY-MM-DD HH:mm:ss]',
      new Date('2024-01-01T12:34:56Z'),
      'America/New_York'
    )
    expect(formatted).toBe('2024-01-01 07:34:56')
  })

  it('should handle strings without tokens', () => {
    const formatted = formatDateString(
      'No date tokens here',
      new Date('2024-01-01T12:34:56Z'),
      'UTC'
    )
    expect(formatted).toBe('No date tokens here')
  })

  it('should handle strings with mixed tokens and text', () => {
    const formatted = formatDateString(
      'Date: [YYYY-MM-DD], Time: [HH:mm:ss]',
      new Date('2024-01-01T12:34:56Z'),
      'UTC'
    )
    expect(formatted).toBe('Date: 2024-01-01, Time: 12:34:56')
  })
})
