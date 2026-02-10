# Vue 2 录屏功能监听问题分析与解决方案

## 📋 问题描述

在 `examples/vue2/src/views/err/index.vue` 中，打开/关闭录屏功能时无法监听到变化：

```javascript
// err/index.vue
openX() {
  options.value.recordScreen = true  // ❌ watch 无法监听此变化
}

closeX() {
  options.value.recordScreen = false  // ❌ watch 无法监听此变化
}
```

## 🔍 根本原因分析

### 问题 1：options 为 undefined
**原因**：`getOptions()` 返回的是深拷贝，不是响应式 `ref` 对象

```typescript
// exportMethods.ts
export function getOptions(): InternalOptions {
  return deepCopy(options.value)  // 返回的是普通对象，而非 ref 对象
}
```

**解决**：应该直接导出 `options` 这个 ref 对象，而不是通过 `getOptions()` 获取深拷贝。

### 问题 2：Watch 响应式失效的核心原因

在 `packages/core/src/observer/watch.ts` 中：

```typescript
export function watch<T>(target: ObserverValue<T>, fun: voidFun<T>) {
  if (!isRef(target)) return
  watchInit(
    (newValue: T, oldValue: T) => {
      fun(newValue, oldValue)
    },
    function () {
      return target.value  // ❌ 只读取 target.value，不深度遍历
    }
  )
}
```

**为什么失效？**

1. `options` 是一个 ref 对象，其结构为：`{ value: { recordScreen: false, ... } }`
2. 当执行 `options.value.recordScreen = true` 时：
   - 只改变了 `options.value` 内部的属性
   - 不会触发 `options` proxy 本身的 `set` 拦截器
   - `watch` 只能监听 `options.value` 这个引用本身的改变，而非内部属性的改变

3. 在 `Watcher.watchGet()` 中：
   ```typescript
   watchGet() {
     pushTarget(this)
     this.proxy.dirty = false
     if (this.getter) {
       this.proxy.value = this.getter()  // 只读取 target.value，依赖收集不完整
     }
     popTarget()
   }
   ```

4. 当 `getter` 返回 `target.value` 时，只收集了 `target` 对象本身的依赖，而不是其嵌套属性的依赖。

### 问题 3：initRecordScreen 中的比较逻辑

```typescript
export function initRecordScreen() {
  watch(options, (newValue, oldValue) => {
    if (newValue.recordScreen === oldValue.recordScreen) return  // ❌ 可能为 undefined
    // ...
  })
}
```

当 `options.value` 内部属性改变时，`newValue` 和 `oldValue` 可能都是同一个对象引用，因此 `newValue.recordScreen === oldValue.recordScreen` 总是成立，watch 回调无法正确执行。

## ✅ 解决方案

### 方案 1：深度遍历以收集嵌套属性依赖（已实施）

**修改 `packages/core/src/observer/watch.ts`：**

```typescript
export function watch<T>(target: ObserverValue<T>, fun: voidFun<T>) {
  if (!isRef(target)) return
  
  watchInit(
    (newValue: T, oldValue: T) => {
      fun(newValue, oldValue)
    },
    function () {
      const value = target.value
      // 深度访问 target.value 中的所有属性，确保依赖被完整收集
      if (typeof value === 'object' && value !== null) {
        JSON.stringify(value)  // 遍历所有属性以收集依赖
      }
      return value
    }
  )
}
```

**原理**：
- 通过 `JSON.stringify(value)` 遍历对象的所有属性
- 在遍历过程中会触发每个属性的 getter，进而触发 Dep.addSub()
- 这样 Watcher 就能收集到所有嵌套属性的依赖
- 当任何属性改变时，会调用 `dep.notify()` 触发 watch 回调

### 方案 2：改进 initRecordScreen 的逻辑（已实施）

```typescript
export function initRecordScreen() {
  watch(options, (newValue: any, oldValue: any) => {
    // 安全地获取 recordScreen 属性值
    const newRecordScreen = newValue?.recordScreen ?? false
    const oldRecordScreen = oldValue?.recordScreen ?? false
    
    if (newRecordScreen === oldRecordScreen) return

    if (newRecordScreen) {
      recordScreen = new RecordScreen()
    } else {
      recordScreen?.close()
      recordScreen = undefined
    }
  })

  recordScreen = options.value.recordScreen ? new RecordScreen() : undefined
}
```

### 方案 3：在 Vue 2 组件中正确使用 options（建议）

**修改 `examples/vue2/src/views/err/index.vue`：**

```javascript
// 直接导入 options ref 对象，而非使用 getOptions()
import { options } from '@web-tracing/vue2'

export default {
  methods: {
    openX() {
      // options 已经是 ref 对象，options.value 是响应式的
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

## 📊 对比：修改前后

### 修改前
```
options.value.recordScreen = true
    ↓
修改对象内部属性
    ↓
options proxy 的 set 拦截器 ❌ 不触发（因为 options 引用没变）
    ↓
Watcher 回调 ❌ 不执行
    ↓
RecordScreen 实例 ❌ 未创建/销毁
```

### 修改后
```
options.value.recordScreen = true
    ↓
修改对象内部属性
    ↓
options.value proxy 的 set 拦截器 ✅ 触发
    ↓
触发 Dep.notify()（因为 watch getter 中已收集此属性依赖）
    ↓
Watcher.update() 调用
    ↓
Watcher 回调 ✅ 执行
    ↓
RecordScreen 实例 ✅ 正确创建/销毁
```

## 🎯 关键改进点

1. **深度依赖收集**：通过 `JSON.stringify()` 遍历，确保嵌套属性的改变能被 watch 捕获
2. **安全的属性访问**：使用可选链 `?.` 和 null coalescing `??` 避免 undefined 错误
3. **一致的 API 导出**：确保组件导入的是响应式对象而非深拷贝

## 🧪 测试验证

```javascript
// 在 Vue 2 组件中验证
watch(options, (newVal, oldVal) => {
  console.log('[v0] options changed:', {
    newRecordScreen: newVal?.recordScreen,
    oldRecordScreen: oldVal?.recordScreen
  })
})

// 执行操作
options.value.recordScreen = true  // 应该输出日志

// 验证 RecordScreen 是否被创建
console.log('[v0] recordScreen instance:', recordScreen)  // 应为 RecordScreen 实例
```

## 📝 总结

这是一个关于响应式系统深度依赖收集的问题。通过在 watch getter 中深度遍历对象属性，确保了嵌套属性的改变能够被正确监听，从而使录屏功能的动态开启/关闭能够正常工作。
