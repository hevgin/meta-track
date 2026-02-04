# MetaTrack 升级指南

本文档介绍从 `@web-tracing` 升级到 `@meta-track` 的步骤。

## 主要变化

### 1. 包名称更改

所有包已从 `@web-tracing` 重命名为 `@meta-track`：

| 旧包名 | 新包名 |
|-------|--------|
| `@web-tracing/core` | `@meta-track/core` |
| `@web-tracing/vue2` | `@meta-track/vue2` |
| `@web-tracing/vue3` | `@meta-track/vue3` |
| `@web-tracing/react` | `@meta-track/react` |
| `@web-tracing/nuxt` | `@meta-track/nuxt` |
| N/A | `@meta-track/mini-program` |（新增）|

### 2. 新增功能

#### 2.1 小程序支持

新增 `@meta-track/mini-program` 包，支持：
- 微信原生小程序
- Taro 框架
- uni-app 框架
- mpx 框架

自动采集 `routeName`、`pageTitle`、`pageUrl` 等信息。

#### 2.2 routeName 和 pageTitle 采集

所有框架集成包现已支持自动采集路由名称和页面标题：

**Vue3 示例：**
```typescript
import { createApp } from 'vue'
import MetaTrack from '@meta-track/vue3'
import router from './router'

const app = createApp(App)

app.use(MetaTrack, {
  dsn: 'https://your-server.com/api/tracking',
  appName: 'MyApp',
  appCode: 'my_app',
  appVersion: '1.0.0',
  pv: {
    core: true,
    enableRouteName: true,  // 启用路由名称采集
    enablePageTitle: true   // 启用页面标题采集
  }
})

app.use(router)
app.mount('#app')
```

**Vue2 示例：**
```javascript
import Vue from 'vue'
import MetaTrack from '@meta-track/vue2'
import router from './router'

Vue.use(MetaTrack, {
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

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
```

**React 示例：**
```typescript
import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { MetaTrackProvider, useMetaTrackRouter } from '@meta-track/react'

function App() {
  return (
    <MetaTrackProvider
      options={{
        dsn: 'https://your-server.com/api/tracking',
        appName: 'MyApp',
        appCode: 'my_app',
        appVersion: '1.0.0',
        pv: {
          core: true,
          enableRouteName: true,
          enablePageTitle: true
        }
      }}
    >
      <Router>
        <PageTracker />
        <App />
      </Router>
    </MetaTrackProvider>
  )
}

function PageTracker() {
  useMetaTrackRouter()
  return null
}
```

#### 2.3 自定义路由和标题获取函数

可以提供自定义函数来获取路由名称和页面标题：

```typescript
import { init } from '@meta-track/core'

init({
  dsn: 'https://your-server.com/api/tracking',
  appName: 'MyApp',
  appCode: 'my_app',
  appVersion: '1.0.0',
  
  // 自定义获取路由名称
  getRouteNameFn: (route) => {
    return route?.meta?.name || route?.name || 'unknown'
  },
  
  // 自定义获取页面标题
  getPageTitleFn: (vm) => {
    return vm?.$store?.state?.pageTitle || document.title
  },
  
  // 自定义获取页面URL
  getPageUrlFn: (vm) => {
    return vm?.$route?.fullPath || window.location.href
  }
})
```

## 升级步骤

### 1. 更新依赖

```bash
# 卸载旧包
npm uninstall @web-tracing/core @web-tracing/vue3 @web-tracing/react

# 安装新包
npm install @meta-track/core @meta-track/vue3 @meta-track/react
```

### 2. 更新导入语句

将所有导入语句从 `@web-tracing` 更改为 `@meta-track`：

**Vue3 之前：**
```typescript
import WebTracing from '@web-tracing/vue3'
import { init, tracePageView } from '@web-tracing/core'
```

**Vue3 之后：**
```typescript
import MetaTrack from '@meta-track/vue3'
import { init, tracePageView } from '@meta-track/core'
```

