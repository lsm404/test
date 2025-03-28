/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Cell, Graph } from '@antv/x6'
import {
  defineComponent,
  ref,
  provide,
  PropType,
  toRef,
  watch,
  onBeforeUnmount,
  computed,
  reactive
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import DagToolbar from './dag-toolbar'
import DagCanvas from './dag-canvas'
import DagSidebar from './dag-sidebar'
import Styles from './dag.module.scss'
import DagAutoLayoutModal from './dag-auto-layout-modal'
import {
  useGraphAutoLayout,
  useGraphBackfill,
  useDagDragAndDrop,
  useTaskEdit,
  useBusinessMapper,
  useNodeMenu,
  useNodeStatus,
  useCellUpdate
} from './dag-hooks'
import { useThemeStore } from '@/store/theme/theme'
import VersionModal from '../../definition/components/version-modal'
import { WorkflowDefinition, WorkflowInstance } from './types'
import DagSaveModal from './dag-save-modal'
import ContextMenuItem from './dag-context-menu'
import TaskModal from '@/views/projects/task/components/node/detail-modal'
import StartModal from '@/views/projects/workflow/definition/components/start-modal'
import LogModal from '@/components/log-modal'
import './x6-style.scss'
import { queryLog } from '@/service/modules/log'
import { useAsyncState } from '@vueuse/core'
import utils from '@/utils'
import { useUISettingStore } from '@/store/ui-setting/ui-setting'
import { executeTask } from '@/service/modules/executors'
import { removeTaskInstanceCache } from '@/service/modules/task-instances'
import DependenciesModal from '@/views/projects/components/dependencies/dependencies-modal'
import CreateModal from '@/views/projects/task/components/node/create-modal'
import SQLDrawer from './drawer/sql-drawer'
import JavaDrawer from './drawer/java-drawer'
import PythonDrawer from './drawer/python-drawer'
import HttpDrawer from './drawer/http-drawer'
import ShellDrawer from './drawer/shell-drawer'
import DataxDrawer from './drawer/datax-drawer'

const props = {
  // If this prop is passed, it means from definition detail
  instance: {
    type: Object as PropType<WorkflowInstance>,
    default: undefined
  },
  definition: {
    type: Object as PropType<WorkflowDefinition>,
    default: undefined
  },
  readonly: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  projectCode: {
    type: Number as PropType<number>,
    default: 0
  },
  onSave: {
    type: Function,
    required: true
  },
  onNodeClick: {
    type: Function as PropType<(type: string, name: string) => void>,
    required: true
  },
  workflowName: {
    type: String,
    default: ''
  },
  readonlyName: {
    type: Boolean,
    default: false
  }
}

export default defineComponent({
  name: 'workflow-dag',
  props,
  emits: ['refresh', 'save'],
  setup(props, context) {
    const { t } = useI18n()
    const route = useRoute()
    const theme = useThemeStore()

    const uiSettingStore = useUISettingStore()
    const logTimer = uiSettingStore.getLogTimer

    // Whether the graph can be operated
    provide('readonly', toRef(props, 'readonly'))

    const graph = ref<Graph>()
    provide('graph', graph)
    context.expose(graph)

    // Auto layout modal
    const {
      visible: layoutVisible,
      toggle: layoutToggle,
      formValue,
      formRef,
      submit,
      cancel
    } = useGraphAutoLayout({ graph })

    // Edit task
    // const {
    //   taskConfirm,
    //   taskModalVisible,
    //   sqlModalVisible,
    //   currTask,
    //   taskCancel,
    //   sqlConfirm,
    //   sqlCancel,
    //   appendTask,
    //   editTask,
    //   copyTask,
    //   workflowDefinition,
    //   removeTasks
    // } = useTaskEdit({ graph, definition: toRef(props, 'definition') })

    const {
      taskConfirm,
      taskModalVisible,
      sqlModalVisible,
      createModalVisible,
      currTask,
      taskCancel,
      sqlConfirm,
      sqlCancel,
      appendTask,
      editTask,
      copyTask,
      processDefinition,
      removeTasks,
      createModalConfirm,
      createModalCancel
    } = useTaskEdit({
      graph,
      definition: toRef(props, 'definition'),
      onNodeClick: props.onNodeClick
    })

    // Right click cell
    const { nodeVariables, menuHide, menuStart, viewLog } = useNodeMenu({
      graph
    })

    // start button in the dag node menu
    const startDisplay = computed(() => {
      if (props.definition) {
        return (
          route.name === 'workflow-definition-detail' &&
          props.definition!.processDefinition.releaseState === 'ONLINE'
        )
      } else {
        return false
      }
    })

    // execute task buttons in the dag node menu
    const executeTaskDisplay = computed(() => {
      return route.name === 'workflow-instance-detail'
    })

    // other button in the dag node menu
    const menuDisplay = computed(() => {
      if (props.instance) {
        return (
          props.instance.state === 'WAITING_THREAD' ||
          props.instance.state === 'SUCCESS' ||
          props.instance.state === 'PAUSE' ||
          props.instance.state === 'FAILURE' ||
          props.instance.state === 'STOP'
        )
      } else if (props.definition) {
        return props.definition!.processDefinition.releaseState === 'OFFLINE'
      } else {
        return false
      }
    })

    const taskInstance = computed(() => {
      if (nodeVariables.menuCell) {
        const taskCode = Number(nodeVariables.menuCell!.id)
        return taskList.value.find((task: any) => task.taskCode === taskCode)
      } else {
        return undefined
      }
    })

    const currentTaskInstance = ref()

    watch(
      () => taskModalVisible.value,
      () => {
        if (props.instance && taskModalVisible.value) {
          const taskCode = currTask.value.code
          currentTaskInstance.value = taskList.value.find(
            (task: any) => task.taskCode === taskCode
          )
        }
      }
    )

    const statusTimerRef = ref()
    const { taskList, refreshTaskStatus } = useNodeStatus({ graph })

    const { onDragStart, onDrop } = useDagDragAndDrop({
      graph,
      readonly: toRef(props, 'readonly'),
      appendTask
    })

    // backfill
    useGraphBackfill({ graph, definition: toRef(props, 'definition') })

    // version modal
    const versionModalShow = ref(false)
    const versionToggle = (bool: boolean) => {
      if (typeof bool === 'boolean') {
        versionModalShow.value = bool
      } else {
        versionModalShow.value = !versionModalShow.value
      }
    }
    const refreshDetail = () => {
      context.emit('refresh')
      versionModalShow.value = false
    }

    // Save modal
    const saveModalShow = ref(false)
    const saveModelToggle = (bool: boolean) => {
      if (typeof bool === 'boolean') {
        saveModalShow.value = bool
      } else {
        saveModalShow.value = !saveModalShow.value
      }
      console.log('saveModalShow is now:', saveModalShow.value)
    }
    const { getConnects, getLocations } = useBusinessMapper()
    const onSave = (saveForm: any) => {
      const edges = graph.value?.getEdges() || []
      const nodes = graph.value?.getNodes() || []
      if (!nodes.length) {
        window.$message.error(t('project.dag.node_not_created'))
        saveModelToggle(false)
        return
      }
      const connects = getConnects(
        nodes,
        edges,
        processDefinition.value.taskDefinitionList as any
      )
      const locations = getLocations(nodes)
      context.emit('save', {
        taskDefinitions: processDefinition.value.taskDefinitionList,
        saveForm,
        connects,
        locations
      })
      saveModelToggle(false)
    }

    const handleViewLog = (taskId: number, taskType: string) => {
      taskModalVisible.value = false
      viewLog(taskId, taskType)

      getLogs(logTimer)
    }

    let getLogsID: number

    const getLogs = (logTimer: number) => {
      const { state } = useAsyncState(
        queryLog({
          taskInstanceId: nodeVariables.logTaskId,
          limit: nodeVariables.limit,
          skipLineNum: nodeVariables.skipLineNum
        }).then((res: any) => {
          nodeVariables.logRef += res.message || ''
          if (res && res.message !== '') {
            nodeVariables.limit += 1000
            nodeVariables.skipLineNum += res.lineNum
            getLogs(logTimer)
          } else {
            nodeVariables.logLoadingRef = false
            if (logTimer !== 0) {
              if (typeof getLogsID === 'number') {
                clearTimeout(getLogsID)
              }
              getLogsID = setTimeout(() => {
                nodeVariables.limit += 1000
                nodeVariables.skipLineNum += 1000
                getLogs(logTimer)
              }, logTimer * 1000)
            }
          }
        }),
        {}
      )

      return state
    }

    const refreshLogs = (logTimer: number) => {
      nodeVariables.logRef = ''
      nodeVariables.limit = 1000
      nodeVariables.skipLineNum = 0
      getLogs(logTimer)
    }

    const handleExecuteTask = (
      startNodeList: number,
      taskDependType: string
    ) => {
      executeTask(
        {
          processInstanceId: Number(route.params.id),
          startNodeList: startNodeList,
          taskDependType: taskDependType
        },
        props.projectCode
      ).then(() => {
        window.$message.success(t('project.workflow.success'))
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      })
    }

    const handleRemoveTaskInstanceCache = (taskId: number) => {
      removeTaskInstanceCache(props.projectCode, taskId).then(() => {
        window.$message.success(t('project.workflow.success'))
      })
    }

    const downloadLogs = () => {
      utils.downloadFile('log/download-log', {
        taskInstanceId: nodeVariables.logTaskId
      })
    }

    const onConfirmModal = () => {
      nodeVariables.showModalRef = false
    }

    const layoutSubmit = () => {
      submit()

      // Refresh task status in workflow instance
      if (props.instance) {
        refreshTaskStatus()
      }
    }

    const dependenciesData = reactive({
      showRef: ref(false),
      taskLinks: ref([]),
      required: ref(false),
      tip: ref(''),
      action: () => {}
    })

    watch(
      () => props.definition,
      () => {
        if (props.instance) {
          refreshTaskStatus()
          statusTimerRef.value = setInterval(() => refreshTaskStatus(), 90000)
        }
      }
    )

    watch(
      () => nodeVariables.showModalRef,
      () => {
        if (!nodeVariables.showModalRef) {
          nodeVariables.row = {}
          nodeVariables.logRef = ''
          nodeVariables.logLoadingRef = true
          nodeVariables.skipLineNum = 0
          nodeVariables.limit = 1000
        }
      }
    )

    onBeforeUnmount(() => clearInterval(statusTimerRef.value))

    // 添加抽屉相关的状态
    const drawerVisible = ref(false)
    const currentNode = ref<any>(null)

    // 添加一个点击延时变量
    const clickTimer = ref<number | null>(null)
    const clickDelay = 300 // 毫秒

    // 修改单击处理函数
    const handleNodeClick = (node: any) => {
      // 清除之前的点击计时器
      if (clickTimer.value !== null) {
        clearTimeout(clickTimer.value)
        clickTimer.value = null
      }

      // 延迟处理单击事件，给双击事件留出触发的机会
      clickTimer.value = setTimeout(() => {
        console.log('Node clicked, data:', node)
        // 确保节点数据正确设置
        if (!node) {
          return
        }

        currentNode.value = node
        drawerVisible.value = true

        // 重置计时器引用
        clickTimer.value = null
      }, clickDelay) as unknown as number
    }

    // 修改双击处理函数
    const handleNodeDblClick = (node: any) => {
      // 取消单击事件处理
      if (clickTimer.value !== null) {
        clearTimeout(clickTimer.value)
        clickTimer.value = null
      }

      // 正常处理双击事件
      if (node.type === 'SHELL' || node.type === 'SQL') {
        props.onNodeClick?.('sql', node.code)
      } else if (node.type === 'SPARK') {
        props.onNodeClick?.('scala', node.code)
      } else if (node.type === 'JAVA') {
        props.onNodeClick?.('java', node.name || 'Java Editor')
      }
    }

    // 监听图形事件
    watch(
      () => graph.value,
      (newGraph) => {
        if (newGraph) {
          newGraph.on('cell:click', ({ cell }) => {
            console.log('Cell clicked:', cell)
            if (cell.isNode()) {
              handleNodeClick(cell.getData())
            }
          })

          newGraph.on('cell:dblclick', ({ cell }) => {
            if (cell.isNode()) {
              handleNodeDblClick(cell.getData())
            }
          })
        }
      }
    )

    watch(
      () => props.workflowName,
      (newVal) => {
        console.log('Dag workflowName changed:', newVal)
      }
    )

    const {
      setNodeName
      // 如果需要的话，也可以引入其他方法
      // setNodeFillColor
    } = useCellUpdate({
      graph
    })

    // 修改关闭抽屉的处理函数
    const handleCloseDrawer = () => {
      drawerVisible.value = false
    }

    // 在组件中使用computed属性判断节点类型
    const nodeType = computed(() => {
      if (!currentNode.value) return 'default'

      const type = (currentNode.value.taskType || '').toUpperCase()
      if (type === 'JAVA' || type === 'SPARK') {
        return 'java'
      } else if (type === 'PYTHON') {
        return 'python'
      } else if (type === 'HTTP') {
        return 'http'
      } else if (type === 'SHELL') {
        return 'shell'
      } else if (type === 'SQL') {
        return 'sql'
      } else if (type === 'DATAX') {
        return 'datax'
      } else {
        return 'default'
      }
    })

    return () => (
      <div
        class={[
          Styles.dag,
          Styles[`dag-${theme.darkTheme ? 'dark' : 'light'}`]
        ]}
      >
        <DagToolbar
          layoutToggle={layoutToggle}
          instance={props.instance}
          definition={props.definition}
          onVersionToggle={versionToggle}
          onSaveModelToggle={saveModelToggle}
          onRemoveTasks={removeTasks}
          onRefresh={refreshTaskStatus}
          v-model:dependenciesData={dependenciesData}
        />
        <div class={Styles.content}>
          <DagSidebar onDragStart={onDragStart} />
          <DagCanvas onDrop={onDrop} />
        </div>
        <DagAutoLayoutModal
          visible={layoutVisible.value}
          submit={layoutSubmit}
          cancel={cancel}
          formValue={formValue}
          formRef={formRef}
        />
        {!!props.definition && (
          <VersionModal
            isInstance={!!props.instance}
            v-model:row={props.definition.processDefinition}
            v-model:show={versionModalShow.value}
            onUpdateList={refreshDetail}
          />
        )}
        <DagSaveModal
          v-model:show={saveModalShow.value}
          onSave={onSave}
          definition={props.definition}
          instance={props.instance}
          workflowName={props.workflowName}
          readonlyName={props.readonlyName}
        />
        <CreateModal
          readonly={props.readonly}
          show={createModalVisible.value}
          projectCode={props.projectCode}
          workflowInstance={props.instance}
          taskInstance={currentTaskInstance.value}
          onViewLog={handleViewLog}
          data={currTask.value as any}
          definition={processDefinition}
          onSubmit={createModalConfirm}
          onCancel={createModalCancel}
        />
        <TaskModal
          readonly={props.readonly}
          show={taskModalVisible.value}
          projectCode={props.projectCode}
          processInstance={props.instance}
          taskInstance={currentTaskInstance.value}
          onViewLog={handleViewLog}
          data={currTask.value as any}
          definition={processDefinition}
          onSubmit={taskConfirm}
          onCancel={taskCancel}
        />
        <ContextMenuItem
          startDisplay={startDisplay.value}
          executeTaskDisplay={executeTaskDisplay.value}
          menuDisplay={menuDisplay.value}
          taskInstance={taskInstance.value}
          cell={nodeVariables.menuCell as Cell}
          visible={nodeVariables.menuVisible}
          left={nodeVariables.pageX}
          top={nodeVariables.pageY}
          onHide={menuHide}
          onStart={menuStart}
          onEdit={editTask}
          onCopyTask={copyTask}
          onRemoveTasks={removeTasks}
          onViewLog={handleViewLog}
          onExecuteTask={handleExecuteTask}
          onRemoveTaskInstanceCache={handleRemoveTaskInstanceCache}
          v-model:dependenciesData={dependenciesData}
        />
        <DependenciesModal
          v-model:show={dependenciesData.showRef}
          v-model:taskLinks={dependenciesData.taskLinks}
          required={dependenciesData.required}
          content={dependenciesData.tip}
          onConfirm={dependenciesData.action}
        />
        {!!props.definition && (
          <StartModal
            v-model:row={props.definition.processDefinition}
            v-model:show={nodeVariables.startModalShow}
            taskCode={nodeVariables.taskCode}
          />
        )}
        {!!props.instance && (
          <LogModal
            showModalRef={nodeVariables.showModalRef}
            logRef={nodeVariables.logRef}
            row={nodeVariables.row}
            showDownloadLog={true}
            logLoadingRef={nodeVariables.logLoadingRef}
            onConfirmModal={onConfirmModal}
            onRefreshLogs={refreshLogs}
            onDownloadLogs={downloadLogs}
          />
        )}
        {/* 使用switch语句根据节点类型渲染对应的抽屉 */}
        {(() => {
          switch (nodeType.value) {
            case 'java':
              return (
                <JavaDrawer
                  visible={drawerVisible.value}
                  nodeData={currentNode.value}
                  graph={graph.value}
                  setNodeName={setNodeName}
                  onClose={handleCloseDrawer}
                  onUpdate:visible={(v: boolean) => (drawerVisible.value = v)}
                  onUpdate:nodeData={(v: any) => (currentNode.value = v)}
                />
              )
            case 'python':
              return (
                <PythonDrawer
                  visible={drawerVisible.value}
                  nodeData={currentNode.value}
                  graph={graph.value}
                  setNodeName={setNodeName}
                  onClose={handleCloseDrawer}
                  onUpdate:visible={(v: boolean) => (drawerVisible.value = v)}
                  onUpdate:nodeData={(v: any) => (currentNode.value = v)}
                />
              )
            case 'http':
              return (
                <HttpDrawer
                  visible={drawerVisible.value}
                  nodeData={currentNode.value}
                  graph={graph.value}
                  setNodeName={setNodeName}
                  onClose={handleCloseDrawer}
                  onUpdate:visible={(v: boolean) => (drawerVisible.value = v)}
                  onUpdate:nodeData={(v: any) => (currentNode.value = v)}
                />
              )
            case 'shell':
              return (
                <ShellDrawer
                  visible={drawerVisible.value}
                  nodeData={currentNode.value}
                  graph={graph.value}
                  setNodeName={setNodeName}
                  onClose={handleCloseDrawer}
                  onUpdate:visible={(v: boolean) => (drawerVisible.value = v)}
                  onUpdate:nodeData={(v: any) => (currentNode.value = v)}
                />
              )
            case 'datax':
              return (
                <DataxDrawer
                  visible={drawerVisible.value}
                  nodeData={currentNode.value}
                  graph={graph.value}
                  setNodeName={setNodeName}
                  onClose={handleCloseDrawer}
                  onUpdate:visible={(v: boolean) => (drawerVisible.value = v)}
                  onUpdate:nodeData={(v: any) => (currentNode.value = v)}
                />
              )
            case 'sql':
            default:
              return (
                <SQLDrawer
                  visible={drawerVisible.value}
                  nodeData={currentNode.value}
                  graph={graph.value}
                  setNodeName={setNodeName}
                  onClose={handleCloseDrawer}
                  onUpdate:visible={(v: boolean) => (drawerVisible.value = v)}
                  onUpdate:nodeData={(v: any) => (currentNode.value = v)}
                />
              )
          }
        })()}
      </div>
    )
  }
})
