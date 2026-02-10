# Vue 2 中的录屏功能使用指南

## ✅ 正确用法

### 1. 直接导入和使用 options ref 对象

```javascript
// err/index.vue
import { options } from '@web-tracing/vue2'

export default {
  data() {
    return {
      // 不需要在 data 中定义 options，直接使用导入的 ref 对象
    }
  },
  methods: {
    openX() {
      // options 是响应式的 ref 对象
      // 直接修改 options.value.recordScreen 会自动触发 watch 回调
      if (options.value.recordScreen) {
        this.sendMessage('已经打开错误录屏了，不用重复打开')
      } else {
        options.value.recordScreen = true
        this.sendMessage('成功打开错误录屏')
      }
    },
    
    closeX() {
      if (options.value.recordScreen) {
        options.value.recordScreen = false
        this.sendMessage('关闭成功')
      } else {
        this.sendMessage('已经关闭错误录屏了，不用重复关闭')
      }
    }
  }
}
```

### 2. 在 Vue 组件中监听 options 的变化

```javascript
import { options } from '@web-tracing/vue2'
import { watch } from '@web-tracing/core'

export default {
  mounted() {
    // 监听 options 中任何属性的变化（包括嵌套属性）
    watch(options, (newValue, oldValue) => {
      console.log('[v0] options changed:', newValue)
      
      // 可以在这里执行相关的业务逻辑
      if (newValue.recordScreen && !oldValue.recordScreen) {
        console.log('[v0] Recording screen started')
      } else if (!newValue.recordScreen && oldValue.recordScreen) {
        console.log('[v0] Recording screen stopped')
      }
    })
  }
}
```

### 3. 获取 options 的配置（用于显示当前状态）

```javascript
import { options } from '@web-tracing/vue2'

export default {
  computed: {
    // 使用计算属性读取 options 中的值
    recordScreenEnabled() {
      return options.value.recordScreen
    },
    
    appName() {
      return options.value.appName
    }
  },
  
  template: `
    <div>
      <p>Recording: {{ recordScreenEnabled ? 'ON' : 'OFF' }}</p>
      <p>App: {{ appName }}</p>
    </div>
  `
}
```

## ❌ 错误用法

### 1. 使用 getOptions() 来获取响应式对象

```javascript
// ❌ 错误 - getOptions() 返回深拷贝，不是响应式的
import { getOptions } from '@web-tracing/vue2'

export default {
  data() {
    return {
      options: getOptions()  // 这是一个普通对象，不是 ref
    }
  },
  methods: {
    openX() {
      this.options.recordScreen = true  // ❌ 修改不会被监听
    }
  }
}
```

### 2. 在 data 中定义 options

```javascript
// ❌ 错误 - 这样会覆盖导入的 options
export default {
  data() {
    return {
      options: {}  // ❌ 这会覆盖导入的响应式 options
    }
  }
}
```

### 3. 试图在模板中直接访问未定义的 options

```javascript
// ❌ 错误 - options 未在 data 中定义
export default {
  template: `
    <button @click="options.recordScreen = true">
      {{/* ❌ options 在模板中无法访问 */}}
    </button>
  `
}
```

### 修复方法：暴露 options 给模板

```javascript
import { options } from '@web-tracing/vue2'

export default {
  data() {
    return {
      // 在 data 中返回一个对象，包含导入的 options
      recordingOptions: options
    }
  },
  template: `
    <button @click="recordingOptions.value.recordScreen = true">
      Open Recording
    </button>
  `
}
```

## 🎯 API 对照表

| API | 用途 | 返回类型 | 响应式 | 用法 |
|-----|------|--------|--------|------|
| `options` | 导出的全局配置对象 | `ref<InternalOptions>` | ✅ 是 | 直接导入使用 |
| `getOptions()` | 获取当前配置的副本 | `InternalOptions` | ❌ 否 | 仅用于读取当前配置 |
| `setUserUuid(id)` | 设置用户ID | `void` | - | 直接调用函数 |
| `watch(target, callback)` | 监听响应式对象 | `void` | - | 用于监听 options 或其他 ref |

## 📊 响应性对比

### ✅ 响应式（推荐）

