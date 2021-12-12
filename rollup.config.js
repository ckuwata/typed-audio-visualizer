import vue from 'rollup-plugin-vue'
import commonjs from 'rollup-plugin-commonjs'
import ts from "rollup-plugin-typescript2"
export default [
  {
    input: 'src/index.ts',
    output: {
      format: 'cjs',
      dir: "dist",
    },
    external: ['vue'],
    plugins: [
      ts({
        tsconfig: 'tsconfig.json',
        experimentalDecorators: true,
        module: 'es2015',
        declaration: true,
        rootDir: "src",
        declarationDir: "dist",
        objectHashIgnoreUnknownHack: true
      }),
      commonjs(),
      vue({
          css: true,
          compileTemplate: true,
          needMap: false,
      }),
    ]
  },
]