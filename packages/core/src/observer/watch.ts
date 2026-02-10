import { Watcher } from './watcher'
import { isRef } from './ref'
import { ObserverValue, AnyFun, voidFun } from './types'

function watchInit(callback: AnyFun, getter: AnyFun) {
  new Watcher('', { watch: true, callback }, getter)
}

export function watch<T>(target: ObserverValue<T>, fun: voidFun<T>) {
  if (!isRef(target)) return
  
  // 创建 watch，Watcher 会在 watchGet() 中自动执行深度遍历
  // 以收集目标对象及其嵌套属性的所有依赖
  watchInit(
    (newValue: T, oldValue: T) => {
      fun(newValue, oldValue)
    },
    function () {
      // 返回 target.value 让 Watcher 进行深度遍历
      return target.value
    }
  )
}
