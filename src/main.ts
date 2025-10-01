import * as core from '@actions/core'
import * as github from '@actions/github'
import { formatDateString } from './format.js'
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
    const token: string = core.getInput('token')
    const config: string = core.getInput('config')
    const timezone: string = core.getInput('timezone')

    // Parse the configuration
    const parsed = parseConfig(config)

    // Get an octokit client for GitHub API requests
    const octokit = github.getOctokit(token)

    // Loop through each issue configuration and log details
    parsed.forEach((issue, index) => {
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

      // Create the issue on GitHub
      let issueData = {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        title: formatDateString(issue.title, dueDate, timezone)
      }
      if (issue.body) {
        issueData = {
          ...issueData,
          body: formatDateString(issue.body, dueDate, timezone)
        }
      }
      if (issue.assignees) {
        issueData = {
          ...issueData,
          assignees: issue.assignees
        }
      }
      const issueNumber = octokit.rest.issues
        .create(issueData)
        .then(({ data: issueResp }) => {
          core.info(`Created issue #${issueResp.number}: ${issueResp.html_url}`)
          if (issue.labels) {
            octokit.rest.issues
              .addLabels({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                issue_number: issueResp.number,
                labels: issue.labels
              })
              .then(() => {
                core.info(
                  `Added labels to issue #${issueResp.number}: ${issue.labels?.join(
                    ', '
                  )}`
                )
              })
              .catch((error) => {
                core.error(
                  `Failed to add labels to issue #${issueResp.number}: ${error.message}`
                )
              })
          }
          return issueResp.number
        })
        .catch((error) => {
          core.error(
            `Failed to create issue "${issue.title}": ${error.message}`
          )
        })
      return issueNumber
    })

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
