/*
 * @Author: lishengmin shengminfang@foxmail.com
 * @Date: 2025-03-19 11:17:10
 * @LastEditors: lishengmin shengminfang@foxmail.com
 * @LastEditTime: 2025-03-19 11:21:20
 * @FilePath: /dolphinscheduler-ui/src/views/projects/task/components/node/result.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineComponent, PropType, ref } from 'vue'
import { NDataTable, NPagination } from 'naive-ui'
import Styles from './result.module.scss'

const props = {
  result: {
    type: Object as PropType<any>,
    required: true
  },
  script: {
    type: Object as PropType<any>,
    required: true
  },
  height: {
    type: Number as PropType<number>,
    required: true
  }
}

export default defineComponent({
  name: 'sql-result',
  props,
  setup(props) {
    const page = ref(1)
    const pageSize = ref(20)

    const columns =
      props.result.headRows?.map((col: string) => ({
        title: col,
        key: col,
        width: 150
      })) || []

    const data =
      props.result.bodyRows?.map((row: any[], index: number) => {
        const item: Record<string, any> = { key: index }
        props.result.headRows?.forEach((col: string, i: number) => {
          item[col] = row[i]
        })
        return item
      }) || []

    const handlePageChange = (currentPage: number) => {
      page.value = currentPage
    }

    const handlePageSizeChange = (size: number) => {
      pageSize.value = size
      page.value = 1
    }

    return () => (
      <div class={Styles.container} style={{ height: props.height + 'px' }}>
        <NDataTable
          columns={columns}
          data={data.slice(
            (page.value - 1) * pageSize.value,
            page.value * pageSize.value
          )}
          maxHeight={(props.height || 300) - 50}
          scrollX={columns.length * 150}
        />
        <NPagination
          page={page.value}
          pageSize={pageSize.value}
          itemCount={data.length}
          onUpdatePage={handlePageChange}
          onUpdatePageSize={handlePageSizeChange}
          showSizePicker
          pageSizes={[10, 20, 30, 40, 50]}
        />
      </div>
    )
  }
})
