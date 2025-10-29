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

    // Set a consistent "now" timestamp for the action run in the user's timezone
    const now = dayjs().tz(timezone).toDate()
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

    // Get an octokit client for GitHub API requests
    const octokit = github.getOctokit(token)

    // Loop through each issue configuration and log details
    const issueNumbers: number[] = []
    for (let index = 0; index < parsed.length; index++) {
      const issue = parsed[index]
      // Log the issue being processed
      core.info(`Processing Issue ${index + 1}: ${issue.title}`)

      // Calculate the next occurrence date based on the schedule
      const start =
        dayjs(issue.start)
          .tz(timezone)
          .startOf('day')
          .subtract(1, 'second')
          .toDate() || roundedNow
      const nextDate = calculateNextDate(
        issue.schedule,
        timezone,
        start,
        roundedNow
      )
      const roundedNextDate = nextDate
        ? dayjs(nextDate).tz(timezone).startOf('day').toDate()
        : null
      if (
        roundedNextDate === null ||
        dayjs(roundedNextDate).tz(timezone).subtract(1, 'second').toDate() >
          roundedNow
      ) {
        core.info(
          `The next occurrence for "${issue.title}" is ` +
            `${roundedNextDate?.toISOString()}, which is in the future or there are ` +
            `no future occurrences. Skipping issue creation.`
        )
        continue
      }
      core.info(
        `The next occurrence for "${issue.title}" is ${roundedNextDate.toISOString()}.`
      )

      // Calculate the due date based on the due rule
      let dueDate: Date | null = null
      if (issue.due) {
        dueDate = calculateNextDate(
          issue.due,
          timezone,
          roundedNextDate,
          roundedNextDate
        )
        if (dueDate === null) {
          core.info(
            `The due date for "${issue.title}" could not ` +
              `be calculated. Skipping issue creation.`
          )
          continue
        }
        core.info(
          `The due date for "${issue.title}" is ${dueDate.toISOString()}.`
        )
      } else {
        core.info(
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
        core.info(`Issue creation failed for "${issue.title}".`)
        continue
      } else {
        issueNumbers.push(issueNumber)
        core.info(
          `Issue created successfully for "${issue.title}" as #${issueNumber}.`
        )
      }
    }

    // Set outputs for other workflow steps to use
    core.setOutput('issues', issueNumbers.join(','))
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
