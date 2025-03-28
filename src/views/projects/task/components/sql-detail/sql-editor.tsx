import { defineComponent, ref, PropType } from 'vue'
import Editor from '../node/editor'
import WeProgress from './progress'
import Result from './result'
import Log from './log'
import History from './history'
import Styles from './sql-editor.module.scss'
import { useNotification, NotificationType } from 'naive-ui'

const props = {
  data: {
    type: Object as PropType<{
      sql?: string
      progress?: {
        current: number
        waitingSize: number
        progressInfo: any[]
        costTime: string
      }
      steps?: string[]
      status?: string
      application?: string
      result?: any
      log?: {
        all: string
        error: string
        warning: string
        info: string
      }
      logLine?: number
      history?: any[]
      runType?: string
    }>,
    default: () => ({
      sql: '',
      progress: {
        current: 0,
        waitingSize: 0,
        progressInfo: [],
        costTime: ''
      },
      steps: [],
      status: '',
      application: '',
      result: null,
      log: {
        all: '',
        error: '',
        warning: '',
        info: ''
      },
      logLine: 1,
      history: [],
      runType: ''
    })
  },
  readonly: {
    type: Boolean as PropType<boolean>,
    default: false
  }
}

export default defineComponent({
  name: 'SQLEditor',
  props,
  emits: ['save', 'run', 'stop'],
  setup(props, ctx) {
    const notification = useNotification()
    const isLogShow = ref(false)
    const scriptViewState = ref({
      showPanel: 'progress',
      bottomPanelHeight: 300,
      bottomPanelMin: false,
      cacheBottomPanelHeight: 'auto',
      height: 600
    })

    const notify = (type: NotificationType) => {
      notification[type]({
        content: '运行提示',
        meta: '开始执行脚本',
        duration: 2500,
        keepAliveOnHover: true
      })
    }

    // 添加进度状态
    const progressState = ref({
      current: 0,
      waitingSize: 100,
      status: 'RUNNING',
      application: 'SQL Task',
      progressInfo: [] as string[],
      costTime: '0s',
      steps: ['SUBMITTED', 'RUNNING', 'FINISHED']
    })

    const localData = ref({ ...props.data })

    const showPanelTab = (type: string) => {
      scriptViewState.value.showPanel = type
    }

    // const changeBottomPanel = ({ height }: { height: number }) => {
    //   scriptViewState.value.cacheBottomPanelHeight = height
    // }

    const openPanel = async (type: string) => {
      if (type === 'log') {
        isLogShow.value = true
        showPanelTab(type)
      }
    }

    // 模拟运行结果数据
    const mockResult = {
      columns: ['id', 'name', 'age', 'status'],
      data: Array(10)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          age: Math.floor(Math.random() * 50) + 20,
          status: Math.random() > 0.5 ? 'active' : 'inactive'
        }))
    }

    // 模拟日志数据
    const mockLog = {
      all:
        '[INFO] 开始执行SQL任务...\n' +
        '[INFO] 正在连接数据库...\n' +
        '[INFO] 数据库连接成功\n' +
        '[INFO] 执行SQL语句...\n' +
        '[INFO] SQL执行完成\n' +
        '[INFO] 查询结果：10条记录\n' +
        '[INFO] 任务执行成功',
      info: '[INFO] SQL执行完成\n[INFO] 查询结果：10条记录',
      warning: '',
      error: ''
    }

    const simulateProgress = () => {
      let progress = 0
      const startTime = Date.now()

      const timer = setInterval(() => {
        const increment = progress < 90 ? 5 : 0.5
        progress = Math.min(progress + increment, 100)

        progressState.value.current = progress / 100
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
        progressState.value.costTime = `${elapsedTime}s`
        progressState.value.progressInfo = [`已完成 ${progress.toFixed(1)}%`]

        if (progress >= 100) {
          clearInterval(timer)
          progressState.value.status = 'FINISHED'
          localData.value.result = mockResult
          localData.value.log = mockLog
          localData.value.logLine = mockLog.all.split('\n').length
          isLogShow.value = true
          showPanelTab('result')
        }
      }, 500)

      return () => clearInterval(timer)
    }

    const handleRun = () => {
      notify('info')
      localData.value.result = null
      localData.value.log = null as any
      localData.value.logLine = 0
      isLogShow.value = false
      progressState.value = {
        current: 0,
        waitingSize: 100,
        status: 'RUNNING',
        application: 'SQL Task',
        progressInfo: ['开始执行...'] as string[],
        costTime: '0s',
        steps: ['SUBMITTED', 'RUNNING', 'FINISHED']
      }
      simulateProgress()
    }

    return () => (
      <div class={Styles.container}>
        <Editor
          script={localData.value}
          scriptType='SQL'
          readonly={props.readonly}
          onSave={(data: any) => ctx.emit('save', data)}
          onRun={handleRun}
          onStop={() => ctx.emit('stop')}
        />
        <div class={Styles.workbenchTabs}>
          <div class={Styles.workbenchTabWrapper}>
            <div class={Styles.workbenchTab}>
              <div
                class={[
                  Styles.workbenchTabItem,
                  scriptViewState.value.showPanel === 'progress' &&
                    Styles.active
                ]}
                onClick={() => showPanelTab('progress')}
              >
                <span>进度</span>
              </div>
              {localData.value.result && (
                <div
                  class={[
                    Styles.workbenchTabItem,
                    scriptViewState.value.showPanel === 'result' &&
                      Styles.active
                  ]}
                  onClick={() => showPanelTab('result')}
                >
                  <span>运行结果</span>
                </div>
              )}
              {isLogShow.value && (
                <div
                  class={[
                    Styles.workbenchTabItem,
                    scriptViewState.value.showPanel === 'log' && Styles.active
                  ]}
                  onClick={() => showPanelTab('log')}
                >
                  <span>运行日志</span>
                </div>
              )}
              <div
                class={[
                  Styles.workbenchTabItem,
                  scriptViewState.value.showPanel === 'history' && Styles.active
                ]}
                onClick={() => showPanelTab('history')}
              >
                <span>历史</span>
              </div>
            </div>
          </div>
        </div>
        <div
          v-show={!scriptViewState.value.bottomPanelMin}
          class={Styles.workbenchContainer}
        >
          {scriptViewState.value.showPanel === 'progress' && (
            <WeProgress
              current={progressState.value.current}
              waitingSize={progressState.value.waitingSize}
              steps={progressState.value.steps}
              status={progressState.value.status}
              application={progressState.value.application}
              progressInfo={progressState.value.progressInfo}
              costTime={progressState.value.costTime}
              onOpenPanel={openPanel}
            />
          )}
          {scriptViewState.value.showPanel === 'result' &&
            localData.value.result && (
              <Result
                result={localData.value.result}
                script={localData.value}
                height={scriptViewState.value.cacheBottomPanelHeight}
              />
            )}
          {scriptViewState.value.showPanel === 'log' && (
            <Log
              logs={
                localData.value.log || {
                  all: '',
                  error: '',
                  warning: '',
                  info: ''
                }
              }
              logLine={localData.value.logLine || 1}
              scriptViewState={scriptViewState.value}
              height={scriptViewState.value.cacheBottomPanelHeight}
            />
          )}
          {scriptViewState.value.showPanel === 'history' && (
            <History
              history={localData.value.history || []}
              runType={localData.value.runType || ''}
            />
          )}
        </div>
      </div>
    )
  }
})
