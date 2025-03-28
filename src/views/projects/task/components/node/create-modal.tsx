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

import {
  defineComponent,
  PropType,
  ref,
  watch,
  nextTick,
  provide,
  computed,
  h,
  Ref,
  onMounted
} from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/modal'
import Detail from './detail'
import { formatModel } from './format-data'
import {
  HistoryOutlined,
  ProfileOutlined,
  QuestionCircleTwotone,
  BranchesOutlined
} from '@vicons/antd'
import { NIcon } from 'naive-ui'
import { TASK_TYPES_MAP } from '../../constants/task-type'
import { Router, useRouter } from 'vue-router'
import { useTaskNodeStore } from '@/store/project/task-node'
import type {
  ITaskData,
  ITaskType,
  EditWorkflowDefinition,
  IWorkflowTaskInstance,
  WorkflowInstance
} from './types'
import { queryProjectPreferenceByProjectCode } from '@/service/modules/projects-preference'
import { INodeData } from './types'
import { NForm, NFormItem, NInput } from 'naive-ui'

const props = {
  show: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  data: {
    type: Object as PropType<ITaskData>,
    default: { code: 0, taskType: 'SHELL', name: '' }
  },
  projectCode: {
    type: Number as PropType<number>,
    required: true,
    default: 0
  },
  readonly: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  from: {
    type: Number as PropType<number>,
    default: 0
  },
  definition: {
    type: Object as PropType<Ref<EditWorkflowDefinition>>
  },
  workflowInstance: {
    type: Object as PropType<WorkflowInstance>
  },
  taskInstance: {
    type: Object as PropType<IWorkflowTaskInstance>
  },
  saving: {
    type: Boolean,
    default: false
  }
}

const NodeDetailModal = defineComponent({
  name: 'NodeDetailModal',
  props,
  emits: ['cancel', 'submit'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const taskStore = useTaskNodeStore()

    const formValue = ref({
      name: '',
      description: ''
    })

    watch(
      () => props.data,
      (newData) => {
        if (newData) {
          formValue.value = {
            name: newData.name || '',
            description: newData.description || ''
          }
        }
      },
      { immediate: true }
    )

    watch(
      () => props.show,
      (show) => {
        if (show) {
          taskStore.init()
        }
      }
    )

    const onConfirm = () => {
      if (!formValue.value.name) {
        window.$message.warning(t('project.node.name_tips'))
        return
      }

      emit('submit', {
        data: {
          ...props.data,
          name: formValue.value.name,
          description: formValue.value.description
        }
      })
    }

    const onCancel = () => {
      emit('cancel')
    }

    return () => (
      <Modal
        show={props.show}
        title={t('project.node.current_node_settings')}
        onConfirm={onConfirm}
        onCancel={onCancel}
      >
        <NForm>
          <NFormItem label={t('project.node.name')} required>
            <NInput
              v-model:value={formValue.value.name}
              placeholder={t('project.node.name_tips')}
              disabled={props.readonly}
            />
          </NFormItem>
          <NFormItem label={t('project.node.description')}>
            <NInput
              v-model:value={formValue.value.description}
              type='textarea'
              placeholder={t('project.node.description_tips')}
              disabled={props.readonly}
            />
          </NFormItem>
        </NForm>
      </Modal>
    )
  }
})

export default NodeDetailModal
