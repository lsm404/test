/*
 * @Author: lishengmin shengminfang@foxmail.com
 * @Date: 2025-03-18 11:14:04
 * @LastEditors: lishengmin shengminfang@foxmail.com
 * @LastEditTime: 2025-03-25 14:53:15
 * @FilePath: /dolphinscheduler-ui/src/views/projects/task/components/node/editor.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineComponent, ref, PropType } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import {
  RefreshOutline as RedoIcon,
  ArrowUndoOutline as UndoIcon,
  PlayOutline as PlayIcon,
  StopOutline as StopIcon
} from '@vicons/ionicons5'
import MonacoEditorComponent from '@/components/monaco-editor'
import Styles from './editor.module.scss'
import type { NodeData } from '../../../workflow/components/dag/types'
import type { editor } from 'monaco-editor'
import { debounce } from 'lodash'

const props = {
  script: {
    type: Object as PropType<NodeData & { sql?: string }>,
    required: true
  },
  scriptType: {
    type: String as PropType<string>,
    default: 'SQL'
  },
  readonly: {
    type: Boolean as PropType<boolean>,
    default: false
  }
}

export default defineComponent({
  name: 'Editor',
  props,
  emits: ['save', 'run', 'stop'],
  setup(props, ctx) {
    const editorInstance = ref<editor.IStandaloneCodeEditor>()
    const currentValue = ref(props.script?.sql || '')

    // 处理编辑器内容变化
    const handleChange = (value: string) => {
      currentValue.value = value
    }

    // 处理保存按钮点击
    const ignoredHandleSave = debounce(() => {
      ctx.emit('save', { sql: currentValue.value })
    }, 1000)

    // 处理运行按钮点击
    const handleRun = debounce(() => {
      ctx.emit('run', { sql: currentValue.value })
    }, 1000)

    const handleStop = debounce(() => {
      ctx.emit('stop')
    }, 1000)

    const handleUndo = () => {
      editorInstance.value?.trigger('keyboard', 'undo', null)
    }

    const handleRedo = () => {
      editorInstance.value?.trigger('keyboard', 'redo', null)
    }

    const handleEditorMounted = (editor: editor.IStandaloneCodeEditor) => {
      editorInstance.value = editor
      if (props.script?.sql) {
        handleChange(props.script.sql)
      }
    }

    return () => (
      <div class={Styles.container}>
        <div class={Styles.toolbar}>
          {/* <NButton
            type='primary'
            onClick={handleSave}
            disabled={props.readonly}
          >
            保存
          </NButton> */}
          <NButton
            text
            class={Styles.toolButton}
            onClick={handleUndo}
            disabled={props.readonly}
          >
            <NIcon>
              <UndoIcon />
            </NIcon>
            撤销
          </NButton>
          <NButton
            text
            class={Styles.toolButton}
            onClick={handleRedo}
            disabled={props.readonly}
          >
            <NIcon>
              <RedoIcon />
            </NIcon>
            恢复
          </NButton>
          <NButton
            text
            class={Styles.toolButton}
            onClick={handleRun}
            disabled={props.readonly}
          >
            <NIcon>
              <PlayIcon />
            </NIcon>
            运行
          </NButton>
          <NButton
            text
            class={Styles.toolButton}
            onClick={handleStop}
            disabled={props.readonly}
          >
            <NIcon>
              <StopIcon />
            </NIcon>
            停止
          </NButton>
        </div>
        <div class={Styles.editor}>
          <MonacoEditorComponent
            defaultValue={props.script?.sql || ''}
            options={{
              language: 'sql',
              theme: 'vs',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              readOnly: props.readonly,
              automaticLayout: true,
              suggestOnTriggerCharacters: true
            }}
            onChange={handleChange}
            onMounted={handleEditorMounted}
          />
        </div>
      </div>
    )
  }
})
