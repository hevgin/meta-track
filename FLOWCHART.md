# 录屏功能响应式监听流程图

## 🔄 完整的响应式链路图

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         用户操作：点击"开启录屏"按钮                      │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    Vue 组件方法：openX() 执行                             │
│  this.recordingOptions.value.recordScreen = true                         │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────────────┐
│              Proxy Handler 的 set 拦截器触发                             │
│  target[key] = value  被拦截处理                                         │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                  getHandlers() 中的 setCallBack 执行                      │
│  setCallBack(oldValue) 被调用                                            │
│           ↓                                                               │
│      dep.notify(oldValue)                                                │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    Dep.notify() 遍历 subs 集合                            │
│  this.subs.forEach(watcher => watcher.update(oldValue))                 │
│                                                                           │
│  ✅ 因为之前 deepTraverse 已经将此 Watcher 添加到依赖列表                │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────────────┐
│               Watcher.update() 被触发                                     │
│  if (this.watch) {                                                       │
│    this.callback(this.proxy.value, oldValue)  // watch 回调              │
│  }                                                                        │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────────────┐
│            Watch 回调函数执行（initRecordScreen 中定义）                 │
│  (newValue, oldValue) => {                                               │
│    const newRecordScreen = newValue?.recordScreen ?? false  // true      │
│    const oldRecordScreen = oldValue?.recordScreen ?? false  // false     │
│    if (newRecordScreen === oldRecordScreen) return         // 不返回      │
│                                                                           │
│    if (newRecordScreen) {                                                │
│      recordScreen = new RecordScreen()  // ✅ 创建实例                   │
│    }                                                                      │
│  }                                                                        │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                    RecordScreen 实例被创建                                │
│  record({                                                                 │
│    emit: (event, isCheckout) => { ... },  // 记录页面操作                │
│    recordCanvas: true,                     // 录制 canvas                │
│    checkoutEveryNms: 5000                  // 每 5 秒生成快照             │
│  })                                                                       │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      录屏开始进行                                         │
│  页面上的所有操作和 DOM 变化都被记录到 eventList 中                      │
│  当发生错误时，错误事件会附加此时的录屏数据                               │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 关键环节：依赖收集过程

```
初始化阶段（watch 创建时）：

┌─────────────────────────────────────────────────────────────────────────┐
│ watch(options, callback) 被调用                                         │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ new Watcher('', { watch: true, callback }, getter)                      │
│  Watcher 构造函数执行                                                    │
│  this.watch = true                                                      │
│  this.getter = () => target.value                                       │
│  this.watchGet() 被调用                                                 │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Watcher.watchGet() 执行：                                                │
│                                                                          │
│ 1. pushTarget(this)  // Dep.target = this Watcher                      │
│                                                                          │
│ 2. this.proxy.value = this.getter()                                     │
│    ↓ 执行 getter 函数                                                    │
│    ↓ return target.value                                                │
│    ↓ 触发 Proxy get 拦截器                                             │
│    ↓ 调用 getCallBack()                                                 │
│    ↓ 执行 dep.addSub()  ← Watcher 被添加到依赖列表！                   │
│                                                                          │
│ 3. deepTraverse(this.proxy.value)  ← 新增的深度遍历！                  │
│    for (const key in value) {                                           │
│      const subValue = value[key]  ← 访问每个属性                       │
│      ↓ 触发属性对应的 Proxy get 拦截器                                │
│      ↓ 调用 dep.addSub()  ← Watcher 被添加到此属性的依赖列表！         │
│                                                                          │
│      if (typeof subValue === 'object') {                               │
│        deepTraverse(subValue)  // 递归处理嵌套对象                     │
│      }                                                                   │
│    }                                                                     │
│                                                                          │
│ 4. popTarget()  // Dep.target = undefined                              │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 依赖收集完成！Watcher 现在被记录在：                                    │
│                                                                          │
│ ✅ options.value 自身的依赖列表                                        │
│ ✅ options.value.recordScreen 属性的依赖列表                          │
│ ✅ options.value.appName 属性的依赖列表                              │
│ ✅ 所有嵌套属性的依赖列表                                              │
│                                                                          │
│ 当任何这些属性改变时，都会触发此 Watcher 的 update() 方法！           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## ❌ vs ✅ 对比：修改前后

### 修改前的问题

```
┌─────────────────────────────────────────────────────────────┐
│ watch(options, callback)                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Watcher.watchGet()：                                        │
│                                                              │
│ this.proxy.value = target.value  ✅ 依赖收集              │
│     ↓ 触发 Proxy get                                       │
│     ↓ 只收集 options.value 顶层的依赖                      │
│                                                              │
│ ❌ 不执行深度遍历，嵌套属性未被记录                        │
│ ❌ recordScreen 属性的 Dep 中没有此 Watcher              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ options.value.recordScreen = true  执行                    │
│     ↓                                                        │
│     ↓ 触发 Proxy set 拦截器                               │
│     ↓ 调用 dep.notify()（recordScreen 的 Dep）           │
│     ↓ 遍历此 Dep 的 subs 集合                              │
│     ↓                                                        │
│ ❌ subs 中没有我们的 Watcher（因为未被记录）              │
│ ❌ Watcher.update() 不执行                                 │
│ ❌ watch 回调不执行                                        │
│ ❌ RecordScreen 未创建                                    │
└──────────────────────────────────────────────────────────────┘
```

### 修改后的正确流程

```
┌─────────────────────────────────────────────────────────────┐
│ watch(options, callback)                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Watcher.watchGet()：                                        │
│                                                              │
│ this.proxy.value = target.value  ✅ 依赖收集              │
│     ↓ 触发 Proxy get                                       │
│     ↓ 只收集 options.value 顶层的依赖                      │
│                                                              │
│ ✅ 执行 deepTraverse(this.proxy.value)  新增！            │
│    ├─ 访问 recordScreen → 触发 get → addSub()           │
│    ├─ 访问 appName → 触发 get → addSub()                │
│    ├─ 访问 ... 其他属性                                   │
│    └─ 递归处理嵌套对象                                     │
│                                                              │
│ ✅ 所有嵌套属性的 Dep 都添加了此 Watcher                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ options.value.recordScreen = true  执行                    │
│     ↓                                                        │
│     ↓ 触发 Proxy set 拦截器                               │
│     ↓ 调用 dep.notify()（recordScreen 的 Dep）           │
│     ↓ 遍历此 Dep 的 subs 集合                              │
│     ↓                                                        │
│ ✅ subs 中有我们的 Watcher（已被记录）                    │
│ ✅ Watcher.update() 执行                                   │
│ ✅ watch 回调执行                                          │
│ ✅ RecordScreen 正确创建  🎉                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 架构图：Watch 系统全景