```javascript
import { options } from '@web-tracing/vue2'

// 直接修改
options.value.recordScreen = true

// ✅ 会触发：
// 1. Proxy set 拦截器
// 2. Dep.notify()
// 3. Watcher 回调
// 4. RecordScreen 创建/销毁
```

### ❌ 非响应式

```javascript
import { getOptions } from '@web-tracing/vue2'

const config = getOptions()
config.recordScreen = true

// ❌ 不会触发任何响应式更新
// 这只是普通对象的属性修改
```

## 🧪 调试技巧

### 1. 验证 options 是否为 ref

```javascript
import { options } from '@web-tracing/vue2'

console.log('[v0] Is options a ref?', !!options.value)
console.log('[v0] options.value:', options.value)
```

### 2. 监听 recordScreen 的具体变化

```javascript
import { options, watch } from '@web-tracing/vue2'

watch(options, (newVal, oldVal) => {
  const newRecording = newVal?.recordScreen
  const oldRecording = oldVal?.recordScreen
  
  if (newRecording !== oldRecording) {
    console.log(`[v0] Recording changed from ${oldRecording} to ${newRecording}`)
  }
})
```

### 3. 检查 RecordScreen 实例

```javascript
// 在 recordscreen.ts 中添加全局暴露（仅用于调试）
window.__recordScreen = recordScreen

// 在控制台检查
window.__recordScreen instanceof RecordScreen
```

## 🔍 常见问题排查

### 问题 1：修改 options.value.recordScreen 后没有反应

**排查步骤：**
1. 检查是否使用了 `getOptions()` 而非直接导入 `options`
2. 验证 watch 回调是否被执行：`console.log('[v0]', 'watch callback fired')`
3. 检查是否在 `data()` 中覆盖了 options

**解决方案：**
```javascript
// ✅ 正确
import { options } from '@web-tracing/vue2'
options.value.recordScreen = true

// 如果需要在模板中使用，这样做：
data() {
  return {
    opts: options  // 保持为 ref 对象
  }
}
// 模板中：{{ opts.value.recordScreen }}
```

### 问题 2：options undefined

**排查步骤：**
1. 检查导入语句是否正确
2. 确认 SDK 已经初始化（在 main.js 中调用了 `Vue.use(WebTracing, config)`）

**解决方案：**
```javascript
// 确保在 main.js 中初始化
Vue.use(WebTracing, webTracingConfig)

// 然后在组件中导入
import { options } from '@web-tracing/vue2'
```

### 问题 3：录屏功能无法动态启用

**根本原因：**
- Watch 没有收集到嵌套属性的依赖
- 修改 options.value.recordScreen 不能触发 watch 回调

**验证修复是否成功：**
```javascript
import { options, watch } from '@web-tracing/vue2'

// 添加 watch 回调
watch(options, (newVal, oldVal) => {
  console.log('[v0] Watch triggered!', {
    newRecordScreen: newVal?.recordScreen,
    oldRecordScreen: oldVal?.recordScreen
  })
})

// 执行修改
options.value.recordScreen = true  // 应该看到日志

// 检查 RecordScreen 是否被创建
setTimeout(() => {
  console.log('[v0] RecordScreen exists:', window.__recordScreen != null)
}, 100)
```

## 📝 最佳实践总结

1. **总是直接导入 `options`，而不是使用 `getOptions()`**
   ```javascript
   import { options } from '@web-tracing/vue2'  // ✅
   ```

2. **在模板或 computed 中通过 `.value` 访问属性**
   ```javascript
   computed: {
     isRecording() { return options.value.recordScreen }
   }
   ```

3. **使用 `watch()` 监听配置变化**
   ```javascript
   watch(options, (newVal) => {
     console.log('Config changed:', newVal)
   })
   ```

4. **修改配置时直接赋值**
   ```javascript
   options.value.recordScreen = true  // ✅ 这会触发响应式更新
   ```

5. **避免重新赋值整个 options 对象**
   ```javascript
   // ❌ 不要这样做
   options.value = { ...options.value, recordScreen: true }
   
   // ✅ 应该这样
   options.value.recordScreen = true
   ```
