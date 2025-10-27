import { jest } from '@jest/globals'
import type { z } from 'zod'
import type { IssueSchema } from '../src/parse.js'

// Set environment variable for github context
process.env.GITHUB_REPOSITORY = 'test-owner/test-repo'

// Mock modules BEFORE importing
const mockInfo = jest.fn()
const mockError = jest.fn()

jest.unstable_mockModule('@actions/core', () => ({
  __esModule: true,
  info: mockInfo,
  error: mockError
}))

// Mock the createIssue function
const mockCreateIssue = jest.fn()
jest.unstable_mockModule('../src/github.js', () => ({
  __esModule: true,
  createIssue: mockCreateIssue
}))

// Now import the function under test
const { processRecurringIssue, processRecurringIssues } =
  await import('../src/main.js')

describe('processRecurringIssue', () => {
  let mockOctokit: {
    rest: {
      issues: {
        create: jest.Mock
      }
    }
  }
  const mockTimezone = 'America/New_York'

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Create a mock octokit
    mockOctokit = {
      rest: {
        issues: {
          create: jest.fn()
        }
      }
    }
  })

  it('should skip issue when next occurrence is in the future', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Future Issue',
      schedule: 'FREQ=DAILY',
      start: new Date('2025-07-20T04:00:00Z') // Midnight July 20 in America/New_York
    }

    const mockRoundedNow = new Date('2025-07-15T04:00:00Z') // Midnight July 15 in America/New_York

    const result = await processRecurringIssue(
      mockIssue,
      mockTimezone,
      mockRoundedNow,
      mockOctokit
    )

    expect(result.issueNumber).toBeNull()
    expect(result.messages[0]).toContain(
      'which is in the future or there are no future occurrences. Skipping issue creation.'
    )
    expect(mockCreateIssue).not.toHaveBeenCalled()
  })

  it('should skip issue when schedule has no future occurrences', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Past Issue',
      schedule: 'FREQ=DAILY;UNTIL=20250710T040000Z',
      start: new Date('2025-07-01T04:00:00Z')
    }

    const mockRoundedNow = new Date('2025-07-15T04:00:00Z')

    const result = await processRecurringIssue(
      mockIssue,
      mockTimezone,
      mockRoundedNow,
      mockOctokit
    )

    expect(result.issueNumber).toBeNull()
    expect(result.messages[0]).toContain(
      'which is in the future or there are no future occurrences. Skipping issue creation.'
    )
    expect(mockCreateIssue).not.toHaveBeenCalled()
  })

  it('should skip issue when due date cannot be calculated', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Issue with Invalid Due',
      schedule: 'FREQ=DAILY',
      due: 'FREQ=DAILY;UNTIL=20250710T040000Z',
      start: new Date('2025-07-01T04:00:00Z')
    }

    // Even though the schedule itself is valid, the due date rule has expired
    const mockRoundedNow = new Date('2025-07-15T04:00:00Z')

    const result = await processRecurringIssue(
      mockIssue,
      mockTimezone,
      mockRoundedNow,
      mockOctokit
    )

    expect(result.issueNumber).toBeNull()
    expect(result.messages).toContain(
      'The due date for "Issue with Invalid Due" could not be calculated. Skipping issue creation.'
    )
    expect(mockCreateIssue).not.toHaveBeenCalled()
  })

  it('should handle issue creation failure when issue is created', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Failing Issue',
      schedule: 'FREQ=DAILY',
      start: new Date('2025-07-01T04:00:00Z')
    }

    const mockRoundedNow = new Date('2025-07-15T04:00:00Z')
    mockCreateIssue.mockResolvedValue(null)

    const result = await processRecurringIssue(
      mockIssue,
      mockTimezone,
      mockRoundedNow,
      mockOctokit
    )

    expect(result.issueNumber).toBeNull()
    expect(result.messages).toContain(
      'Issue creation failed for "Failing Issue".'
    )
  })

  it('should log issue indexes while processing the full config', async () => {
    const config = `
- title: First Issue
  schedule: FREQ=DAILY
  start: 2025-07-20T04:00:00Z
- title: Second Issue
  schedule: FREQ=DAILY
  start: 2025-07-20T04:00:00Z
- title: Third Issue
  schedule: FREQ=DAILY
  start: 2025-07-20T04:00:00Z
`

    await processRecurringIssues(
      config,
      mockTimezone,
      mockOctokit,
      new Date('2025-07-15T16:00:00Z')
    )

    expect(mockInfo).toHaveBeenCalledWith('Processing Issue 3: Third Issue')
  })

  it('should return messages without calling createIssue when skipped', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Test Issue',
      schedule: 'FREQ=DAILY',
      start: new Date('2025-07-20T04:00:00Z') // Future start
    }

    const mockRoundedNow = new Date('2025-07-15T04:00:00Z')

    const result = await processRecurringIssue(
      mockIssue,
      mockTimezone,
      mockRoundedNow,
      mockOctokit
    )

    expect(result).toHaveProperty('issueNumber')
    expect(result).toHaveProperty('messages')
    expect(Array.isArray(result.messages)).toBe(true)
    expect(result.messages.length).toBeGreaterThan(0)
    expect(result.issueNumber).toBeNull()
  })

  it('should include issue title in processing messages', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'My Custom Issue Title',
      schedule: 'FREQ=WEEKLY;BYDAY=MO',
      start: new Date('2025-07-20T04:00:00Z') // Future start
    }

    const mockRoundedNow = new Date('2025-07-15T04:00:00Z')

    const result = await processRecurringIssue(
      mockIssue,
      mockTimezone,
      mockRoundedNow,
      mockOctokit
    )

    expect(result.messages[0]).toContain('My Custom Issue Title')
  })

  it('should handle issue with body, labels, and assignees fields', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Complete Issue',
      body: 'Issue with all fields',
      labels: ['bug', 'priority-high'],
      assignees: ['user1', 'user2'],
      schedule: 'FREQ=DAILY',
      start: new Date('2025-07-20T04:00:00Z') // Future start
    }

    const mockRoundedNow = new Date('2025-07-15T04:00:00Z')

    const result = await processRecurringIssue(
      mockIssue,
      mockTimezone,
      mockRoundedNow,
      mockOctokit
    )

    // Function should handle all fields without error
    expect(result).toHaveProperty('issueNumber')
    expect(result).toHaveProperty('messages')
    expect(result.issueNumber).toBeNull()
  })

  it('should handle weekly schedule', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Weekly Issue',
      schedule: 'FREQ=WEEKLY;BYDAY=TU',
      start: new Date('2025-07-20T04:00:00Z') // Future start
    }

    const mockRoundedNow = new Date('2025-07-15T04:00:00Z') // July 15, 2025 is a Tuesday

    const result = await processRecurringIssue(
      mockIssue,
      mockTimezone,
      mockRoundedNow,
      mockOctokit
    )

    // Will be skipped because start is in the future
    expect(result.issueNumber).toBeNull()
  })

  it('should handle human-readable schedule strings', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Human Readable Schedule',
      schedule: 'every day',
      start: new Date('2025-07-20T04:00:00Z') // Start in the future
    }

    const mockRoundedNow = new Date('2025-07-15T04:00:00Z')

    const result = await processRecurringIssue(
      mockIssue,
      mockTimezone,
      mockRoundedNow,
      mockOctokit
    )

    // Should process without error even with human-readable format
    expect(result).toHaveProperty('issueNumber')
    expect(result).toHaveProperty('messages')
    // Will be skipped because start is in the future
    expect(result.issueNumber).toBeNull()
  })

  // This test verifies the RRule.after() exclusivity fix.
  it('should create issue on Monday when schedule is "every monday"', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Weekly Monday Issue',
      schedule: 'every monday',
      start: new Date('2025-10-20T04:00:00Z')
    }

    const roundedNow = new Date('2025-10-27T04:00:00Z')
    mockCreateIssue.mockResolvedValue(123)

    const issueResult = await processRecurringIssue(
      mockIssue,
      'America/New_York',
      roundedNow,
      mockOctokit
    )

    expect(issueResult.issueNumber).toBe(123)
    expect(issueResult.messages).toContain(
      'The next occurrence for "Weekly Monday Issue" is 2025-10-27T04:00:00.000Z.'
    )
    expect(issueResult.messages).toContain(
      'Issue created successfully for "Weekly Monday Issue" as #123.'
    )
    expect(mockCreateIssue).toHaveBeenCalledWith(
      mockIssue,
      roundedNow,
      'America/New_York',
      mockOctokit
    )
  })
})
