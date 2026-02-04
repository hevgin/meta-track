import {
  useEffect,
  createContext,
  useContext,
  ReactNode,
  createElement,
  useCallback
} from 'react'
import type { InitOptions } from '@meta-track/core'
import * as MetaTrackCore from '@meta-track/core'
import { useLocation } from 'react-router-dom'

export type { InitOptions } from '@meta-track/core'

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
export const getPageInfo = MetaTrackCore.getPageInfo

const MetaTrackContext = createContext<boolean>(false)

export interface MetaTrackProviderProps {
  options: InitOptions
  children: ReactNode
  enableRouterTracking?: boolean
}

export const MetaTrackProvider = ({
  options,
  children,
  enableRouterTracking = true
}: MetaTrackProviderProps) => {
  useEffect(() => {
    MetaTrackCore.init(options)
  }, [options])

  return createElement(MetaTrackContext.Provider, { value: true }, children)
}

/**
 * React Router V6 整合Hook
 * 用于在React Router V6中自动跟踪路由变化
 */
export const useMetaTrackRouter = () => {
  let location: any
  try {
    location = useLocation()
  } catch (err) {
    // React Router V6 未安装或不在Router内
    console.debug('[MetaTrack] useLocation hook not available, skipping router integration')
    return
  }
  
  useEffect(() => {
    if (!location) return
    
    // 路由变化时上报PV数据
    setTimeout(() => {
      try {
        const pageUrl = location.pathname + (location.search || '')
        const pageTitle = typeof document !== 'undefined' ? document.title : ''
        
        MetaTrackCore.tracePageView?.({
          pageUrl,
          pageTitle
        })
      } catch (err) {
        console.debug('[MetaTrack] Error tracking route change:', err)
      }
    }, 17)
  }, [location])
}

export const useMetaTrack = () => {
  return useContext(MetaTrackContext)
}

// 保留向后兼容性
export const WebTracingProvider = MetaTrackProvider
export const useWebTracing = useMetaTrack
