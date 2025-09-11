import { readFileSync } from 'fs'
import { load } from 'js-yaml'
import * as z from 'zod'

const IssueSchema = z.object({
  title: z.string(),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  schedule: z.string(),
  due: z.string(),
  start: z
    .date()
    .optional()
    .default(() => new Date())
})

const ConfigSchema = z.array(IssueSchema)

/**
 * Parse a configuration string or file path.
 *
 * This function determines if the input string is a path to an existing file.
 * If it is, the file's content is read. Otherwise, the input string is
 * treated as the configuration content itself. The content is then parsed
 * as YAML.
 *
 * @param input The configuration as a string or file path.
 * @returns The parsed configuration object.
 */
export function parseConfig(input: string): z.infer<typeof ConfigSchema> {
  let content: string
  try {
    content = readFileSync(input, 'utf8')
  } catch {
    content = input
  }
  try {
    const yamlContent = load(content)
    return ConfigSchema.parse(yamlContent)
  } catch (e) {
    let message: string
    if (typeof e === 'string') {
      message = e
    } else if (e instanceof Error) {
      message = e.message
    } else {
      message = 'Unknown error'
    }
    throw new Error(
      `Failed to parse configuration: ${message}
Content received:
---
${content}
---`
    )
  }
}
