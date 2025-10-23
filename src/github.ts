import * as core from '@actions/core'
import * as github from '@actions/github'
import * as z from 'zod'
import { IssueSchema } from './parse.js'
import { formatDateString } from './format.js'

interface CreateIssueParams {
  owner: string
  repo: string
  title: string
  body?: string
  labels?: string[]
  assignees?: string[]
  // This allows the object to have other keys required by RequestParameters
  [key: string]: unknown
}

export function createIssue(
  issue: z.infer<typeof IssueSchema>,
  dueDate: Date,
  timezone: string,
  octokit: ReturnType<typeof github.getOctokit>
): Promise<number | null> {
  let issueData: CreateIssueParams = {
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
  if (issue.labels) {
    issueData = {
      ...issueData,
      labels: issue.labels
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
    .then(({ data: resp }) => {
      core.info(`Created issue #${resp.number}: ${resp.html_url}`)
      return resp.number
    })
    .catch((error) => {
      core.error(`Failed to create issue "${issue.title}": ${error.message}`)
      return null
    })
  return issueNumber
}
