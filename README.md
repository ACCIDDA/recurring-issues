# Recurring Issues

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

Automatically create GitHub issues on a recurring schedule using human-readable
recurrence rules or RFC5545 RRULE syntax.

> [!CAUTION]
>
> This GitHub action is still under development and API is subject to change
> until a v1 release.

## Features

- **Flexible Scheduling**: Use natural language ("every Monday") or RFC5545
  RRULE syntax.
- **Timezone Support**: Schedule issues in your preferred timezone.
- **Dynamic Date Formatting**: Include formatted dates in issue titles and
  bodies.
- **Separate Due Dates**: Optionally set different due date schedules for issue
  formatting.
- **Full Issue Configuration**: Set labels, assignees, and body content.
- **YAML or Inline Config**: Configure via external file or inline YAML.

## Use Cases

- **Recurring Reminders**: Weekly security review reminders, monthly dependency
  updates.
- **Team Standups**: Daily standup issues in team repositories.
- **Report Deadlines**: Monthly or quarterly report issues with proper due
  dates.
- **Maintenance Tasks**: Regular maintenance windows or deployment freeze
  reminders.
- **Meeting Agendas**: Recurring meeting issues with consistent formatting.

## Usage

### Basic Example

Create a workflow file (e.g., `.github/workflows/recurring-issues.yml`):

```yaml
name: Create Recurring Issues
on:
  schedule:
    # Run at midnight UTC every day
    - cron: '0 0 * * *'
  workflow_dispatch:

permissions:
  issues: write

jobs:
  create-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ACCIDDA/recurring-issues@v0.1.0
        with:
          config: |
            - title: "Weekly Team Sync - [YYYY-MM-DD]"
              body: |
                ## Agenda
                - Review last week's progress
                - Plan for upcoming week

                Meeting Date: [dddd, MMMM D, YYYY]
              labels:
                - meeting
                - team-sync
              assignees:
                - team-lead
              schedule: "every Monday"
```

### Configuration File

For complex configurations, use an external YAML file:

**.github/recurring-issues.yml**:

```yaml
- title: 'Sprint Planning - Sprint Starting [YYYY-MM-DD]'
  body: |
    ## Sprint Goals
    - [ ] Define sprint objectives
    - [ ] Estimate story points
    - [ ] Assign tasks

    Sprint Start: [MMMM D, YYYY]
  labels:
    - sprint-planning
    - planning
  assignees:
    - scrum-master
  schedule: 'every other Monday'

- title: 'Security Review - [YYYY-MM-DD]'
  body: 'Weekly security review for the week of [YYYY-MM-DD]'
  labels:
    - security
    - review
  schedule: 'FREQ=WEEKLY;BYDAY=FR'
  due: 'FREQ=WEEKLY;BYDAY=FR;BYHOUR=17'
```

**Workflow**:

```yaml
- uses: ACCIDDA/recurring-issues@v0.1.0
  with:
    config: .github/recurring-issues.yml
```

### Timezone Example

Schedule issues in a specific timezone:

```yaml
- uses: ACCIDDA/recurring-issues@v0.1.0
  with:
    timezone: 'America/New_York'
    config: |
      - title: "Daily Standup - [YYYY-MM-DD]"
        body: "Standup for [dddd, MMMM D]"
        schedule: "every weekday"
        labels:
          - standup
```

### RFC5545 RRULE Example

For advanced scheduling, use RFC5545 RRULE syntax:

```yaml
- uses: ACCIDDA/recurring-issues@v0.1.0
  with:
    config: |
      - title: "Quarterly Review - Q[Q] [YYYY]"
        body: "Quarterly business review"
        schedule: "FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=1"
        labels:
          - quarterly
          - review
```

### With Separate Due Dates

Create issues on one schedule with due dates on another:

```yaml
- uses: ACCIDDA/recurring-issues@v0.1.0
  with:
    config: |
      - title: "Monthly Report - Due [YYYY-MM-DD]"
        body: |
          Monthly report is due on [MMMM D, YYYY] at 5pm.

          Please submit all updates by the deadline.
        schedule: "every month on the 1st"  # Created on the 1st
        due: "every month on the 15th"      # Due on the 15th
        labels:
          - report
          - monthly
```

In this case the "due" date will be used in formatting the issue title and body
instead of the "schedule" date even though the issue is created using the
"schedule" date.

## Inputs

