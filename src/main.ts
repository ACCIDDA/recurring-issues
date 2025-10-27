import * as core from '@actions/core'
import * as github from '@actions/github'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { parseConfig } from './parse.js'
import { calculateNextDate } from './rules.js'
import { createIssue } from './github.js'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Result of processing a single recurring issue.
 */
export interface ProcessRecurringIssueResult {
  issueNumber: number | null
  messages: string[]
}

/**
 * Process a single recurring issue configuration.
 *
 * @param issue - The parsed issue configuration
 * @param timezone - The timezone string
 * @param roundedNow - The current date/time rounded to midnight
 * @param octokit - The GitHub Octokit client
 * @returns Object containing the issue number (or null) and log messages
 */
export async function processRecurringIssue(
  issue: ReturnType<typeof parseConfig>[number],
  timezone: string,
  roundedNow: Date,
  octokit: ReturnType<typeof github.getOctokit>
): Promise<ProcessRecurringIssueResult> {
  const messages: string[] = []
  // Calculate the next occurrence date based on the schedule
  const start =
    dayjs(issue.start)
      .tz(timezone)
      .startOf('day')
      .subtract(1, 'second')
      .toDate() || roundedNow

  // RRule.after() is exclusive, so search just before today's boundary.
  const searchDate = new Date(roundedNow.getTime() - 60 * 1000)
  const nextDate = calculateNextDate(
    issue.schedule,
    timezone,
    start,
    searchDate
  )
  const roundedNextDate = nextDate
    ? dayjs(nextDate).tz(timezone).startOf('day').toDate()
    : null
  if (
    roundedNextDate === null ||
    dayjs(roundedNextDate).tz(timezone).subtract(1, 'second').toDate() >
      roundedNow
  ) {
    messages.push(
      `The next occurrence for "${issue.title}" is ` +
        `${roundedNextDate?.toISOString()}, which is in the future or there are ` +
        `no future occurrences. Skipping issue creation.`
    )
    return { issueNumber: null, messages }
  }
  messages.push(
    `The next occurrence for "${issue.title}" is ${roundedNextDate.toISOString()}.`
  )

  // Calculate the due date based on the due rule
  let dueDate: Date | null = null
  if (issue.due) {
    const dueSearchDate = new Date(roundedNextDate.getTime() - 60 * 1000)
    dueDate = calculateNextDate(
      issue.due,
      timezone,
      roundedNextDate,
      dueSearchDate
    )
    if (dueDate === null) {
      messages.push(
        `The due date for "${issue.title}" could not ` +
          `be calculated. Skipping issue creation.`
      )
      return { issueNumber: null, messages }
    }
    messages.push(
      `The due date for "${issue.title}" is ${dueDate.toISOString()}.`
    )
  } else {
    messages.push(
      `No due date rule specified for "${issue.title}", using next occurrence.`
    )
  }

  // Create the issue on GitHub
  const issueNumber = await createIssue(
    issue,
    dueDate || roundedNextDate,
    timezone,
    octokit
  )
  if (issueNumber === null) {
    messages.push(`Issue creation failed for "${issue.title}".`)
    return { issueNumber: null, messages }
  } else {
    messages.push(
      `Issue created successfully for "${issue.title}" as #${issueNumber}.`
    )
    return { issueNumber, messages }
  }
}

/**
 * Core logic for processing recurring issues.
 * Extracted for testability.
 *
 * @param config - The configuration string
 * @param timezone - The timezone string
 * @param octokit - The GitHub Octokit client
 * @param now - Optional current timestamp (defaults to current time)
 * @returns Array of created issue numbers
 */
export async function processRecurringIssues(
  config: string,
  timezone: string,
  octokit: ReturnType<typeof github.getOctokit>,
  now: Date = dayjs().tz(timezone).toDate()
): Promise<number[]> {
  core.info(`Action started at: ${now.toISOString()}`)

  // Create a rounded "now" timestamp floored to midnight (00:00:00)
  const roundedNow = dayjs(now)
    .tz(timezone)
    .startOf('day')
    .subtract(1, 'second')
    .toDate()
  core.info(`Rounded now: ${roundedNow.toISOString()}`)

  // Parse the configuration
  const parsed = parseConfig(config)

  // Loop through each issue configuration and log details
  const issueNumbers: number[] = []
  for (let index = 0; index < parsed.length; index++) {
    const issue = parsed[index]
    core.info(`Processing Issue ${index + 1}: ${issue.title}`)

    const result = await processRecurringIssue(
      issue,
      timezone,
      roundedNow,
      octokit
    )

    // Log all messages from processing this issue
    for (const message of result.messages) {
      core.info(message)
    }

    if (result.issueNumber !== null) {
      issueNumbers.push(result.issueNumber)
    }
  }

  return issueNumbers
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Get inputs defined in action metadata file
    const token: string = core.getInput('token')
    const config: string = core.getInput('config')
    const timezone: string = core.getInput('timezone')

    // Get an octokit client for GitHub API requests
    const octokit = github.getOctokit(token)

    // Process recurring issues
    const issueNumbers = await processRecurringIssues(config, timezone, octokit)

    // Set outputs for other workflow steps to use
    core.setOutput('issues', issueNumbers.join(','))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