**React 之前：**
```typescript
import { WebTracingProvider, useWebTracing } from '@web-tracing/react'
```

**React 之后：**
```typescript
import { MetaTrackProvider, useMetaTrack } from '@meta-track/react'
```

### 3. 更新配置

在初始化时启用新的功能：

```typescript
init({
  dsn: 'https://your-server.com/api/tracking',
  appName: 'MyApp',
  appCode: 'my_app',
  appVersion: '1.0.0',
  pv: {
    core: true,
    enableRouteName: true,      // 新增
    enablePageTitle: true       // 新增
  }
})
```

### 4. 更新框架特定代码

#### Vue3 Router 集成

新增自动路由跟踪功能，无需额外配置：

```typescript
import MetaTrack from '@meta-track/vue3'
import router from './router'

app.use(MetaTrack, {
  // ... 其他配置
  pv: {
    core: true,
    enableRouteName: true,
    enablePageTitle: true
  }
})
// router 会自动被集成
```

#### React Router 集成

使用新的 `useMetaTrackRouter` Hook：

```typescript
import { useMetaTrackRouter } from '@meta-track/react'

function App() {
  useMetaTrackRouter()
  return <Routes>{/* ... */}</Routes>
}
```

## 向后兼容性

为了保持向后兼容性：

1. **Context 名称**：React 中保留了 `WebTracingProvider` 和 `useWebTracing` 的别名
2. **导出**：核心 SDK 仍然导出 `WebTracing` 对象

```typescript
import { WebTracing } from '@meta-track/core'

// 仍然可以使用
const { init } = WebTracing
```

## 新增 API

### 页面信息获取

```typescript
import { 
  getPageInfo,
  getRouteName,
  getPageTitle,
  getPageUrl,
  detectMiniProgramPlatform,
  isMiniProgramEnvironment
} from '@meta-track/core'

// 获取完整的页面信息
const pageInfo = getPageInfo()
console.log(pageInfo.routeName, pageInfo.pageTitle, pageInfo.pageUrl)

// 单独获取
const routeName = getRouteName()
const pageTitle = getPageTitle()
const pageUrl = getPageUrl()

// 小程序检测
const platform = detectMiniProgramPlatform() // 'native' | 'taro' | 'uniapp' | 'mpx' | 'unknown'
const isMiniProgram = isMiniProgramEnvironment() // boolean
```

### 小程序集成

```typescript
import { initMiniProgram, miniProgramMixin } from '@meta-track/mini-program'

// 初始化
initMiniProgram({
  dsn: 'https://your-server.com/api/tracking',
  appName: 'MyApp',
  appCode: 'my_app',
  appVersion: '1.0.0'
})

// 在页面中使用 mixin
export default {
  mixins: [miniProgramMixin]
}
```

## 性能改进

本次更新包含多个性能和稳定性改进：

1. **更好的错误处理**：所有框架集成都有改进的错误处理机制
2. **类型安全**：增强了 TypeScript 类型定义
3. **小程序优化**：针对小程序环境的特定优化
4. **条件导入**：React Router 集成使用条件导入，避免不必要的依赖

## 常见问题

### Q: 我可以同时使用两个版本吗？

A: 不建议。建议完全升级到 `@meta-track`。

### Q: 旧代码还能工作吗？

A: 如果您从 `@web-tracing` 升级，需要更新包名和导入语句。核心功能保持兼容。

### Q: 如何迁移小程序项目？

A: 安装 `@meta-track/mini-program` 并使用 `initMiniProgram()` 函数。参考 `@meta-track/mini-program` 的 README。

### Q: 自定义 hooks 还能使用吗？

A: 可以。所有公共 API 都保持兼容。使用新的 hook 名称如 `useMetaTrackRouter`。

## 支持

如有问题，请提交 Issue 或联系我们。

## 许可证

MIT
