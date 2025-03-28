import {
  defineComponent,
  ref,
  onMounted,
  onBeforeUnmount,
  reactive,
  h,
  PropType
} from 'vue'
import {
  NTree,
  NDropdown,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSpace,
  NIcon
} from 'naive-ui'
import { FolderOutlined, FileOutlined } from '@vicons/antd'
import type { TreeOption, DropdownOption, FormInst } from 'naive-ui'
import Styles from './org-tree.module.scss'

export default defineComponent({
  name: 'OrgTree',
  props: {
    onCreateNode: {
      type: Function as PropType<
        (params: { nodeType: string; parentNode: TreeOption }) => void
      >,
      required: true
    },
    onCreateFlow: {
      type: Function as PropType<
        (params: { flowType: string; parentNode: TreeOption }) => void
      >,
      required: true
    },
    onWorkflowClick: {
      type: Function as PropType<(workflowData: any) => void>,
      required: true
    }
  },
  emits: ['createNode', 'createFlow', 'workflowClick'],
  setup(props) {
    const treeRef = ref<HTMLElement | null>(null)
    const formRef = ref<FormInst | null>(null)

    // 当前选中的节点
    const selectedNode = ref<TreeOption | null>(null)
    // 右键菜单位置
    const menuPosition = ref({
      x: 0,
      y: 0
    })
    // 控制菜单显示
    const showMenu = ref(false)
    // 控制弹窗显示
    const showModal = ref(false)
    // 当前操作类型
    const currentAction = ref('')

    // 表单数据
    const formData = reactive({
      name: ''
    })

    // 树节点数据
    const treeData = ref<TreeOption[]>([
      {
        key: 'root',
        label: '组织树',
        children: [
          {
            key: '1',
            label: '数据集成',
            children: [
              {
                key: '1-1',
                label: '工作流1',
                type: 'flow'
              },
              {
                key: '1-2',
                label: '工作流2',
                type: 'flow'
              }
            ]
          },
          {
            key: '2',
            label: '数据开发',
            children: [
              {
                key: '2-1',
                label: '工作流3',
                type: 'flow'
              },
              {
                key: '2-2',
                label: '工作流4',
                type: 'flow'
              }
            ]
          }
        ]
      }
    ])

    // 菜单选项
    const menuOptions = ref<DropdownOption[]>([])

    // 自定义渲染树节点
    const renderLabel = ({ option }: { option: TreeOption }) => {
      // 判断是否显示文件夹图标（有子节点的节点）或文件图标（叶子节点）
      const isFolder = option.children && option.children.length > 0

      return h(
        'div',
        {
          style: 'display: flex; align-items: center;',
          onClick: (e) => {
            // 不要阻止事件冒泡，让事件继续传播以更新选中状态
            // 但我们仍然可以在这里处理工作流点击
            if (option.type === 'flow') {
              console.log('Clicking flow node:', option, e)
              props.onWorkflowClick(option)
            }
          }
        },
        [
          h(
            NIcon,
            { style: 'margin-right: 8px;' },
            { default: () => h(isFolder ? FolderOutlined : FileOutlined) }
          ),
          option.label as string
        ]
      )
    }

    // 修改菜单选项，根据节点类型显示不同的菜单
    const getMenuOptions = (nodeType?: string): DropdownOption[] => {
      if (nodeType === 'flow') {
        return [
          {
            label: '编辑',
            key: 'editFlow'
          },
          {
            label: '删除',
            key: 'deleteFlow'
          }
        ]
      } else {
        return [
          {
            label: '新建节点',
            key: 'createNode'
          },
          {
            label: '新建数据流',
            key: 'createFlow'
          }
        ]
      }
    }

    // 处理菜单选择
    const handleSelect = (key: string) => {
      if (!selectedNode.value) return

      showMenu.value = false

      if (key === 'editFlow') {
        // 编辑流程
        currentAction.value = 'editFlow'
        formData.name = selectedNode.value.label as string // 设置当前名称
        showModal.value = true
      } else if (key === 'deleteFlow') {
        // 删除流程
        handleDeleteFlow()
      } else {
        // 创建节点或流程
        currentAction.value = key
        formData.name = '' // 重置表单
        showModal.value = true
      }
    }

    // 处理删除流程
    const handleDeleteFlow = () => {
      if (!selectedNode.value) return

      // 找到父节点
      const findParentNode = (
        nodes: TreeOption[],
        key: string
      ): { parent: TreeOption; index: number } | null => {
        for (const node of nodes) {
          if (node.children) {
            const index = node.children.findIndex((child) => child.key === key)
            if (index !== -1) {
              return { parent: node, index }
            }

            const result = findParentNode(node.children, key)
            if (result) return result
          }
        }
        return null
      }

      if (typeof selectedNode.value?.key === 'string') {
        const result = findParentNode(treeData.value, selectedNode.value.key)
        if (result) {
          // 从父节点的children中删除
          result.parent.children?.splice(result.index, 1)
          selectedNode.value = null
        }
      }
    }

    // 修改表单提交处理
    const handleSubmit = () => {
      formRef.value?.validate((errors) => {
        if (!errors) {
          if (currentAction.value === 'editFlow') {
            // 编辑流程名称
            if (selectedNode.value) {
              selectedNode.value.label = formData.name
            }
          } else if (currentAction.value === 'createNode') {
            props.onCreateNode({
              nodeType: 'shell', // 默认类型，可以根据需要修改
              parentNode: selectedNode.value,
              name: formData.name
            })

            // 在树中添加新节点
            if (selectedNode.value && selectedNode.value.children) {
              const newNode: TreeOption = {
                key: `${selectedNode.value.key}-${Date.now()}`,
                label: formData.name,
                children: [] // 节点可以有子节点
              }
              selectedNode.value.children.push(newNode)
            }
          } else if (currentAction.value === 'createFlow') {
            props.onCreateFlow({
              flowType: 'import', // 默认类型，可以根据需要修改
              parentNode: selectedNode.value,
              name: formData.name
            })

            // 在树中添加新节点
            if (selectedNode.value && selectedNode.value.children) {
              const newNode: TreeOption = {
                key: `${selectedNode.value.key}-${Date.now()}`,
                label: formData.name,
                // 数据流节点没有 children 属性，使其成为叶子节点
                type: 'flow' // 添加类型标识
              }
              selectedNode.value.children.push(newNode)
            }
          }
          showModal.value = false
        }
      })
    }

    // 修改右键菜单处理
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // 获取点击的节点元素
      const target = e.target as HTMLElement
      const nodeEl = target.closest('.n-tree-node-content') as HTMLElement

      if (!nodeEl) {
        return
      }

      // 获取节点的文本内容
      const label = nodeEl.textContent?.trim()

      // 查找对应的节点数据
      const findNode = (
        nodes: TreeOption[],
        label: string
      ): TreeOption | null => {
        for (const node of nodes) {
          if (node.label === label) return node
          if (node.children) {
            const found = findNode(node.children, label)
            if (found) return found
          }
        }
        return null
      }

      const node = findNode(treeData.value, label || '')

      if (!node) {
        return
      }

      selectedNode.value = node
      menuPosition.value = {
        x: e.clientX,
        y: e.clientY
      }

      // 根据节点类型设置菜单选项
      menuOptions.value = getMenuOptions(node.type as string)
      showMenu.value = true
    }

    // 点击其他地方关闭菜单
    const handleClickOutside = () => {
      showMenu.value = false
    }

    // 处理节点点击
    const handleNodeClick = (node: TreeOption) => {
      // 更新选中的节点
      selectedNode.value = node

      // 检查节点类型并调用回调
      if (node.type === 'flow') {
        console.log('Calling onWorkflowClick with node:', node)
        props.onWorkflowClick(node)
      }
    }

    onMounted(() => {
      if (treeRef.value) {
        treeRef.value.addEventListener('contextmenu', handleContextMenu)
      }
      document.addEventListener('click', handleClickOutside)
    })

    onBeforeUnmount(() => {
      if (treeRef.value) {
        treeRef.value.removeEventListener('contextmenu', handleContextMenu)
      }
      document.removeEventListener('click', handleClickOutside)
    })

    return () => (
      <div class='org-tree' ref={treeRef}>
        <div class={Styles.title}>数据开发</div>
        <NTree
          data={treeData.value}
          blockLine
          selectable={true}
          selectedKeys={selectedNode.value ? [selectedNode.value.key] : []}
          renderLabel={renderLabel}
          onUpdateSelectedKeys={(keys: string[]) => {
            // 找到对应的节点
            const findNodeByKey = (
              nodes: TreeOption[],
              key: string
            ): TreeOption | null => {
              for (const node of nodes) {
                if (node.key === key) return node
                if (node.children) {
                  const found = findNodeByKey(node.children, key)
                  if (found) return found
                }
              }
              return null
            }

            if (keys.length > 0) {
              const key = keys[0]
              const node = findNodeByKey(treeData.value, key)
              if (node) {
                selectedNode.value = node
              }
            } else {
              selectedNode.value = null
            }
          }}
        />
        <NDropdown
          show={showMenu.value}
          trigger='manual'
          options={menuOptions.value}
          onSelect={handleSelect}
          x={menuPosition.value.x}
          y={menuPosition.value.y}
          placement='bottom-start'
        />
        <NModal
          show={showModal.value}
          title={
            currentAction.value === 'createNode'
              ? '新建节点'
              : currentAction.value === 'editFlow'
              ? '编辑流程'
              : '删除流程'
          }
          preset='dialog'
          onClose={() => (showModal.value = false)}
        >
          <NForm ref={formRef} model={formData}>
            <NFormItem
              label='名称'
              path='name'
              rule={[{ required: true, message: '请输入名称' }]}
            >
              <NInput
                v-model={[formData.name, 'value']}
                placeholder='请输入名称'
              />
            </NFormItem>
          </NForm>
          <div style='display: flex; justify-content: flex-end; margin-top: 20px;'>
            <NSpace>
              <NButton onClick={() => (showModal.value = false)}>取消</NButton>
              <NButton type='primary' onClick={handleSubmit}>
                确定
              </NButton>
            </NSpace>
          </div>
        </NModal>
      </div>
    )
  }
})
