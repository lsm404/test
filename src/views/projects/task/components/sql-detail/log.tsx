import { defineComponent, PropType } from 'vue'
import { NCard } from 'naive-ui'
import Styles from './log.module.scss'

const props = {
  logs: {
    type: Object as PropType<{
      all: string
      error: string
      warning: string
      info: string
    }>,
    required: true
  },
  logLine: {
    type: Number as PropType<number>,
    default: 1
  },
  scriptViewState: {
    type: Object as PropType<any>,
    required: true
  },
  height: {
    type: Number as PropType<number>,
    required: true
  }
}

export default defineComponent({
  name: 'sql-log',
  props,
  setup(props) {
    return () => (
      <div class={Styles.container} style={{ height: props.height + 'px' }}>
        <NCard title='日志' class={Styles.card}>
          <pre class={Styles.log}>{props.logs?.all || ''}</pre>
        </NCard>
      </div>
    )
  }
})
