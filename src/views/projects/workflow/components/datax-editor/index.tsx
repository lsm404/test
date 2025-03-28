import { defineComponent, ref } from 'vue'
import { NForm, NFormItem, NSelect, NCard } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const DataxEditor = defineComponent({
  name: 'DataxEditor',
  setup() {
    const { t } = useI18n()

    const sourceDb = ref('')
    const sourceTable = ref('')
    const targetDb = ref('')
    const targetTable = ref('')

    // 模拟数据源选项
    const dbOptions = [
      { label: 'MySQL', value: 'MySQL' },
      { label: 'PDB', value: 'PDB' }
    ]

    // 模拟表选项
    const tableOptions = [{ label: 't_tunnel_p', value: 't_tunnel_p' }]

    return () => (
      <div class='datax-editor'>
        <NCard title={t('配置数据来源与去向')} class='mb-4'>
          <div class='tip-block'>
            {t(
              '在这里配置数据的来源端和写入端，可以是默认认的数据源，也可以是您创建的自有数据源。查看支持的数据来源类型'
            )}
          </div>
        </NCard>

        <div class='source-target-container' style='display: flex; gap: 20px;'>
          <NCard title={t('数据来源')} style='flex: 1;'>
            <NForm labelPlacement='left' labelWidth={100}>
              <NFormItem label={t('数据源')} required>
                <NSelect
                  v-model:value={sourceDb.value}
                  options={dbOptions}
                  placeholder={t('请选择数据源')}
                />
              </NFormItem>
              <NFormItem label={t('表')} required>
                <NSelect
                  v-model:value={sourceTable.value}
                  options={tableOptions}
                  placeholder={t('请选择表')}
                />
              </NFormItem>
            </NForm>
          </NCard>

          <NCard title={t('数据去向')} style='flex: 1;'>
            <NForm labelPlacement='left' labelWidth={100}>
              <NFormItem label={t('数据源')} required>
                <NSelect
                  v-model:value={targetDb.value}
                  options={dbOptions}
                  placeholder={t('请选择数据源')}
                />
              </NFormItem>
              <NFormItem label={t('表')} required>
                <NSelect
                  v-model:value={targetTable.value}
                  options={tableOptions}
                  placeholder={t('请选择表')}
                />
              </NFormItem>
            </NForm>
          </NCard>
        </div>

        <NCard title={t('字段映射')} class='mt-4'>
          <div style='display: flex; align-items: flex-start; gap: 40px;'>
            {/* 源表字段 */}
            <div style='flex: 1;'>
              <table style='width: 100%; border-collapse: collapse; border: 1px solid #e5e6eb;'>
                <thead>
                  <tr>
                    <th style='text-align: left; padding: 8px; border: 1px solid #e5e6eb; background-color: #f9f9f9;'>
                      {t('源表字段')}
                    </th>
                    <th style='text-align: left; padding: 8px; border: 1px solid #e5e6eb; background-color: #f9f9f9;'>
                      {t('类型')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style='padding: 8px; border: 1px solid #e5e6eb;'>id</td>
                    <td style='padding: 8px; border: 1px solid #e5e6eb;'>
                      BIGINT
                    </td>
                  </tr>
                  <tr>
                    <td style='padding: 8px; border: 1px solid #e5e6eb;'>
                      name
                    </td>
                    <td style='padding: 8px; border: 1px solid #e5e6eb;'>
                      STRING
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 映射箭头 */}
            <div style='display: flex; flex-direction: column; justify-content: center; padding: 32px 0;'>
              <div style='display: flex; align-items: center; margin: 8px 0;'>
                <div style='color: #4318FF; font-size: 20px; display: flex; align-items: center;'>
                  <span style='display: inline-block; width: 40px; height: 2px; background-color: #4318FF; margin-right: -2px;'></span>
                  →
                </div>
              </div>
              <div style='display: flex; align-items: center; margin: 8px 0;'>
                <div style='color: #4318FF; font-size: 20px; display: flex; align-items: center;'>
                  <span style='display: inline-block; width: 40px; height: 2px; background-color: #4318FF; margin-right: -2px;'></span>
                  →
                </div>
              </div>
            </div>

            {/* 目标表字段 */}
            <div style='flex: 1;'>
              <table style='width: 100%; border-collapse: collapse; border: 1px solid #e5e6eb;'>
                <thead>
                  <tr>
                    <th style='text-align: left; padding: 8px; border: 1px solid #e5e6eb; background-color: #f9f9f9;'>
                      {t('目标表字段')}
                    </th>
                    <th style='text-align: left; padding: 8px; border: 1px solid #e5e6eb; background-color: #f9f9f9;'>
                      {t('类型')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style='padding: 8px; border: 1px solid #e5e6eb;'>id</td>
                    <td style='padding: 8px; border: 1px solid #e5e6eb;'>
                      BIGINT
                    </td>
                  </tr>
                  <tr>
                    <td style='padding: 8px; border: 1px solid #e5e6eb;'>
                      name
                    </td>
                    <td style='padding: 8px; border: 1px solid #e5e6eb;'>
                      STRING
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </NCard>
      </div>
    )
  }
})

export default DataxEditor
