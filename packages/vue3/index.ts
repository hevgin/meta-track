import * as MetaTrackCore from '@meta-track/core'
import { init, InitOptions, getPageInfo, tracePageView as coreTracePageView } from '@meta-track/core'

function install(app: any, options: InitOptions) {
  init(options)
  
  // 如果应用有vue-router，自动设置路由监听
  if (app.config?.globalProperties?.$router) {
    try {
      setupRouterTracking(app.config.globalProperties.$router, options)
    } catch (err) {
      console.warn('[MetaTrack] Failed to setup Vue Router tracking:', err)
    }
  }
}

/**
 * 设置Vue Router路由变化跟踪
 */
function setupRouterTracking(router: any, options: InitOptions): void {
  if (!router || typeof router.afterEach !== 'function') {
    console.warn('[MetaTrack] Invalid router instance provided')
    return
  }
  
  // 在路由变化完成后记录PV数据
  router.afterEach?.((to: any, from: any) => {
    // 延迟以确保DOM已更新，页面标题已改变
    setTimeout(() => {
      try {
        const pageInfo = getPageInfo()
        const pageTitle = 
          (typeof to?.meta?.title === 'string' ? to.meta.title : '') || 
          (typeof document !== 'undefined' ? document.title : '')
        
        coreTracePageView({
          routeName: to?.name || to?.path,
          pageTitle,
          pageUrl: to?.fullPath
        })
      } catch (err) {
        console.debug('[MetaTrack] Error tracking route change:', err)
      }
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
export const getPageInfo = MetaTrackCore.getPageInfo
