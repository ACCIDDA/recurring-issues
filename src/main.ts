import * as core from '@actions/core'
import { parseConfig } from './parse.js'
import { calculateNextDate } from './rules.js'

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
    const config: string = core.getInput('config')
    const timezone: string = core.getInput('timezone')

    // Parse the configuration
    const parsed = parseConfig(config)

    // Loop through each issue configuration and log details
    parsed.forEach((issue, index) => {
      // core.info(`Issue ${index + 1}:`)
      // core.info(`  Title: ${issue.title}`)
      // core.info(`  Schedule: ${issue.schedule}`)
      // core.info(`  Due: ${issue.due}`)
      // core.info(`  Start: ${issue.start?.toISOString()}`)
      // if (issue.body) core.info(`  Body: ${issue.body}`)
      // if (issue.labels) core.info(`  Labels: ${issue.labels.join(', ')}`)
      // if (issue.assignees)
      //  core.info(`  Assignees: ${issue.assignees.join(', ')}`)

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
        return
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
        return
      }
      core.info(
        `The due date for "${issue.title}" is ${dueDate.toISOString()}.`
      )
    })

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
