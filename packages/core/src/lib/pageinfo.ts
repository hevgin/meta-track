import type { AnyObj } from '../types'
import { options } from './options'
import { _global } from '../utils/global'

/**
 * 页面信息采集器
 * 用于采集routeName、pageTitle、pageUrl等信息
 */

export interface PageInfo {
  routeName?: string
  pageTitle?: string
  pageUrl?: string
}

/**
 * 获取页面信息
 * 支持Vue、React、小程序等框架
 */
export function getPageInfo(vm?: any): PageInfo {
  const pageInfo: PageInfo = {}

  // 获取路由名称
  if (options.value.pv.enableRouteName || options.value.getRouteNameFn) {
    pageInfo.routeName = getRouteName(vm)
  }

  // 获取页面标题
  if (options.value.pv.enablePageTitle || options.value.getPageTitleFn) {
    pageInfo.pageTitle = getPageTitle(vm)
  }

  // 获取页面URL
  if (options.value.getPageUrlFn) {
    pageInfo.pageUrl = options.value.getPageUrlFn(vm)
  }

  return pageInfo
}

/**
 * 获取路由名称
 * 支持多个框架的路由名称获取
 */
export function getRouteName(vm?: any): string | undefined {
  // 如果用户提供了自定义获取函数，优先使用
  if (options.value.getRouteNameFn) {
    try {
      return options.value.getRouteNameFn(vm)
    } catch (err) {
      console.error('[MetaTrack] Error in getRouteNameFn:', err)
    }
  }

  // 尝试从Vue Router获取
  if (vm?.$route) {
    // Vue Router
    return vm.$route.name || vm.$route.path
  }

  if (vm?.name) {
    // Vue组件名称
    return vm.name
  }

  // 尝试从小程序获取
  if (_global.__wxRoute || _global.getCurrentPages) {
    // 微信小程序
    try {
      const pages = _global.getCurrentPages?.()
      if (pages && pages.length > 0) {
        return pages[pages.length - 1].route || ''
      }
    } catch (err) {
      console.error('[MetaTrack] Error getting mini-program route:', err)
    }
  }

  // 尝试从Taro获取
  if (vm?.$router?.currentRoute?.name) {
    return vm.$router.currentRoute.name
  }

  return undefined
}

/**
 * 获取页面标题
 * 支持多个框架和小程序的页面标题获取
 */
export function getPageTitle(vm?: any): string {
  // 如果用户提供了自定义获取函数，优先使用
  if (options.value.getPageTitleFn) {
    try {
      return options.value.getPageTitleFn(vm)
    } catch (err) {
      console.error('[MetaTrack] Error in getPageTitleFn:', err)
      // 降级处理
    }
  }

  // 首先尝试从document.title获取
  try {
    if (typeof _global.document !== 'undefined' && _global.document.title) {
      return _global.document.title
    }
  } catch (err) {
    console.debug('[MetaTrack] Error accessing document.title:', err)
  }

  // 尝试从Vue组件的meta获取
  if (vm?.$route?.meta?.title) {
    const title = vm.$route.meta.title
    return typeof title === 'string' ? title : ''
  }

  // 尝试从小程序的页面实例获取
  if (typeof _global.getCurrentPages === 'function') {
    try {
      const pages = _global.getCurrentPages()
      if (Array.isArray(pages) && pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        // 微信小程序通常通过data中的title或wx.setNavigationBarTitle设置标题
        return currentPage?.data?.title || currentPage?.title || ''
      }
    } catch (err) {
      console.debug('[MetaTrack] Error getting mini-program title:', err)
    }
  }

  // 尝试从组件自身的pageTitle属性获取
  if (vm?.pageTitle && typeof vm.pageTitle === 'string') {
    return vm.pageTitle
  }

  return ''
}

/**
 * 获取页面URL
 * 支持Web和小程序
 */
export function getPageUrl(vm?: any): string {
  // 如果用户提供了自定义获取函数，优先使用
  if (options.value.getPageUrlFn) {
    try {
      return options.value.getPageUrlFn(vm)
    } catch (err) {
      console.error('[MetaTrack] Error in getPageUrlFn:', err)
      // 降级处理
    }
  }

  // Web应用
  try {
    if (typeof _global.location !== 'undefined' && _global.location.href) {
      return _global.location.href
    }
  } catch (err) {
    console.debug('[MetaTrack] Error accessing location:', err)
  }

  // 小程序
  if (typeof _global.getCurrentPages === 'function') {
    try {
      const pages = _global.getCurrentPages()
      if (Array.isArray(pages) && pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        return currentPage?.route || currentPage?.__route__ || ''
      }
    } catch (err) {
      console.debug('[MetaTrack] Error getting mini-program URL:', err)
    }
  }

  return ''
}

/**
 * 检测小程序平台
 */
export function detectMiniProgramPlatform(): string {
  // 微信小程序
  if (typeof _global.wx !== 'undefined' && _global.wx.getSystemInfo) {
    return 'native'
  }

  // Taro
  if (typeof _global.Taro !== 'undefined') {
    return 'taro'
  }

  // uni-app
  if (typeof _global.uni !== 'undefined') {
    return 'uniapp'
  }

  // mpx
  if (typeof _global.mpx !== 'undefined') {
    return 'mpx'
  }

  return 'unknown'
}

/**
 * 判断是否在小程序环境中运行
 */
export function isMiniProgramEnvironment(): boolean {
  return detectMiniProgramPlatform() !== 'unknown'
}
