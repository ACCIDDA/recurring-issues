import * as core from '@actions/core'
import * as github from '@actions/github'
import { parseConfig } from './parse.js'
import { calculateNextDate } from './rules.js'
import { createIssue } from './github.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Set a consistent "now" timestamp for the action run
    const now = new Date()
    core.info(`Action started at: ${now.toISOString()}`)

    // Get inputs defined in action metadata file
    const token: string = core.getInput('token')
    const config: string = core.getInput('config')
    const timezone: string = core.getInput('timezone')

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
      const nextDate = calculateNextDate(
        issue.schedule,
        timezone,
        issue.start || new Date(),
        now
      )
      if (nextDate === null || nextDate > now) {
        core.info(
          `The next occurrence for "${issue.title}" is ${nextDate?.toISOString()}, ` +
            `which is in the future or there are no future occurrences. ` +
            `Skipping issue creation.`
        )
        continue
      }
      core.info(
        `The next occurrence for "${issue.title}" is ${nextDate.toISOString()}.`
      )

      // Calculate the due date based on the due rule
      const dueDate = calculateNextDate(issue.due, timezone, nextDate, now)
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

      // Create the issue on GitHub
      const issueNumber = await createIssue(issue, dueDate, timezone, octokit)
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
