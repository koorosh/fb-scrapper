export * from './node-parser'
export * from './json-type'

export type ParsedOutput = string | Array<string>
export type Predicate<T> = (value: T, index?: number) => boolean
export type Parser = (url: string) => Promise<Array<ParsedOutput>>