```yaml
- uses: ACCIDDA/recurring-issues@v0.1.0
  with:
    # GitHub token for creating issues
    # Default: ${{ github.token }}
    token: ''

    # Either a file path or inline YAML string containing issue configurations
    # Required: true
    config: ''

    # Timezone for scheduling (IANA timezone identifier)
    # Default: 'UTC'
    timezone: 'America/New_York'
```

### Input Details

#### `token`

The GitHub token used to create issues. The default `${{ github.token }}` works
for most cases, but you may need a Personal Access Token (PAT) for certain
scenarios.

**Required**: `true` (has default) **Default**: `${{ github.token }}`

#### `config`

Either a file path to a YAML configuration file or an inline YAML string
defining the recurring issues to create.

**Required**: `true` **Format**: YAML (file path or inline string)

**Configuration Schema**:

Each issue configuration supports the following fields:

| Field       | Type     | Required | Description                                              |
| ----------- | -------- | -------- | -------------------------------------------------------- |
| `title`     | string   | yes      | Issue title (supports date tokens)                       |
| `body`      | string   | no       | Issue body content (supports date tokens)                |
| `labels`    | string[] | no       | Array of label names to apply                            |
| `assignees` | string[] | no       | Array of GitHub usernames to assign                      |
| `schedule`  | string   | yes      | Recurrence rule for when to create the issue             |
| `due`       | string   | no       | Recurrence rule for the issue due date                   |
| `start`     | date     | no       | Start date for the recurrence (defaults to current date) |

**Recurrence Rules** (`schedule` and `due`):

Recurrence rules can be specified in two formats:

1. **Human-readable text**: "every Monday", "every other Tuesday", "every
   weekday", "every month on the 15th"
2. **RFC5545 RRULE syntax**: "FREQ=DAILY;INTERVAL=1",
   "FREQ=WEEKLY;BYDAY=MO,WE,FR"

> [!IMPORTANT]
>
> The `schedule` field works at the **day level only**. Do not include times in
> the schedule (e.g., "every Monday at 9am", the 9am portion will not be
> respected). Issues are created when the workflow runs on a day that matches
> the schedule. Times **can** be specified in the `due` field (e.g.,
> "FREQ=DAILY;BYHOUR=17" for 5pm daily).

**Date Tokens**:

