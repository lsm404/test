import { defineComponent, PropType } from 'vue'
import { NDataTable } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import Styles from './history.module.scss'

const props = {
  history: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  runType: {
    type: String as PropType<string>,
    default: ''
  }
}

export default defineComponent({
  name: 'sql-history',
  props,
  setup(props) {
    const { t } = useI18n()

    const columns = [
      {
        title: t('project.task.task_name'),
        key: 'taskName',
        width: 150
      },
      {
        title: t('project.task.execution_time'),
        key: 'startTime',
        width: 180
      },
      {
        title: t('project.task.end_time'),
        key: 'endTime',
        width: 180
      },
      {
        title: t('project.task.execution_status'),
        key: 'state',
        width: 120
      },
      {
        title: t('project.task.run_type'),
        key: 'runType',
        width: 120
      },
      {
        title: t('project.task.duration'),
        key: 'duration',
        width: 120
      }
    ]

    return () => (
      <div class={Styles.container}>
        <NDataTable
          columns={columns}
          data={props.history}
          striped
          size='small'
          scrollX={columns.reduce((sum, col) => sum + (col.width || 0), 0)}
        />
      </div>
    )
  }
})
