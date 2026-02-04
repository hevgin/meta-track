import { addPluginTemplate, defineNuxtModule } from '@nuxt/kit'
import * as MetaTrackCore from '@meta-track/core'
import type { InitOptions } from '@meta-track/core'

// Polyfill requestAnimationFrame for SSR
if (typeof global !== 'undefined' && !global.requestAnimationFrame) {
  ;(global as any).requestAnimationFrame = (callback: any) =>
    setTimeout(callback, 0)
}
if (typeof global !== 'undefined' && !global.cancelAnimationFrame) {
  ;(global as any).cancelAnimationFrame = (id: any) => clearTimeout(id)
}
if (typeof global !== 'undefined' && !global.window) {
  ;(global as any).window = global
}

export type ModuleOptions = InitOptions

function toJS(value: any): string {
  if (value === null) return 'null'

  const type = typeof value
  if (type === 'string') return JSON.stringify(value)
  if (type === 'number' || type === 'boolean') return String(value)
  if (type === 'undefined') return 'undefined'
  if (type === 'function') return value.toString()

  if (value instanceof RegExp) return value.toString()
  if (Array.isArray(value)) return `[${value.map(toJS).join(',')}]`

  if (type === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined)
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${toJS(v)}`)
      .join(',')}}`
  }

  return 'undefined'
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@meta-track/nuxt',
    configKey: 'metaTrack'
  },
  defaults: {} as ModuleOptions,
  setup(options: ModuleOptions, nuxt: any) {
    addPluginTemplate({
      filename: 'meta-track.client.ts',
      getContents: () => {
        return [
          'import { defineNuxtPlugin } from "#app";',
          'import { init } from "@meta-track/core";',
          '',
          `const options = ${toJS(options)};`,
          '',
          'export default defineNuxtPlugin(() => {',
          '  init(options);',
          '});',
          ''
        ].join('\n')
      }
    })
  }
}) as any

export * from '@meta-track/core'

export const init = MetaTrackCore.init
export const destroyTracing = MetaTrackCore.destroyTracing
export const options = MetaTrackCore.options
export const traceError = MetaTrackCore.traceError
export const tracePerformance = MetaTrackCore.tracePerformance
export const traceCustomEvent = MetaTrackCore.traceCustomEvent
export const tracePageView = MetaTrackCore.tracePageView
export const unzipRecordscreen = MetaTrackCore.unzipRecordscreen
export const intersectionObserver = MetaTrackCore.intersectionObserver
export const intersectionUnobserve = MetaTrackCore.intersectionUnobserve
export const intersectionDisconnect = MetaTrackCore.intersectionDisconnect
export const beforePushEventList = MetaTrackCore.beforePushEventList
export const beforeSendData = MetaTrackCore.beforeSendData
export const afterSendData = MetaTrackCore.afterSendData
export const sendLocal = MetaTrackCore.sendLocal
export const setLocalizationOverFlow = MetaTrackCore.setLocalizationOverFlow
export const getFirstScreen = MetaTrackCore.getFirstScreen
export const getIPs = MetaTrackCore.getIPs
export const getOptions = MetaTrackCore.getOptions
export const logError = MetaTrackCore.logError
export const parseError = MetaTrackCore.parseError
export const SENDID = MetaTrackCore.SENDID
