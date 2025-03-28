import { defineComponent, PropType, ref, watch, reactive } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NButton,
  FormInst,
  NTag,
  NDivider,
  NSelect
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
  name: 'NodeDrawer',
  props,
  emits: ['update:visible', 'update:nodeData'],
  setup(props, { emit }) {
    const formRef = ref<FormInst | null>(null)
    const originalTaskName = ref('')

    // 使用本地表单模型
    const formValue = reactive({
      taskName: '',
      businessTag: '',
      appTags: [] as string[],
      description: '',
      sparkDriverMemory: '1g',
      sparkExecutorMemory: '1g',
      sparkExecutorCores: '1',
      wdsLinkisYarnqueue: 'default',
      isReusable: true
    })

    // 当抽屉打开时初始化表单数据
    watch(
      () => props.visible,
      (newVisible) => {
        if (newVisible && props.nodeData) {
          // 保存原始名称用于查找
          originalTaskName.value = props.nodeData.taskName || ''

          // 复制数据到表单模型
          formValue.taskName = props.nodeData.taskName || ''
          formValue.businessTag = props.nodeData.businessTag || ''
          formValue.appTags = props.nodeData.appTags || []
          formValue.description = props.nodeData.description || ''
          formValue.sparkDriverMemory = props.nodeData.sparkDriverMemory || '1g'
          formValue.sparkExecutorMemory =
            props.nodeData.sparkExecutorMemory || '1g'
          formValue.sparkExecutorCores =
            props.nodeData.sparkExecutorCores || '1'
          formValue.wdsLinkisYarnqueue =
            props.nodeData.wdsLinkisYarnqueue || 'default'
          formValue.isReusable = props.nodeData.isReusable !== false
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
              window.$message.success('节点配置已保存')
              props.onClose?.()
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
        <NDrawerContent title='节点配置'>
          <NForm ref={formRef} model={formValue} rules={rules}>
            <NFormItem label='节点名称' path='taskName' required>
              <NInput v-model:value={formValue.taskName} />
            </NFormItem>

            <NFormItem label='业务标签' path='businessTag'>
              <NInput v-model:value={formValue.businessTag} />
            </NFormItem>

            <NFormItem label='应用标签' path='appTags'>
              <NInput
                type='text'
                placeholder='添加标签'
                onKeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement
                    if (target.value) {
                      formValue.appTags.push(target.value)
                      target.value = ''
                    }
                  }
                }}
              />
              <div style='margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;'>
                {formValue.appTags.map((tag, index) => (
                  <NTag
                    key={index}
                    closable
                    onClose={() => {
                      formValue.appTags.splice(index, 1)
                    }}
                  >
                    {tag}
                  </NTag>
                ))}
              </div>
            </NFormItem>

            <NFormItem label='节点描述' path='description'>
              <NInput type='textarea' v-model:value={formValue.description} />
            </NFormItem>

            <NDivider>属性信息</NDivider>

            <NFormItem label='spark-driver-memory' path='sparkDriverMemory'>
              <NInput v-model:value={formValue.sparkDriverMemory} />
            </NFormItem>

            <NFormItem label='spark-executor-memory' path='sparkExecutorMemory'>
              <NInput v-model:value={formValue.sparkExecutorMemory} />
            </NFormItem>

            <NFormItem label='spark-executor-cores' path='sparkExecutorCores'>
              <NInput v-model:value={formValue.sparkExecutorCores} />
            </NFormItem>

            <NFormItem label='wds-linkis-yarnqueue' path='wdsLinkisYarnqueue'>
              <NInput v-model:value={formValue.wdsLinkisYarnqueue} />
            </NFormItem>

            <NFormItem label='是否复用引擎' path='isReusable'>
              <NSelect
                v-model:value={formValue.isReusable}
                options={[
                  { label: '是', value: true },
                  { label: '否', value: false }
                ]}
              />
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