```
┌──────────────────────────────────────────────────────────────────────┐
│                      watch() 函数（入口）                             │
│  export function watch<T>(target, fun)                               │
└────────────┬─────────────────────────────────────────────────────────┘
             │ 创建
             ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      Watcher 类（核心）                               │
│                                                                       │
│  constructor()                                                       │
│    ├─ this.getter = getter 函数                                    │
│    ├─ this.callback = 回调函数                                    │
│    └─ this.watchGet() ← 执行依赖收集                             │
│                                                                       │
│  watchGet()  ← 关键方法！                                           │
│    ├─ pushTarget(this)  将自己放入 Dep.target                    │
│    ├─ value = this.getter()  执行 getter                         │
│    │  └─ 触发 Proxy get → dep.addSub() 添加依赖                  │
│    ├─ deepTraverse(value)  ← 新增！深度遍历                      │
│    │  └─ 递归访问所有属性，触发它们的 getter                     │
│    │     └─ 每个属性也会触发 dep.addSub()                       │
│    └─ popTarget()  将自己从 Dep.target 移除                      │
│                                                                       │
│  update(oldValue)  ← 被 Dep 调用                                   │
│    └─ this.callback(this.proxy.value, oldValue)  ← 执行回调!      │
└────────────┬─────────────────────────────────────────────────────────┘
             │ 依赖
             ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      Dep 类（依赖管理）                               │
│                                                                       │
│  static target: Watcher  全局唯一的 Watcher 引用                   │
│                                                                       │
│  subs = new Set<Watcher>()  依赖集合                               │
│                                                                       │
│  addSub()                                                            │
│    └─ if (Dep.target) this.subs.add(Dep.target)                   │
│       ↑ 将当前正在执行的 Watcher 添加到依赖列表                   │
│                                                                       │
│  notify(oldValue)  ← 属性改变时被调用                              │
│    └─ this.subs.forEach(watcher => watcher.update(oldValue))      │
│       ↑ 通知所有依赖此属性的 Watcher                              │
└────────────┬─────────────────────────────────────────────────────────┘
             │ 响应式追踪
             ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      Proxy Handler（拦截）                           │
│                                                                       │
│  get(target, key, receiver)                                          │
│    ├─ value = Reflect.get(...)                                     │
│    ├─ getCallBack()  ← 执行回调                                    │
│    │  └─ dep.addSub()  ← 收集依赖！                               │
│    └─ return proxy(value)  如果是对象则返回代理                   │
│                                                                       │
│  set(target, key, value, receiver)                                  │
│    ├─ oldValue = Reflect.get(...)                                  │
│    ├─ result = Reflect.set(...)  设置新值                         │
│    ├─ setCallBack(oldValue)  ← 执行回调                           │
│    │  └─ dep.notify(oldValue)  ← 派发更新！                      │
│    └─ return result                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 深度遍历示例

```
初始对象结构：
{
  appName: "myapp",
  recordScreen: false,
  debug: true,
  pv: {
    core: true
  },
  error: {
    core: false,
    server: true
  }
}

