import { join } from 'path'
import { parseConfig } from '../src/parse'

describe('parseConfig', () => {
  it('should parse a valid YAML string configuration', () => {
    const configString = `
- title: "Test Issue 1"
  schedule: "0 0 * * *"
  due: "0 1 * * *"
- title: "Test Issue 2"
  body: "This is a test body."
  labels: ["bug", "enhancement"]
  assignees: ["user1"]
  schedule: "0 12 * * *"
  due: "0 13 * * *"
  start: 2025-07-01
`
    const parsed = parseConfig(configString)
    expect(parsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Test Issue 1',
          schedule: '0 0 * * *',
          due: '0 1 * * *',
          start: expect.any(Date)
        }),
        expect.objectContaining({
          title: 'Test Issue 2',
          body: 'This is a test body.',
          labels: ['bug', 'enhancement'],
          assignees: ['user1'],
          schedule: '0 12 * * *',
          due: '0 13 * * *',
          start: new Date('2025-07-01')
        })
      ])
    )
  })

  it('should parse a valid YAML file configuration', () => {
    const parsed = parseConfig(join('__fixtures__', 'config.yaml'))
    expect(parsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'File Issue',
          schedule: '0 0 * * *',
          due: '0 1 * * *',
          start: expect.any(Date)
        })
      ])
    )
  })

  it('should throw an error for an invalid file path', () => {
    expect(() => parseConfig('nonexistent.yaml')).toThrow(
      /Failed to parse configuration: .*Content received:\n---\nnonexistent.yaml\n---/s
    )
  })

  it('should throw an error for an invalid YAML string', () => {
    const configString = `
{
  title: "Invalid Issue",
  schedule: "0 0 * * *"
}
`
    expect(() => parseConfig(configString)).toThrow(
      /Failed to parse configuration: .*Content received:\n---.*---/s
    )
  })

  it('should throw an error for an invalid configuration YAML string', () => {
    const configString = `
- title: "Invalid Issue"
`
    expect(() => parseConfig(configString)).toThrow()
  })
})
