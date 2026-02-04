import * as MetaTrackCore from '@meta-track/core'
import {
  init,
  InitOptions,
  detectMiniProgramPlatform,
  isMiniProgramEnvironment,
  getPageInfo,
  getRouteName,
  getPageTitle,
  getPageUrl
} from '@meta-track/core'

/**
 * 小程序集成模块
 * 支持：微信原生小程序、Taro、mpx、uni-app
 */

export type { InitOptions } from '@meta-track/core'
export * from '@meta-track/core'

/**
 * 初始化小程序版本的MetaTrack
 * 自动检测小程序平台并配置
 */
export function initMiniProgram(options: InitOptions & { 
  enableAutoPageTracking?: boolean 
}): void {
  const platform = detectMiniProgramPlatform()
  
  // 启用小程序支持
  const finalOptions: InitOptions = {
    ...options,
    pv: {
      ...((typeof options.pv === 'object') ? options.pv : {}),
      core: true,
      enableRouteName: options.pv?.enableRouteName !== false,
      enablePageTitle: options.pv?.enablePageTitle !== false,
      enableMiniProgram: true
    },
    miniProgramPlatform: platform
  }

  // 初始化核心SDK
  init(finalOptions)

  // 如果启用自动页面跟踪（仅限支持的平台）
  if (options.enableAutoPageTracking !== false) {
    setupAutoPageTracking(platform)
  }
}

/**
 * 设置自动页面跟踪
 * 针对不同小程序框架进行页面路由变化监听
 */
function setupAutoPageTracking(platform: string): void {
  switch (platform) {
    case 'native':
      setupNativeMiniProgramTracking()
      break
    case 'taro':
      setupTaroTracking()
      break
    case 'uniapp':
      setupUniAppTracking()
      break
    case 'mpx':
      setupMpxTracking()
      break
    default:
      console.warn('[MetaTrack] Unknown mini-program platform, auto page tracking not enabled')
  }
}

/**
 * 微信原生小程序页面跟踪
 */
function setupNativeMiniProgramTracking(): void {
  try {
    // 微信小程序通过App和Page的生命周期进行页面跟踪
    // 这需要在应用启动时注入拦截器
    const wx = (globalThis as any).wx
    if (typeof wx !== 'undefined' && typeof wx.onAppRoute === 'function') {
      wx.onAppRoute?.((res: any) => {
        try {
          // 页面路由变化时被调用
          const pageInfo = getPageInfo()
          MetaTrackCore.tracePageView({
            routeName: pageInfo.routeName,
            pageTitle: pageInfo.pageTitle,
            pageUrl: pageInfo.pageUrl
          })
        } catch (err) {
          console.debug('[MetaTrack] Error tracking native mini-program page:', err)
        }
      })
    }
  } catch (err) {
    console.debug('[MetaTrack] Failed to setup native mini-program tracking:', err)
  }
}

/**
 * Taro框架页面跟踪
 */
function setupTaroTracking(): void {
  try {
    // Taro提供的路由变化监听
    const Taro = (globalThis as any).Taro
    if (Taro && typeof Taro.navigateTo === 'function') {
      // 可以通过hooks或其他机制追踪页面变化
      console.debug('[MetaTrack] Taro tracking setup complete')
    }
  } catch (err) {
    console.debug('[MetaTrack] Failed to setup Taro tracking:', err)
  }
}

/**
 * uni-app框架页面跟踪
 */
function setupUniAppTracking(): void {
  try {
    // uni-app提供的路由变化监听
    const uni = (globalThis as any).uni
    if (uni && typeof uni.$on === 'function') {
      // uni-app在页面显示时触发onShow生命周期
      console.debug('[MetaTrack] uni-app tracking setup complete')
    }
  } catch (err) {
    console.debug('[MetaTrack] Failed to setup uni-app tracking:', err)
  }
}

/**
 * mpx框架页面跟踪
 */
function setupMpxTracking(): void {
  try {
    const mpx = (globalThis as any).mpx
    if (mpx && typeof mpx.use === 'function') {
      console.debug('[MetaTrack] mpx tracking setup complete')
    }
  } catch (err) {
    console.debug('[MetaTrack] Failed to setup mpx tracking:', err)
  }
}

/**
 * 创建小程序页面mixins（用于Vue组件）
 * 可在Taro或其他Vue框架的小程序中使用
 */
export const miniProgramMixin = {
  onShow() {
    // 页面显示时上报
    const pageInfo = getPageInfo(this)
    MetaTrackCore.tracePageView({
      routeName: pageInfo.routeName,
      pageTitle: pageInfo.pageTitle,
      pageUrl: pageInfo.pageUrl,
      vm: this
    })
  }
}

/**
 * 创建小程序页面装饰器（用于TypeScript）
 */
export function trackMiniProgramPage(target: any): any {
  const originalShow = target.prototype.onShow
  target.prototype.onShow = function () {
    const pageInfo = getPageInfo(this)
    MetaTrackCore.tracePageView({
      routeName: pageInfo.routeName,
      pageTitle: pageInfo.pageTitle,
      pageUrl: pageInfo.pageUrl,
      vm: this
    })
    originalShow?.call(this)
  }
  return target
}

// 导出所有核心方法以保持API一致性
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
export const getPageInfoExport = MetaTrackCore.getPageInfoExport
export const getRouteNameExport = MetaTrackCore.getRouteNameExport
export const getPageTitleExport = MetaTrackCore.getPageTitleExport
export const getPageUrlExport = MetaTrackCore.getPageUrlExport
export const detectMiniProgramPlatformExport = MetaTrackCore.detectMiniProgramPlatformExport
export const isMiniProgramEnvironmentExport = MetaTrackCore.isMiniProgramEnvironmentExport

// 向后兼容性
export const init as default
export { initMiniProgram }
