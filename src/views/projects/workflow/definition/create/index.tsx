/*
 * @Author: lishengmin shengminfang@foxmail.com
 * @Date: 2024-07-20 14:22:53
 * @LastEditors: lishengmin shengminfang@foxmail.com
 * @LastEditTime: 2025-03-27 15:27:45
 * @FilePath: /dolphinscheduler-ui/src/views/projects/workflow/definition/create/index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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

import { defineComponent, ref } from 'vue'
import {
  useMessage,
  NTabs,
  NTabPane,
  NNotificationProvider,
  NButton
} from 'naive-ui'
import Dag from '../../components/dag'
import { DynamicDag } from '@/views/projects/workflow/components/dynamic-dag'
import { useThemeStore } from '@/store/theme/theme'
import { useRoute, useRouter } from 'vue-router'
import {
  SaveForm,
  TaskDefinition,
  Connect,
  Location
} from '../../components/dag/types'
import { createProcessDefinition } from '@/service/modules/process-definition'
import { useI18n } from 'vue-i18n'
import Styles from './index.module.scss'
import OrgTree from '../components/org-tree'
import type { TreeOption } from 'naive-ui'
import SQLEditor from '@/views/projects/task/components/sql-detail/sql-editor'
import DataxEditor from '../../components/datax-editor'

interface SaveData {
  saveForm: SaveForm
  taskDefinitions: TaskDefinition[]
  connects: Connect[]
  locations: Location[]
}

export default defineComponent({
  name: 'WorkflowDefinitionCreate',
  setup() {
    const theme = useThemeStore()
    const message = useMessage()
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const projectCode = Number(route.params.projectCode)

    const activeTab = ref('dag')

    // 添加 tabs 管理
    const tabs = ref([{ name: 'dag', tab: '编辑模式' }])

    // 处理添加新 tab
    const handleAddTab = (type: string, name: string) => {
      const newTab = {
        name: name, // 使用节点名称作为 tab 的 name
        tab: `${type} ${name}` // tab 显示内容为 "类型 名称"
      }

      // 检查是否已存在相同的 tab
      if (!tabs.value.find((tab) => tab.name === name)) {
        tabs.value.push(newTab)
        activeTab.value = newTab.name
      } else {
        // 如果 tab 已存在，切换到该 tab
        activeTab.value = name
      }
    }

    // 添加关闭 tab 的处理函数
    const handleCloseTab = (name: string) => {
      // 不允许关闭 DAG 编辑器 tab
      if (name === 'dag') return

      const index = tabs.value.findIndex((tab) => tab.name === name)
      if (index !== -1) {
        tabs.value.splice(index, 1)
        // 如果关闭的是当前激活的 tab，则切换到前一个 tab
        if (activeTab.value === name) {
          activeTab.value = tabs.value[index - 1]?.name || 'dag'
        }
      }
    }

    // 从 Dag 组件接收点击事件
    const onDagClick = (type: string, name: string) => {
      handleAddTab(type, name)
    }

    // 添加一个 ref 来存储选中的工作流名称
    const selectedWorkflowName = ref('')

    // 更新 onSave 函数以使用选中的工作流名称
    const onSave = ({
      taskDefinitions,
      saveForm,
      connects,
      locations
    }: SaveData) => {
      const globalParams = saveForm.globalParams.map((p) => {
        return {
          prop: p.key,
          value: p.value,
          direct: p.direct,
          type: 'VARCHAR'
        }
      })

      // 如果有选中的工作流名称，则使用它，否则使用表单中的名称
      const workflowName = selectedWorkflowName.value || saveForm.name

      createProcessDefinition(
        {
          taskDefinitionJson: JSON.stringify(taskDefinitions),
          taskRelationJson: JSON.stringify(connects),
          locations: JSON.stringify(locations),
          name: workflowName,
          executionType: saveForm.executionType,
          description: saveForm.description,
          globalParams: JSON.stringify(globalParams),
          timeout: saveForm.timeoutFlag ? saveForm.timeout : 0
        },
        projectCode
      ).then((ignored: any) => {
        message.success(t('project.dag.success'))
        router.push({ path: `/projects/${projectCode}/workflow-definition` })
      })
    }

    // 处理创建节点
    const handleCreateNode = ({
      nodeType: ignoredNodeType,
      parentNode: ignoredParentNode
    }: {
      nodeType: string
      parentNode: TreeOption
    }) => {
      // 这里添加创建节点的逻辑
    }

    // 处理创建数据流
    const handleCreateFlow = ({
      flowType: ignoredFlowType,
      parentNode: ignoredParentNode
    }: {
      flowType: string
      parentNode: TreeOption
    }) => {
      // 这里添加创建数据流的逻辑
    }

    // 添加 DAG 组件的引用
    const dagRef = ref()

    // 添加重置 DAG 的状态
    const resetDagState = () => {
      // 重置 tabs 为只有 dag
      tabs.value = [{ name: 'dag', tab: '编辑模式' }]
      activeTab.value = 'dag'
    }

    // 添加一个标志来控制 DAG 组件的重新渲染
    const dagKey = ref(0)

    // 添加刷新 DAG 的方法
    const refreshDag = () => {
      // 重置 DAG 状态
      resetDagState()

      // 通过改变 key 强制重新渲染 DAG 组件
      dagKey.value++
    }

    // 更新 handleWorkflowClick 函数以添加日志
    const handleWorkflowClick = (workflowData: any) => {
      // 存储选中的工作流名称
      if (workflowData && workflowData.label) {
        console.log('Setting selectedWorkflowName to:', workflowData)
        selectedWorkflowName.value = workflowData.label
      }
      refreshDag()
    }

    return () => (
      <NNotificationProvider>
        <div
          class={[
            Styles.container,
            theme.darkTheme ? Styles['dark'] : Styles['light']
          ]}
        >
          {/* 左侧组织树 */}
          <div
            class={[
              Styles.tree,
              theme.darkTheme ? Styles['tree-dark'] : Styles['tree-light']
            ]}
          >
            <OrgTree
              onCreateNode={handleCreateNode}
              onCreateFlow={handleCreateFlow}
              onWorkflowClick={handleWorkflowClick}
            />
          </div>

          {/* 右侧 Tabs */}
          <div class={Styles.content}>
            <NTabs
              type='card'
              value={activeTab.value}
              onUpdateValue={(v: string) => (activeTab.value = v)}
              closable
              onClose={handleCloseTab}
            >
              {tabs.value.map((tab) => (
                <NTabPane
                  key={tab.name}
                  name={tab.name}
                  tab={tab.tab}
                  display-directive='show'
                  closable={tab.name !== 'dag'} // DAG 编辑器 tab 不可关闭
                >
                  {tab.name === 'dag' ? (
                    route.query.dynamic === 'true' ? (
                      <DynamicDag
                        key={`dynamic-dag-${dagKey.value}`}
                        onNodeClick={onDagClick}
                        ref={dagRef}
                      />
                    ) : (
                      <Dag
                        key={`dag-${dagKey.value}`}
                        projectCode={projectCode}
                        onSave={onSave}
                        onNodeClick={onDagClick}
                        ref={dagRef}
                        workflowName={selectedWorkflowName.value}
                        readonlyName={!!selectedWorkflowName.value}
                      />
                    )
                  ) : (
                    <div>
                      {/* 根据 tab 类型渲染不同的编辑器组件 */}
                      {tab.tab.includes('sql') ? (
                        <SQLEditor
                          data={{ sql: '', runType: 'QUERY' }}
                          readonly={false}
                        />
                      ) : tab.tab.includes('scala') ? (
                        <div>Scala Editor Content</div>
                      ) : tab.tab.includes('java') ? (
                        <div>Java Editor Content</div>
                      ) : tab.tab.includes('python') ? (
                        <div>Python Editor Content</div>
                      ) : tab.tab.includes('datax') ? (
                        <DataxEditor />
                      ) : (
                        <div>Generic Editor Content</div>
                      )}
                    </div>
                  )}
                </NTabPane>
              ))}
            </NTabs>
          </div>
        </div>
      </NNotificationProvider>
    )
  }
})
