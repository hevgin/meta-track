# @meta-track/mini-program

微信小程序、Taro、mpx、uni-app 等多平台小程序监控埋点SDK。

支持自动采集路由名称、页面标题、页面URL等信息，提供【 埋点、行为、性能、异常、请求、资源、路由、曝光、录屏 】监控手段。

## 支持的平台

- ✅ 微信原生小程序（Native WeChat Mini Program）
- ✅ Taro 框架
- ✅ uni-app 框架
- ✅ mpx 框架

## 安装

```bash
npm install @meta-track/mini-program
# 或
pnpm add @meta-track/mini-program
# 或
yarn add @meta-track/mini-program
```

## 快速开始

### 微信原生小程序

在 `app.js` 或 `app.ts` 中初始化：

```javascript
import { initMiniProgram } from '@meta-track/mini-program'

initMiniProgram({
  dsn: 'https://your-server.com/api/tracking',
  appName: 'MyApp',
  appCode: 'my_app',
  appVersion: '1.0.0',
  pv: {
    core: true,
    enableRouteName: true,
    enablePageTitle: true
  }
})
```

在页面中使用 mixin 自动跟踪：

```javascript
import { miniProgramMixin } from '@meta-track/mini-program'

Page({
  mixins: [miniProgramMixin],
  data: {
    title: '首页'
  }
})
```

### Taro 框架

在应用入口文件中初始化：

```typescript
import { initMiniProgram } from '@meta-track/mini-program'

initMiniProgram({
  dsn: 'https://your-server.com/api/tracking',
  appName: 'MyApp',
  appCode: 'my_app',
  appVersion: '1.0.0',
  pv: {
    core: true,
    enableRouteName: true,
    enablePageTitle: true
  },
  enableAutoPageTracking: true
})
```

在页面组件中使用：

```typescript
import { tracePageView } from '@meta-track/mini-program'

export default class Index extends Component {
  componentDidShow() {
    // 页面显示时自动上报
    tracePageView({
      routeName: 'index',
      pageTitle: '首页'
    })
  }
}
```

### uni-app 框架

在 `main.js` 中初始化：

```javascript
import { initMiniProgram } from '@meta-track/mini-program'

initMiniProgram({
  dsn: 'https://your-server.com/api/tracking',
  appName: 'MyApp',
  appCode: 'my_app',
  appVersion: '1.0.0',
  pv: {
    core: true,
    enableRouteName: true,
    enablePageTitle: true
  }
})
```

在页面组件中使用：

```vue
<template>
  <view class="container">
    <!-- 页面内容 -->
  </view>
</template>

<script>
import { miniProgramMixin } from '@meta-track/mini-program'

export default {
  mixins: [miniProgramMixin],
  data() {
    return {
      title: '首页'
    }
  },
  onShow() {
    // 这里会自动调用miniProgramMixin中的onShow
    console.log('页面显示')
  }
}
</script>
```

### mpx 框架

在应用入口初始化：

```javascript
import { initMiniProgram } from '@meta-track/mini-program'

initMiniProgram({
  dsn: 'https://your-server.com/api/tracking',
  appName: 'MyApp',
  appCode: 'my_app',
  appVersion: '1.0.0',
  pv: {
    core: true,
    enableRouteName: true,
    enablePageTitle: true
  }
})
```

## API 文档

### initMiniProgram(options)

初始化小程序监控SDK。

**参数：**

- `options: InitOptions & { enableAutoPageTracking?: boolean }` - 配置选项
  - `enableAutoPageTracking?: boolean` - 是否启用自动页面跟踪，默认为 `true`

**示例：**

```javascript
initMiniProgram({
  dsn: 'https://your-server.com/api/tracking',
  appName: 'MyApp',
  appCode: 'my_app',
  appVersion: '1.0.0',
  userUuid: 'user123',
  debug: true,
  pv: {
    core: true,
    enableRouteName: true,
    enablePageTitle: true
  },
  performance: {
    core: true
  },
  error: {
    core: true
  },
  event: {
    core: true
  }
})
```

### miniProgramMixin

Vue 组件 mixin，用于自动跟踪页面显示事件。

**示例：**

```javascript
import { miniProgramMixin } from '@meta-track/mini-program'

export default {
  mixins: [miniProgramMixin],
  // 其他选项...
}
```

### trackMiniProgramPage(target)

TypeScript 装饰器，用于自动跟踪页面显示事件。

**示例：**

```typescript
import { trackMiniProgramPage } from '@meta-track/mini-program'

@trackMiniProgramPage
class MyPage {
  onShow() {
    console.log('页面显示')
  }
}
```

### getPageInfo(vm?)

获取当前页面信息。

