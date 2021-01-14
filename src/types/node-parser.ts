import {SerializableOrJSHandle} from 'puppeteer'
import {ParsedOutput} from './index'

export type NodeParser = (...args: SerializableOrJSHandle[]) => ParsedOutput