Date tokens can be used in `title` and `body` fields and will be replaced with
formatted dates. This action uses [Day.js](https://day.js.org/) for date
formatting. Any format token supported by Day.js can be used by enclosing it in
square brackets.

For the complete list of available format tokens, see the
[Day.js Format documentation](https://day.js.org/docs/en/display/format).

#### `timezone`

The IANA timezone identifier to use for scheduling. This affects when issues are
considered "due" and how date tokens are formatted.

**Required**: `false` **Default**: `UTC` **Examples**: `America/New_York`,
`Europe/London`, `Asia/Tokyo`, `Australia/Sydney`

See the
[IANA timezone database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
for valid identifiers.

## Outputs

### `issues`

A comma-separated list of issue numbers created by this action run.

**Example Usage**:

```yaml
- uses: ACCIDDA/recurring-issues@v0.1.0
  id: recurring-issues
  with:
    config: .github/recurring-issues.yml

- name: Comment on created issues
  if: steps.recurring-issues.outputs.issues != ''
  run: |
    echo "Created issues: ${{ steps.recurring-issues.outputs.issues }}"
```

## Advanced Configuration

### Limiting Recurrence with UNTIL

You can limit how long a recurring issue continues using the `UNTIL` parameter
in RFC5545 syntax:

```yaml
- title: 'Project Status Update'
  schedule: 'FREQ=WEEKLY;BYDAY=FR;UNTIL=20251231T235959Z'
  body: 'Weekly project status (ends Dec 31, 2025)'
```

Or with human-readable text:

```yaml
- title: 'Temporary Weekly Check-in'
  schedule: 'every Friday until December 31, 2025'
  body: 'This recurring issue will stop after the specified date'
```

### Custom Start Dates

By default, recurring issues start from the current date. You can specify a
custom start date:

```yaml
- title: 'Future Recurring Issue'
  schedule: 'every Monday'
  start: 2025-06-01T00:00:00Z
  body: 'This issue series starts on June 1, 2025'
```

### Multiple Issue Types

You can configure multiple different recurring issues in a single workflow:

```yaml
- uses: ACCIDDA/recurring-issues@v0.1.0
  with:
    config: |
      - title: "Daily Standup"
        schedule: "every weekday"
        labels: [standup, daily]

      - title: "Weekly Planning"
        schedule: "every Monday"
        labels: [planning, weekly]

      - title: "Monthly Review"
        schedule: "every month on the 1st"
        labels: [review, monthly]
```

## Workflow Scheduling

The action determines whether to create an issue based on the current date and
the recurrence rule. The `schedule` field operates at the day level, so issues
are created when the workflow runs on a matching day.

**Run the workflow once per day** (or less frequently). Running more than once
per day may result in duplicate issues:

```yaml
on:
  schedule:
    # Run at midnight UTC every day
    - cron: '0 0 * * *'
  # Allow manual triggering for testing
  workflow_dispatch:
```

> [!NOTE]
>
> GitHub Actions scheduled workflows are scheduled using UTC. The workflow
> trigger time is independent of the `timezone` input. The `timezone` parameter
> controls how the action interprets "today's date" when checking if an issue
> should be created.

## Permissions

This action requires `issues: write` permission:

```yaml
permissions:
  issues: write
```

If using a PAT token, ensure the token has the `repo` scope (for private
repositories) or `public_repo` scope (for public repositories).

## Examples from Real Use Cases

### Sprint Planning (Every 2 Weeks)

```yaml
- title: 'Sprint Planning - Sprint [YYYY-MM-DD]'
  body: |
    ## Sprint Planning Meeting

    **Sprint Start**: [YYYY-MM-DD]

    ### Pre-Planning Tasks
    - [ ] Review and refine backlog
    - [ ] Identify dependencies
    - [ ] Review team capacity

    ### During Planning
    - [ ] Define sprint goal
    - [ ] Commit to sprint backlog
    - [ ] Estimate effort
  schedule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO'
  labels:
    - sprint-planning
    - planning
  assignees:
    - product-owner
    - scrum-master
```

### Monthly Dependency Updates

```yaml
- title: 'Dependency Updates - [MMMM YYYY]'
  body: |
    Time for monthly dependency updates!

    ## Tasks
    - [ ] Run `npm audit` and review security vulnerabilities
    - [ ] Update minor versions: `npm update`
    - [ ] Check for major version updates
    - [ ] Test updated dependencies
    - [ ] Create PR with updates

    Due: [YYYY-MM-DD]
  schedule: 'every month on the 1st'
  due: 'every month on the 7th'
  labels:
    - dependencies
    - maintenance
  assignees:
    - tech-lead
```

### Weekly Security Review

```yaml
- title: 'Security Review - Week of [YYYY-MM-DD]'
  body: |
    ## Weekly Security Checklist

    - [ ] Review Dependabot alerts
    - [ ] Check CodeQL scan results
    - [ ] Review access logs for anomalies
    - [ ] Verify backup integrity
    - [ ] Update security documentation

    **Review Date**: [dddd, MMMM D, YYYY]
  schedule: 'every Friday'
  labels:
    - security
    - review
  assignees:
    - security-team
```

### Quarterly Business Review

```yaml
- title: 'Quarterly Business Review - Q[Q] [YYYY]'
  body: |
    ## Q[Q] [YYYY] Business Review

    Time to review the quarter's performance and plan ahead.

    ### Agenda
    - Financial review
    - Product metrics
    - Team performance
    - Next quarter planning

    **Due**: [MMMM D, YYYY]
  schedule: 'FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=1'
  due: 'FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=15'
  labels:
    - quarterly-review
    - business
```

## Troubleshooting

### Issues aren't being created

1. **Check workflow runs**: Verify the workflow is running in the Actions tab.
2. **Verify schedule**: Use `workflow_dispatch` to manually trigger and test.
3. **Check logs**: Review action logs for skipped issues and reasons.
4. **Verify permissions**: Ensure the workflow has `issues: write` permission.
5. **Check timezone**: Verify the timezone setting matches your expectations.

### Issues are created at the wrong time

- The action creates issues when the "next occurrence" date matches the current
  date (floored to midnight in the specified timezone).
- Adjust the workflow schedule or timezone setting as needed.
- Use `workflow_dispatch` to test without waiting for scheduled runs.

### Date tokens aren't formatting correctly

- Date tokens are case-sensitive, i.e. `[DD]` and `[dd]` produce different
  formats.
- Tokens must be enclosed in square brackets: `[YYYY-MM-DD]`.
- Date formatting uses the timezone specified in the action input.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## Author

[@TimothyWillard](https://github.com/TimothyWillard)
