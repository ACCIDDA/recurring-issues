// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'

const isDependencyWarning = (warning) =>
  Boolean(
    warning.id?.includes('/node_modules/') ||
    warning.ids?.every((id) => id.includes('/node_modules/'))
  )

const ignoredDependencyWarnings = new Set([
  'CIRCULAR_DEPENDENCY',
  'THIS_IS_UNDEFINED'
])

const onwarn = (warning, defaultHandler) => {
  if (
    warning.code &&
    ignoredDependencyWarnings.has(warning.code) &&
    isDependencyWarning(warning)
  ) {
    return
  }

  defaultHandler(warning)
}

const config = defineConfig({
  input: 'src/index.ts',
  onwarn,
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [typescript(), nodeResolve({ preferBuiltins: true }), commonjs()]
})

export default config
