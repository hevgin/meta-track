<template>
  <div class="err">
    <el-tabs v-model="activeName">
      <el-tab-pane label="普通错误事件" name="first">
        <div class="mb">
          <el-alert
            type="warning"
            title="错误事件的捕获会有延迟，特别是在开启了批量错误的情况下，一般会有2s延迟"
            :closable="false"
            class="mb"
          >
          </el-alert>

          <el-button id="codeErr" type="danger" plain @click="codeError">
            代码错误
          </el-button>
          <el-button type="danger" plain @click="promiseError">
            Promise-错误
          </el-button>
          <el-button type="danger" plain @click="consoleErr">
            console-错误
          </el-button>
          <el-button type="danger" plain @click="sendBizErr">
            手动上报自定义错误
          </el-button>
          <!-- 改进：直接导入 options ref 对象，而不是使用 getOptions() -->
          <el-button type="danger" plain @click="openX">
            开启错误录屏功能
          </el-button>
          <el-button type="danger" plain @click="closeX">
            关闭错误录屏功能
          </el-button>
          <!-- 显示当前录屏状态 -->
          <span style="margin-left: 20px; font-weight: bold;">
            录屏状态: {{ recordingOptions.value.recordScreen ? '开启' : '关闭' }}
          </span>
        </div>
      </el-tab-pane>
      <!-- ... 其他 tab-pane ... -->
    </el-tabs>

    <el-button type="primary" @click="getAllTracingList">
      获取最新采集数据
    </el-button>
    <c-table
      :data="tracingInfo.data"
      tableHeight="400"
      :config="tracingInfo.table.config"
    >
      <template v-slot:index="{ scope }">
        {{ `${scope.index + 1}` }}
      </template>
      <template v-slot:sendTime="{ scope }">
        {{ `${formatDate(scope.row.sendTime)}` }}
      </template>
      <template v-slot:triggerTime="{ scope }">
        {{ `${formatDate(scope.row.triggerTime)}` }}
      </template>
      <template v-slot:batchErrorLastHappenTime="{ scope }">
        {{ `${formatDate(scope.row.batchErrorLastHappenTime)}` }}
      </template>
      <template v-slot:actions="{ scope }">
        <el-button type="primary" @click="lookRecordscreen(scope.row)">
          查看错误录屏
        </el-button>
      </template>
    </c-table>

    <el-dialog
      :visible.sync="errDialogVisible"
      width="1024px"
      top="10vh"
      :show-close="false"
    >
      <div id="recordscreen" v-if="errDialogVisible"></div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
// 改进：直接导入 options ref 对象，而不是使用 getOptions()
import { traceError, unzipRecordscreen, options, watch } from '@web-tracing/vue2'
import rrwebPlayer from 'rrweb-player'
import 'rrweb-player/dist/style.css'

