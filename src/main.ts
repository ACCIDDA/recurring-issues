import * as core from '@actions/core'
import { parseConfig } from './parse.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Get inputs defined in action metadata file
    const config: string = core.getInput('config')
    const timezone: string = core.getInput('timezone')

    // Parse the configuration
    const parsed = parseConfig(config)

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
