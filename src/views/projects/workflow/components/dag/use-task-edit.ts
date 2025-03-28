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

import { ref, onMounted, watch } from 'vue'
import { remove, cloneDeep } from 'lodash'
import { TaskType } from '@/store/project/types'
import { formatParams } from '@/views/projects/task/components/node/format-data'
import { useCellUpdate } from './dag-hooks'
import type { Ref } from 'vue'
import type { Graph } from '@antv/x6'
import type {
  Coordinate,
  NodeData,
  WorkflowDefinition,
  EditWorkflowDefinition
} from './types'

interface Options {
  graph: Ref<Graph | undefined>
  definition: Ref<WorkflowDefinition | undefined>
  onNodeClick?: (type: string, name: string) => void
}

/**
 * Edit task configuration when dbclick
 * @param {Options} options
 * @returns
 */
export function useTaskEdit(options: Options) {
  const { graph, definition, onNodeClick } = options
  const {
    addNode,
    removeNode,
    getSources,
    getTargets,
    setNodeName,
    setNodeFillColor,
    setNodeEdge
  } = useCellUpdate({
    graph
  })
  const processDefinition = ref(
    definition?.value || {
      processDefinition: {},
      processTaskRelationList: [],
      taskDefinitionList: []
    }
  ) as Ref<EditWorkflowDefinition>

  const currTask = ref<NodeData>({
    taskType: 'SHELL',
    code: 0,
    name: ''
  })
  const taskModalVisible = ref(false)
  const sqlModalVisible = ref(false)
  const createModalVisible = ref(false)

  /**
   * Append a new task
   */
  function appendTask(code: number, type: TaskType, coordinate: Coordinate) {
    addNode(code + '', type, '', 'YES', coordinate)
    // workflowDefinition.value.taskDefinitionList.push({
    //   code,
    //   taskType: type,
    //   name: ''
    // })
    // openTaskModal({ code, taskType: type, name: '' })
    openCreateModal({ code, taskType: type, name: '' })
  }

  /**
   * Copy a task
   */
  function copyTask(
    name: string,
    code: number,
    targetCode: number,
    type: TaskType,
    flag: string,
    coordinate: Coordinate
  ) {
    addNode(code + '', type, name, flag, coordinate)
    const definition = processDefinition.value.taskDefinitionList.find(
      (t) => t.code === targetCode
    )

    const newDefinition = {
      ...cloneDeep(definition),
      code,
      name
    } as NodeData

    processDefinition.value.taskDefinitionList.push(newDefinition)
  }

  /**
   * Remove task
   * @param {number} codes
   */
  function removeTasks(codes: number[], cells: any[]) {
    processDefinition.value.taskDefinitionList =
      processDefinition.value.taskDefinitionList.filter(
        (task) => !codes.includes(task.code)
      )
    codes.forEach((code: number) => {
      remove(
        processDefinition.value.processTaskRelationList,
        (process) =>
          process.postTaskCode === code || process.preTaskCode === code
      )
    })
    cells?.forEach((cell) => {
      if (cell.isEdge()) {
        const preTaskCode = cell.getSourceCellId()
        const postTaskCode = cell.getTargetCellId()
        remove(
          processDefinition.value.processTaskRelationList,
          (process) =>
            String(process.postTaskCode) === postTaskCode &&
            String(process.preTaskCode) === preTaskCode
        )
      }
    })
  }

  function openTaskModal(task: NodeData) {
    currTask.value = task
    taskModalVisible.value = true
  }

  /**
   * Edit task
   * @param {number} code
   */
  function editTask(code: number) {
    const task = processDefinition.value.taskDefinitionList.find(
      (t) => t.code === code
    )
    if (task && onNodeClick) {
      currTask.value = task
      if (task.taskType === 'SQL' || task.taskType === 'SHELL') {
        onNodeClick('sql', task.name || '')
      } else if (task.taskType === 'SPARK') {
        onNodeClick('scala', task.name || '')
      } else if (task.taskType === 'JAVA') {
        onNodeClick('java', task.name || '')
      } else if (task.taskType === 'PYTHON') {
        onNodeClick('python', task.name || '')
      } else if (task.taskType === 'DATAX') {
        onNodeClick('datax', task.name || '')
      }
    }
  }

  /**
   * The confirm event in task config modal
   * @param formRef
   * @param from
   */
  function taskConfirm({ data }: any) {
    const taskDef = formatParams(data).taskDefinitionJsonObj as NodeData

    // override target config
    processDefinition.value.taskDefinitionList =
      processDefinition.value.taskDefinitionList.map((task) => {
        if (task.code === currTask.value?.code) {
          setNodeName(task.code + '', taskDef.name)
          let fillColor = '#ffffff'
          if (taskDef.flag === 'NO') {
            fillColor = 'var(--custom-disable-bg)'
          }

          setNodeFillColor(task.code + '', fillColor)

          setNodeEdge(String(task.code), data.preTasks)
          updatePreTasks(data.preTasks, task.code)
          return {
            ...taskDef,
            version: task.version,
            code: task.code,
            taskType: currTask.value.taskType,
            id: task.id
          }
        }
        return task
      })
    taskModalVisible.value = false
  }

  /**
   * The cancel event in task config modal
   */
  function taskCancel() {
    taskModalVisible.value = false
    if (!currTask.value.name) {
      removeNode(String(currTask.value.code))
      remove(
        processDefinition.value.taskDefinitionList,
        (task) => task.code === currTask.value.code
      )
    }
  }

  function updatePreTasks(preTasks: number[], code: number) {
    if (processDefinition.value?.processTaskRelationList?.length) {
      remove(
        processDefinition.value.processTaskRelationList,
        (process) => process.postTaskCode === code
      )
    }
    if (!preTasks?.length) return
    preTasks.forEach((task) => {
      processDefinition.value?.processTaskRelationList.push({
        postTaskCode: code,
        preTaskCode: task,
        name: '',
        preTaskVersion: 1,
        postTaskVersion: 1,
        conditionType: 'NONE',
        conditionParams: {}
      })
    })
  }

  function updatePostTasks(code: number) {
    const targets = getTargets(String(code))
    targets.forEach((target: number) => {
      if (
        !processDefinition.value?.processTaskRelationList.find(
          (relation) =>
            relation.postTaskCode === target && relation.preTaskCode === code
        )
      ) {
        processDefinition.value?.processTaskRelationList.push({
          postTaskCode: target,
          preTaskCode: code,
          name: '',
          preTaskVersion: 1,
          postTaskVersion: 1,
          conditionType: 'NONE',
          conditionParams: {}
        })
      }
    })
  }

  const sqlConfirm = (data: any) => {
    // 处理 SQL 任务的保存逻辑
    sqlModalVisible.value = false
  }

  const sqlCancel = () => {
    sqlModalVisible.value = false
  }

  const createModalConfirm = ({ data }: any) => {
    // 处理表单数据
    const taskDef = formatParams(data).taskDefinitionJsonObj as NodeData

    // 更新任务定义列表
    processDefinition.value.taskDefinitionList.push({
      ...taskDef,
      code: currTask.value.code,
      taskType: currTask.value.taskType,
      name: data.name,
      description: data.description
    })
    // 设置节点名称
    setNodeName(currTask.value.code + '', data.name)

    // 关闭弹窗
    createModalVisible.value = false
  }

  const createModalCancel = () => {
    createModalVisible.value = false
    if (!currTask.value.name) {
      removeNode(String(currTask.value.code))
      remove(
        processDefinition.value.taskDefinitionList,
        (task) => task.code === currTask.value.code
      )
    }
  }

  function openCreateModal(task: NodeData) {
    currTask.value = task
    createModalVisible.value = true
  }

  onMounted(() => {
    if (graph.value) {
      graph.value.on('cell:dblclick', ({ cell }) => {
        const code = Number(cell.id)
        editTask(code)
      })
    }
  })

  watch(definition, () => {
    if (definition.value) processDefinition.value = definition.value
  })

  return {
    currTask,
    taskModalVisible,
    sqlModalVisible,
    processDefinition,
    taskConfirm,
    taskCancel,
    sqlConfirm,
    sqlCancel,
    appendTask,
    editTask,
    copyTask,
    removeTasks,
    createModalVisible,
    createModalConfirm,
    createModalCancel
  }
}
