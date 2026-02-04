import * as MetaTrackCore from '@meta-track/core'
import {
  init,
  InitOptions,
  traceError,
  logError,
  parseError,
  SENDID,
  getPageInfo,
  tracePageView as coreTracePageView
} from '@meta-track/core'

function install(Vue: any, options: InitOptions) {
  const handler = Vue.config.errorHandler
  Vue.config.errorHandler = function (err: Error, vm: any, info: string): void {
    // const match = err.stack!.match(/(?<=http:\/\/.*:\d+\/).*:\d+:\d+/)
    // const position = match ? match[0] : ''
    // const line = position.split(':')[1] // 行
    // const col = position.split(':')[2] // 列
    // traceError({
    //   eventId: err.name,
    //   errMessage: err.message,
    //   line,
    //   col
    // })

    logError(err)
    const errorInfo = { eventId: SENDID.CODE, ...parseError(err) }
    traceError(errorInfo)
    if (handler) handler.apply(null, [err, vm, info])
  }
  
  // 如果Vue应用有Router，自动设置路由监听
  if (Vue.$router || Vue.prototype.$router) {
    const router = Vue.$router || Vue.prototype.$router
    setupRouterTracking(router, options)
  }
  
  init(options)
}

/**
 * 设置Vue Router路由变化跟踪（Vue2）
 */
function setupRouterTracking(router: any, options: InitOptions): void {
  router.afterEach((to: any, from: any) => {
    // 延迟以确保DOM已更新，页面标题已改变
    setTimeout(() => {
      const pageInfo = getPageInfo()
      coreTracePageView({
        routeName: to.name || to.path,
        pageTitle: to.meta?.title || document.title,
        pageUrl: to.fullPath
      })
    }, 17)
  })
}

/**
 * 在外部手动设置Vue Router跟踪（用于动态创建的路由）
 */
export function useMetaTrackRouter(router: any) {
  setupRouterTracking(router, {} as InitOptions)
}

export default { install }
export * from '@meta-track/core'

export const destroyTracing = MetaTrackCore.destroyTracing
export const options = MetaTrackCore.options
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
export const getPageInfo = MetaTrackCore.getPageInfo