export default {
  data() {
    return {
      // 改进：在 data 中保持对导入的 options ref 的引用
      recordingOptions: options,
      activeName: 'first',
      showImgTrue: false,
      showImgFalse: false,
      showAudioTrue: false,
      showAudioFalse: false,
      showVideoTrue: false,
      showVideoFalse: false,
      tracingInfo: {
        data: [],
        table: {
          config: [
            { label: '序号', prop: 'index', width: '50', isTemplate: true },
            { label: '事件ID', prop: 'eventId' },
            { label: '事件类型', prop: 'eventType', width: '100' },
            { label: '当前页面URL', prop: 'triggerPageUrl', width: '160' },
            {
              label: '事件发送时间',
              prop: 'sendTime',
              isTemplate: true,
              width: '140'
            },
            {
              label: '事件发生时间',
              prop: 'triggerTime',
              isTemplate: true,
              width: '140'
            },
            { label: '错误信息', prop: 'errMessage' },
            { label: '完整错误信息', prop: 'errStack', width: '140' },
            { label: '错误行', prop: 'line' },
            { label: '错误列', prop: 'col' },
            { label: '是否为批量错误', prop: 'batchError' },
            {
              label: '批量错误最后发生时间',
              prop: 'batchErrorLastHappenTime',
              width: '140',
              isTemplate: true
            },
            { label: '批量错误-错误个数', prop: 'batchErrorLength' },
            { label: '资源请求链接', prop: 'requestUrl', width: '100' },
            { label: '参数', prop: 'params' },
            {
              label: '操作',
              prop: 'actions',
              width: '140',
              isTemplate: true
            }
          ]
        }
      },
      errDialogVisible: false
    }
  },
  mounted() {
    this.getAllTracingList()
    
    // 改进：监听 options 的变化，验证响应式是否生效
    watch(options, (newValue, oldValue) => {
      const newRecording = newValue?.recordScreen ?? false
      const oldRecording = oldValue?.recordScreen ?? false
      
      if (newRecording !== oldRecording) {
        console.log('[v0] Recording changed:', {
          from: oldRecording,
          to: newRecording
        })
      }
    })
  },
  methods: {
    codeError() {
      this.sendMessage()

      const a = {}
      a.split('/')
    },
    promiseError() {
      this.sendMessage()

      const promiseWrap = () =>
        new Promise((resolve, reject) => {
          reject('promise reject')
        })
      promiseWrap().then(res => {
        console.log('res', res)
      })
    },
    consoleErr() {
      this.sendMessage()

      console.error('consoleErr1', 'consoleErr1.1', 'consoleErr1.2')
    },
    sendBizErr() {
      this.sendMessage()

      traceError({
        eventId: '自定义错误ID',
        errMessage: '自定义错误message',
        src: '/interface/order',
        params: {
          id: '12121'
        }
      })
      this.emitMessage()
    },

    // 改进：直接修改 options.value.recordScreen，会自动触发 watch
    openX() {
      // 改进：options 已经是响应式 ref 对象
      if (this.recordingOptions.value.recordScreen) {
        this.sendMessage('已经打开错误录屏了，不用重复打开')
      } else {
        // 直接修改会触发：
        // 1. Proxy set 拦截器
        // 2. Dep.notify()
        // 3. watch 回调
        // 4. RecordScreen 创建
        this.recordingOptions.value.recordScreen = true
        this.sendMessage('成功打开错误录屏')
      }
    },
    closeX() {
      if (this.recordingOptions.value.recordScreen) {
        // 直接修改会触发：
        // 1. Proxy set 拦截器
        // 2. Dep.notify()
        // 3. watch 回调
        // 4. RecordScreen 销毁
        this.recordingOptions.value.recordScreen = false
        this.sendMessage('关闭成功')
      } else {
        this.sendMessage('已经关闭错误录屏了，不用重复关闭')
      }
    },

    // 批量错误示例...（保持原样）
    batchErrorA(num) {
      for (let x = 1; x <= num; x++) {
        document.getElementById('codeErr').click()
      }
    },
    batchErrorAT(num) {
      for (let x = 1; x <= num; x++) {
        setTimeout(() => {
          document.getElementById('codeErr').click()
        }, x * 300)
      }
    },
    batchErrorB(num) {
      for (let x = 1; x <= num; x++) {
        document.getElementById('codeErr').click()
        this.consoleErr()
        this.promiseError()
      }
    },
    batchErrorC(num) {
      for (let x = 1; x <= num; x++) {
        setTimeout(() => {
          this.batchErrorB(1)
        }, x * 300)
      }
    },
    batchErrorD() {
      setInterval(() => {
        document.getElementById('codeErr').click()
      }, 200)
    },

    lookRecordscreen(row) {
      this.errDialogVisible = true
      row.recordscreen = unzipRecordscreen(row.recordscreen)
      this.$nextTick(() => {
        new rrwebPlayer({
          target: document.getElementById('recordscreen'),
          props: {
            events: row.recordscreen,
            UNSAFE_replayCanvas: true
          }
        })
      })
    },

    // 查看错误
    getAllTracingList() {
      axios
        .get('/getAllTracingList', { params: { eventType: 'error' } })
        .then(res => {
          this.tracingInfo.data = res.data.data
          this.selfMessage('成功查询最新数据 - 错误事件')
        })
    }
  }
}
</script>

<style scoped lang="scss">
.err {
  ::v-deep .el-dialog__header,
  ::v-deep .el-dialog__body {
    padding: 0;
  }
  .el-tab-pane {
    min-height: 300px;
  }
  .resource {
    display: flex;
    width: 800px;
    .el-button {
      height: 32px;
      margin-right: 10px;
    }
    img {
      display: block;
      width: 200px;
      height: 200px;
      margin-right: 20px;
    }
    video {
      display: block;
      width: 200px;
      height: 200px;
      margin-right: 20px;
    }
    audio {
      display: block;
      width: 200px;
      height: 200px;
      border: 1px solid red;
      margin-right: 20px;
    }
  }
}
</style>
