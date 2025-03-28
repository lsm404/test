import { defineComponent, PropType, ref, watch, reactive } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSelect,
  FormInst
} from 'naive-ui'
import { Graph } from '@antv/x6'

const props = {
  visible: {
    type: Boolean,
    default: false
  },
  nodeData: {
    type: Object,
    default: () => ({})
  },
  graph: {
    type: Object as PropType<Graph | undefined>,
    required: true
  },
  setNodeName: {
    type: Function as PropType<(id: string, name: string) => void>,
    required: true
  },
  onClose: {
    type: Function as PropType<() => void>,
    required: true,
    default: () => {}
  }
}

export default defineComponent({
  name: 'HttpNodeDrawer',
  props,
  emits: ['update:visible', 'update:nodeData'],
  setup(props, { emit }) {
    const formRef = ref<FormInst | null>(null)
    const originalTaskName = ref('')

    // 本地表单模型
    const formValue = reactive({
      taskName: '',
      url: '',
      method: '',
      description: ''
    })

    // 当抽屉打开时初始化表单数据
    watch(
      () => props.visible,
      (newVisible) => {
        if (newVisible && props.nodeData) {
          originalTaskName.value = props.nodeData.taskName || ''

          // 复制数据到表单模型
          formValue.taskName = props.nodeData.taskName || ''
          formValue.url = props.nodeData.url || ''
          formValue.method = props.nodeData.method || ''
          formValue.description = props.nodeData.description || ''
        }
      }
    )

    // 同步表单值到父组件
    watch(
      () => formValue,
      (newVal) => {
        if (props.visible) {
          const updatedNode = { ...props.nodeData, ...newVal }
          emit('update:nodeData', updatedNode)
        }
      },
      { deep: true }
    )

    // 验证规则
    const rules = {
      taskName: {
        required: true,
        message: '请输入节点名称',
        trigger: 'blur'
      }
    }

    // 处理保存
    const handleSave = () => {
      formRef.value?.validate((errors) => {
        if (!errors) {
          if (props.nodeData && props.graph) {
            const cells = props.graph.getCells()
            const matchingCell = cells.find((cell) => {
              const data = cell.getData()
              return data && data.taskName === originalTaskName.value
            })

            if (matchingCell) {
              props.setNodeName?.(matchingCell.id, formValue.taskName)
              props.onClose?.()
              window.$message.success('节点配置已保存')
            } else {
              window.$message.error('更新失败：未找到匹配的节点')
            }
          } else {
            props.onClose?.()
          }
        }
      })
    }

    return () => (
      <NDrawer
        show={props.visible}
        onUpdateShow={(v: boolean) => emit('update:visible', v)}
        width={400}
        placement='right'
        zIndex={1001}
        show-mask={false}
      >
        <NDrawerContent title='HTTP节点配置'>
          <NForm ref={formRef} model={formValue} rules={rules}>
            <NFormItem label='节点名称' path='taskName' required>
              <NInput v-model:value={formValue.taskName} />
            </NFormItem>

            <NFormItem label='请求URL' path='url'>
              <NInput
                v-model:value={formValue.url}
                placeholder='https://example.com/api'
              />
            </NFormItem>

            <NFormItem label='HTTP方法' path='method'>
              <NSelect
                v-model:value={formValue.method}
                options={[
                  { label: 'GET', value: 'GET' },
                  { label: 'POST', value: 'POST' },
                  { label: 'PUT', value: 'PUT' },
                  { label: 'DELETE', value: 'DELETE' },
                  { label: 'PATCH', value: 'PATCH' }
                ]}
              />
            </NFormItem>

            <NFormItem label='节点描述' path='description'>
              <NInput type='textarea' v-model:value={formValue.description} />
            </NFormItem>

            <NFormItem>
              <div style='display: flex; justify-content: flex-end; margin-top: 24px;'>
                <NButton type='primary' onClick={handleSave}>
                  保存
                </NButton>
              </div>
            </NFormItem>
          </NForm>
        </NDrawerContent>
      </NDrawer>
    )
  }
})