深度遍历过程：

1. deepTraverse({...})
   ├─ 访问 appName
   │  └─ 触发 Proxy get
   │     └─ dep.addSub()  ← Watcher 被添加
   │
   ├─ 访问 recordScreen
   │  └─ 触发 Proxy get
   │     └─ dep.addSub()  ← Watcher 被添加
   │
   ├─ 访问 debug
   │  └─ 触发 Proxy get
   │     └─ dep.addSub()  ← Watcher 被添加
   │
   ├─ 访问 pv（对象）
   │  ├─ 触发 Proxy get
   │  │  └─ dep.addSub()  ← Watcher 被添加
   │  │
   │  └─ deepTraverse(pv)  递归
   │     └─ 访问 core
   │        └─ 触发 Proxy get
   │           └─ dep.addSub()  ← Watcher 被添加
   │
   └─ 访问 error（对象）
      ├─ 触发 Proxy get
      │  └─ dep.addSub()  ← Watcher 被添加
      │
      └─ deepTraverse(error)  递归
         ├─ 访问 core
         │  └─ 触发 Proxy get
         │     └─ dep.addSub()  ← Watcher 被添加
         │
         └─ 访问 server
            └─ 触发 Proxy get
               └─ dep.addSub()  ← Watcher 被添加

遍历完成！
所有属性（包括嵌套属性）都已被记录！

现在，任何这些属性的改变都会触发 watch 回调：
- options.value.appName = "newname"  ✅ 触发
- options.value.recordScreen = true   ✅ 触发
- options.value.pv.core = false       ✅ 触发
- options.value.error.server = false  ✅ 触发
```

---

## 🎯 关键决策点

```
           ┌─ 使用 JSON.stringify() 遍历？
           │  ❌ 不可行：
           │     • 会序列化函数为 undefined
           │     • 会转换对象结构
           │     • 某些对象无法被序列化
           │
决策：深度遍历方式
           │
           ├─ 使用 Object.keys() 遍历？
           │  ⚠️  有限制：
           │     • 不会遍历不可枚举属性
           │     • 不会遍历原型链
           │
           └─ 使用 for...in 循环？  ✅ 最优
              • 遍历所有可枚举属性（包括原型链）
              • 简单直接
              • WeakSet 防止循环引用


           ┌─ 在 watch() 中遍历？
           │  ❌ 不好：
           │     • watch 函数变得复杂
           │     • 难以维护
           │
决策：遍历位置
           │
           └─ 在 Watcher.watchGet() 中遍历？  ✅ 最优
              • 关注点分离
              • watch 函数保持简洁
              • Watcher 专注于依赖收集
              • 易于扩展和维护


           ┌─ 使用数组存储已访问对象？
           │  ⚠️  性能问题：
           │     • 数组的 indexOf() 是 O(n)
           │     • 大对象树会很慢
           │
决策：循环引用防护
           │
           └─ 使用 WeakSet 存储已访问对象？  ✅ 最优
              • O(1) 查询时间
              • 自动垃圾回收
              • 不会对被存储对象造成强引用
```

---

## 📈 性能分析

```
遍历深度和性能影响：

浅层对象（1-2 级）
├─ 访问次数：5-10
├─ 性能影响：✅ 可忽略
└─ 用例：大部分配置对象

中等嵌套（2-4 级）
├─ 访问次数：20-50
├─ 性能影响：✅ 轻微
└─ 用例：复杂的业务配置

深层嵌套（5+ 级）
├─ 访问次数：100+
├─ 性能影响：⚠️  需要注意
└─ 用例：极少见

最佳实践：
• 保持配置对象相对扁平（3 级以内）
• 避免在配置对象中存储大量数据
• 对于大型数据结构，使用普通对象而不是 ref

示例：
✅ 好：{ recordScreen: true, appName: "app" }
❌ 坏：{ data: [1,2,3...], nested: { a: { b: { c: { ... } } } } }
```

---

**图表版本**: 1.0.0  
**最后更新**: 2026-02-10  
**格式**: Markdown + ASCII