**参数：**

- `vm?: any` - 组件实例（可选）

**返回值：**

- `PageInfo` 对象，包含：
  - `routeName?: string` - 路由名称
  - `pageTitle?: string` - 页面标题
  - `pageUrl?: string` - 页面URL

**示例：**

```javascript
import { getPageInfo } from '@meta-track/mini-program'

const pageInfo = getPageInfo()
console.log(pageInfo.routeName, pageInfo.pageTitle)
```

### detectMiniProgramPlatform()

检测当前运行的小程序平台。

**返回值：**

- `string` - 平台名称：`'native'` | `'taro'` | `'mpx'` | `'uniapp'` | `'unknown'`

**示例：**

```javascript
import { detectMiniProgramPlatform } from '@meta-track/mini-program'

const platform = detectMiniProgramPlatform()
if (platform === 'native') {
  console.log('运行在微信原生小程序环境')
}
```

### isMiniProgramEnvironment()

判断是否在小程序环境中运行。

**返回值：**

- `boolean` - 是否在小程序环境中

**示例：**

```javascript
import { isMiniProgramEnvironment } from '@meta-track/mini-program'

if (isMiniProgramEnvironment()) {
  console.log('当前在小程序环境中运行')
}
```

## 配置选项

### InitOptions

```typescript
interface InitOptions {
  // 必填
  dsn: string                              // 数据上报地址
  appName: string                          // 应用名称
  appCode: string                          // 应用代码
  appVersion: string                       // 应用版本
  
  // 可选
  userUuid?: string                        // 用户ID
  debug?: boolean                          // 是否启用调试模式
  
  // 页面浏览监控配置
  pv?: {
    core?: boolean                         // 是否启用PV监控
    enableRouteName?: boolean              // 是否采集路由名称
    enablePageTitle?: boolean              // 是否采集页面标题
    enableMiniProgram?: boolean            // 是否启用小程序支持
  }
  
  // 性能监控配置
  performance?: {
    core?: boolean                         // 是否启用性能监控
    firstResource?: boolean                // 是否采集首次资源加载
    server?: boolean                       // 是否采集接口性能
  }
  
  // 错误监控配置
  error?: {
    core?: boolean                         // 是否启用错误监控
    server?: boolean                       // 是否监控接口错误
  }
  
  // 事件监控配置
  event?: {
    core?: boolean                         // 是否启用事件监控
  }
  
  // 其他配置
  recordScreen?: boolean                   // 是否启用录屏
  timeout?: number                         // 上报超时时间（毫秒）
  maxQueueLength?: number                  // 队列最大长度
  ext?: Record<string, any>                // 自定义扩展数据
  
  // 钩子函数
  beforePushEventList?: Function           // 事件入队前钩子
  beforeSendData?: Function                // 数据发送前钩子
  afterSendData?: Function                 // 数据发送后钩子
  
  // 小程序特定配置
  miniProgramPlatform?: string             // 小程序平台
  getRouteNameFn?: (route: any) => string  // 自定义获取路由名称函数
  getPageTitleFn?: (vm: any) => string     // 自定义获取页面标题函数
  getPageUrlFn?: (vm: any) => string       // 自定义获取页面URL函数
}
```

## 自定义配置函数

可以通过提供自定义函数来获取页面信息：

```javascript
initMiniProgram({
  dsn: 'https://your-server.com/api/tracking',
  appName: 'MyApp',
  appCode: 'my_app',
  appVersion: '1.0.0',
  
  // 自定义获取路由名称
  getRouteNameFn: (route) => {
    return route?.name || 'unknown'
  },
  
  // 自定义获取页面标题
  getPageTitleFn: (vm) => {
    return vm?.title || document.title
  },
  
  // 自定义获取页面URL
  getPageUrlFn: (vm) => {
    return vm?.path || ''
  }
})
```

## 常见问题

### Q: 如何禁用自动页面跟踪？

A: 在初始化时设置 `enableAutoPageTracking: false`：

```javascript
initMiniProgram({
  // ... 其他配置
  enableAutoPageTracking: false
})
```

### Q: 如何手动上报页面浏览？

A: 使用 `tracePageView` 函数：

```javascript
import { tracePageView } from '@meta-track/mini-program'

tracePageView({
  routeName: 'my-page',
  pageTitle: '我的页面',
  pageUrl: '/pages/my-page'
})
```

### Q: 如何获取当前小程序平台？

A: 使用 `detectMiniProgramPlatform()` 函数：

```javascript
import { detectMiniProgramPlatform } from '@meta-track/mini-program'

const platform = detectMiniProgramPlatform()
console.log(`当前平台: ${platform}`)
```

## 许可

MIT License
