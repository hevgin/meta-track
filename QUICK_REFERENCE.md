# 录屏功能快速参考卡片

## 🚀 5 分钟快速理解

### 问题是什么？
```javascript
// ❌ 这样做无法监听变化
import { getOptions } from '@web-tracing/vue2'
const opts = getOptions()
opts.recordScreen = true  // 不会触发 watch

// ✅ 应该这样做
import { options } from '@web-tracing/vue2'
options.value.recordScreen = true  // 会触发 watch
```

### 为什么？
- `getOptions()` 返回的是 **普通对象**（深拷贝）
- 直接导入的 `options` 是 **ref 响应式对象**
- 修改响应式对象才会触发监听器

### 解决方案核心（3 个改进）

| 改进项 | 文件 | 关键变化 |
|--------|------|---------|
| **深度遍历** | `observer/watcher.ts` | 添加 `deepTraverse()` 方法 |
| **安全比较** | `lib/recordscreen.ts` | 使用 `?.` 和 `??` 操作符 |
| **正确导入** | `views/err/index.vue` | 直接导入 `options` |

---

## 📝 Vue 2 组件正确写法

```vue
<script>
// ✅ 直接导入 options ref 对象
import { options, watch } from '@web-tracing/vue2'

export default {
  data() {
    return {
      // ✅ 保存对 ref 的引用
      recordingOptions: options
    }
  },
  
  mounted() {
    // ✅ 监听 options 的变化（包括嵌套属性）
    watch(options, (newVal, oldVal) => {
      console.log('Recording:', newVal?.recordScreen)
    })
  },
  
  methods: {
    openRecording() {
      // ✅ 直接修改响应式对象
      this.recordingOptions.value.recordScreen = true
    },
    
    closeRecording() {
      // ✅ 直接修改响应式对象
      this.recordingOptions.value.recordScreen = false
    }
  }
}
</script>

<template>
  <!-- ✅ 在模板中通过 .value 访问 -->
  <div>
    <p>Recording: {{ recordingOptions.value.recordScreen ? 'ON' : 'OFF' }}</p>
    <button @click="openRecording">Start</button>
    <button @click="closeRecording">Stop</button>
  </div>
</template>
```

---

## ⚠️ 常见错误

```javascript
// ❌ 错误 1：使用 getOptions()
import { getOptions } from '@web-tracing/vue2'
const opts = getOptions()
opts.recordScreen = true  // 不会响应

// ❌ 错误 2：在 data 中覆盖 options
data() {
  return {
    options: {}  // 覆盖了导入的响应式对象
  }
}

// ❌ 错误 3：重新赋值整个对象
options.value = { ...options.value, recordScreen: true }

// ✅ 正确：直接赋值单个属性
options.value.recordScreen = true
```

---

## 🔧 核心改进原理

### Watcher 深度遍历工作流程

```javascript
// 1. watch 被创建时
watch(options, callback)

// 2. Watcher.watchGet() 执行
const value = target.value  // 读取 options.value
deepTraverse(value)         // 遍历所有属性

// 3. 深度遍历过程中
for (const key in value) {
  const subValue = value[key]  // ← 触发每个属性的 getter
  // ↓ Proxy get 拦截器触发 ↓
  // dep.addSub() ← Watcher 被记录
  
  if (typeof subValue === 'object') {
    deepTraverse(subValue)  // 递归处理嵌套对象
  }
}

// 4. 现在 Watcher 被记录在：
// - options.value 的依赖列表
// - options.value.recordScreen 的依赖列表
// - 所有嵌套属性的依赖列表

// 5. 当任何属性改变时
options.value.recordScreen = true
// ↓ Proxy set 拦截器触发 ↓
// dep.notify() ← 通知所有 Watcher
// ↓ Watcher.update() 执行 ↓
// watch callback 触发 ✅
```

---

## 🧪 验证修复是否成功

在浏览器控制台运行：

```javascript
// 1. 检查 options 是否为 ref
import { options } from '@web-tracing/vue2'
console.log('Is ref?', !!options.value)  // 应输出: true

// 2. 设置 watch 监听
import { watch } from '@web-tracing/vue2'
watch(options, (newVal, oldVal) => {
  console.log('[✅] Watch triggered!', {
    newRecording: newVal?.recordScreen,
    oldRecording: oldVal?.recordScreen
  })
})

// 3. 执行修改
options.value.recordScreen = true
// 应该在控制台看到: [✅] Watch triggered!

// 4. 检查 RecordScreen 是否被创建
console.log('RecordScreen exists?', window.__recordScreen != null)
```

---

## 📊 三层响应式系统

```
┌─────────────────────────────────────┐
│ options (ref 对象)                  │
│   └─ .value (Proxy 代理的对象)      │
│       ├─ recordScreen (属性)         │
│       ├─ appName (属性)              │
│       └─ ... (其他属性)              │
└─────────────────────────────────────┘
        ↓
   Watcher 依赖关系
        ↓
┌──────────┬──────────────┬──────────────────┐
│ options  │ recordScreen │ appName ... 等    │
│ 的依赖   │ 的依赖       │ 的依赖            │
└──────────┴──────────────┴──────────────────┘
        ↓ (任何一个属性改变)
   dep.notify() 触发
        ↓
   watch 回调执行
        ↓
   RecordScreen 创建/销毁
```

---

## 📌 记住这 3 点

### 1️⃣ **导入** - 不要使用 getOptions()
```javascript
// ✅ 导入响应式对象
import { options } from '@web-tracing/vue2'
```

### 2️⃣ **修改** - 直接赋值单个属性
```javascript
// ✅ 修改单个属性
options.value.recordScreen = true

// ❌ 不要重新赋值整个对象
options.value = { ...options.value, recordScreen: true }
```

### 3️⃣ **监听** - watch 自动收集嵌套属性依赖
```javascript
// ✅ watch 会自动监听所有嵌套属性
watch(options, (newVal, oldVal) => {
  console.log(newVal)
})
```

---

## 🔗 相关文档

- 📖 [详细分析](./RECORDING_WATCH_ANALYSIS.md) - 问题根因和解决方案
- 📚 [使用指南](./RECORDING_USAGE_GUIDE.md) - 最佳实践和常见问题
- 💡 [改进总结](./OPTIMIZATION_SUMMARY.md) - 技术细节和改进效果
- 🎯 [改进示例](./ERR_INDEX_IMPROVED.vue) - 正确的组件写法

---

**最后更新**: 2026-02-10  
**关键字**: #responsive #watch #ref #proxy #vue2 #recording
