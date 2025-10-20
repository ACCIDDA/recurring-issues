import { jest } from '@jest/globals'
import type { z } from 'zod'
import type { IssueSchema } from '../src/parse.js'

// Set environment variable for github context
process.env.GITHUB_REPOSITORY = 'test-owner/test-repo'

// Mock modules BEFORE importing
const mockInfo = jest.fn()
const mockError = jest.fn()

jest.mock('@actions/core', () => ({
  __esModule: true,
  info: mockInfo,
  error: mockError
}))

// Now import the function under test
const { createIssue } = await import('../src/github.js')

describe('createIssue', () => {
  let mockOctokit: {
    rest: {
      issues: {
        create: jest.Mock
      }
    }
  }
  let mockCreate: jest.Mock
  const mockTimezone = 'America/New_York'
  const mockDueDate = new Date('2025-07-15T12:00:00Z')

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Create a mock for the octokit.rest.issues.create method
    mockCreate = jest.fn()
    mockOctokit = {
      rest: {
        issues: {
          create: mockCreate
        }
      }
    }
  })

  it('should create an issue with title only', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Test Issue',
      schedule: '0 0 * * *',
      due: '0 1 * * *',
      start: new Date('2025-01-01')
    }

    const mockResponse = {
      data: {
        number: 123,
        html_url: 'https://github.com/test-owner/test-repo/issues/123',
        id: 1,
        node_id: 'I_kwDOBcdEfg',
        title: 'Test Issue',
        state: 'open',
        locked: false,
        assignee: null,
        assignees: [],
        comments: 0,
        created_at: '2025-07-15T12:00:00Z',
        updated_at: '2025-07-15T12:00:00Z',
        closed_at: null,
        body: null,
        labels: []
      }
    }

    mockCreate.mockResolvedValue(mockResponse)

    const issueNumber = await createIssue(
      mockIssue,
      mockDueDate,
      mockTimezone,
      mockOctokit
    )

    expect(issueNumber).toBe(mockResponse.data.number)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      title: 'Test Issue'
    })
    expect(mockInfo).toHaveBeenCalledWith(
      `Created issue #${mockResponse.data.number}: ${mockResponse.data.html_url}`
    )
  })

  it('should create an issue with title and body', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Test Issue with Body',
      body: 'This is the issue body with due date: [YYYY-MM-DD]',
      schedule: '0 0 * * *',
      due: '0 1 * * *',
      start: new Date('2025-01-01')
    }

    const mockResponse = {
      data: {
        number: 456,
        html_url: 'https://github.com/test-owner/test-repo/issues/456',
        id: 2,
        node_id: 'I_kwDOBcdEfh',
        title: 'Test Issue with Body',
        state: 'open',
        locked: false,
        assignee: null,
        assignees: [],
        comments: 0,
        created_at: '2025-07-15T12:00:00Z',
        updated_at: '2025-07-15T12:00:00Z',
        closed_at: null,
        body: 'This is the issue body with due date: 2025-07-15',
        labels: []
      }
    }

    mockCreate.mockResolvedValue(mockResponse)

    const issueNumber = await createIssue(
      mockIssue,
      mockDueDate,
      mockTimezone,
      mockOctokit
    )

    expect(issueNumber).toBe(mockResponse.data.number)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'Test Issue with Body',
        body: expect.stringContaining('2025-07-15')
      })
    )
    expect(mockInfo).toHaveBeenCalledWith(
      `Created issue #${mockResponse.data.number}: ${mockResponse.data.html_url}`
    )
  })

  it('should create an issue with assignees', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Test Issue with Assignees',
      assignees: ['user1', 'user2'],
      schedule: '0 0 * * *',
      due: '0 1 * * *',
      start: new Date('2025-01-01')
    }

    const mockResponse = {
      data: {
        number: 789,
        html_url: 'https://github.com/test-owner/test-repo/issues/789',
        id: 3,
        node_id: 'I_kwDOBcdEfi',
        title: 'Test Issue with Assignees',
        state: 'open',
        locked: false,
        assignee: {
          login: 'user1',
          id: 1,
          node_id: 'U_abc123',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          type: 'User'
        },
        assignees: [
          {
            login: 'user1',
            id: 1,
            node_id: 'U_abc123',
            avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
            type: 'User'
          },
          {
            login: 'user2',
            id: 2,
            node_id: 'U_abc456',
            avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
            type: 'User'
          }
        ],
        comments: 0,
        created_at: '2025-07-15T12:00:00Z',
        updated_at: '2025-07-15T12:00:00Z',
        closed_at: null,
        body: null,
        labels: []
      }
    }

    mockCreate.mockResolvedValue(mockResponse)

    const issueNumber = await createIssue(
      mockIssue,
      mockDueDate,
      mockTimezone,
      mockOctokit
    )

    expect(issueNumber).toBe(mockResponse.data.number)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      title: 'Test Issue with Assignees',
      assignees: ['user1', 'user2']
    })
    expect(mockInfo).toHaveBeenCalledWith(
      `Created issue #${mockResponse.data.number}: ${mockResponse.data.html_url}`
    )
  })

  it('should create an issue with all optional fields', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Complete Issue [YYYY-MM-DD]',
      body: 'Issue body with date: [MMMM D, YYYY]',
      assignees: ['user1'],
      schedule: '0 0 * * *',
      due: '0 1 * * *',
      start: new Date('2025-01-01')
    }

    const mockResponse = {
      data: {
        number: 999,
        html_url: 'https://github.com/test-owner/test-repo/issues/999',
        id: 4,
        node_id: 'I_kwDOBcdEfj',
        title: 'Complete Issue 2025-07-15',
        state: 'open',
        locked: false,
        assignee: {
          login: 'user1',
          id: 1,
          node_id: 'U_abc123',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          type: 'User'
        },
        assignees: [
          {
            login: 'user1',
            id: 1,
            node_id: 'U_abc123',
            avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
            type: 'User'
          }
        ],
        comments: 0,
        created_at: '2025-07-15T12:00:00Z',
        updated_at: '2025-07-15T12:00:00Z',
        closed_at: null,
        body: 'Issue body with date: July 15, 2025',
        labels: []
      }
    }

    mockCreate.mockResolvedValue(mockResponse)

    const issueNumber = await createIssue(
      mockIssue,
      mockDueDate,
      mockTimezone,
      mockOctokit
    )

    expect(issueNumber).toBe(mockResponse.data.number)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        title: expect.stringContaining('2025-07-15'),
        body: expect.stringContaining('July 15, 2025'),
        assignees: ['user1']
      })
    )
    expect(mockInfo).toHaveBeenCalledWith(
      `Created issue #${mockResponse.data.number}: ${mockResponse.data.html_url}`
    )
  })

  it('should return null and log error when issue creation fails', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Failing Issue',
      schedule: '0 0 * * *',
      due: '0 1 * * *',
      start: new Date('2025-01-01')
    }

    const testError = new Error('API rate limit exceeded')
    mockCreate.mockRejectedValue(testError)

    const issueNumber = await createIssue(
      mockIssue,
      mockDueDate,
      mockTimezone,
      mockOctokit
    )

    expect(issueNumber).toBeNull()
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockError).toHaveBeenCalledWith(
      'Failed to create issue "Failing Issue": API rate limit exceeded'
    )
  })

  it('should handle network errors gracefully', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Network Error Issue',
      schedule: '0 0 * * *',
      due: '0 1 * * *',
      start: new Date('2025-01-01')
    }

    const mockErrorObj = new Error('Network request failed')
    mockCreate.mockRejectedValue(mockErrorObj)

    const issueNumber = await createIssue(
      mockIssue,
      mockDueDate,
      mockTimezone,
      mockOctokit
    )

    expect(issueNumber).toBeNull()
    expect(mockError).toHaveBeenCalledWith(
      'Failed to create issue "Network Error Issue": Network request failed'
    )
  })

  it('should format date tokens in title correctly', async () => {
    const mockIssue: z.infer<typeof IssueSchema> = {
      title: 'Weekly Report - Week of [YYYY-MM-DD]',
      schedule: '0 0 * * *',
      due: '0 1 * * *',
      start: new Date('2025-01-01')
    }

    const mockResponse = {
      data: {
        number: 111,
        html_url: 'https://github.com/test-owner/test-repo/issues/111',
        id: 5,
        node_id: 'I_kwDOBcdEfk',
        title: 'Weekly Report - Week of 2025-07-15',
        state: 'open',
        locked: false,
        assignee: null,
        assignees: [],
        comments: 0,
        created_at: '2025-07-15T12:00:00Z',
        updated_at: '2025-07-15T12:00:00Z',
        closed_at: null,
        body: null,
        labels: []
      }
    }

    mockCreate.mockResolvedValue(mockResponse)

    const issueNumber = await createIssue(
      mockIssue,
      mockDueDate,
      mockTimezone,
      mockOctokit
    )

    expect(issueNumber).toBe(mockResponse.data.number)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('2025-07-15')
      })
    )
  })
})
