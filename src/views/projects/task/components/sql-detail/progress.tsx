/*
 * @Author: lishengmin shengminfang@foxmail.com
 * @Date: 2025-03-18 11:14:18
 * @LastEditors: lishengmin shengminfang@foxmail.com
 * @LastEditTime: 2025-03-24 14:50:27
 * @FilePath: /dolphinscheduler-ui/src/views/projects/task/components/node/progress.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineComponent, PropType } from 'vue'
import { NProgress, NIcon } from 'naive-ui'
import {
  CheckmarkCircleOutline as SuccessIcon,
  CloseCircleOutline as ErrorIcon
} from '@vicons/ionicons5'
import Styles from './progress.module.scss'

const props = {
  current: {
    type: Number as PropType<number>,
    default: 0
  },
  waitingSize: {
    type: Number as PropType<number>,
    default: 0
  },
  steps: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  status: {
    type: String as PropType<string>,
    default: ''
  },
  application: {
    type: String as PropType<string>,
    default: ''
  },
  progressInfo: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  costTime: {
    type: String as PropType<string>,
    default: ''
  }
}

export default defineComponent({
  name: 'sql-progress',
  props,
  emits: ['openPanel'],
  setup(props) {
    const getProgressStatus = (status: string, current: number) => {
      if (status === 'FAILURE') return 'error'
      if (current < 1) return 'processing'
      return 'success'
    }

    // 根据进度判断当前步骤
    const getCurrentStep = (current: number, status: string) => {
      if (status === 'FAILURE') return 3 // 失败状态
      if (current === 1) return 3 // 完成状态
      if (current > 0.5) return 2 // 运行中
      if (current > 0) return 1 // 排队中
      return 0 // 已提交
    }

    return () => {
      const currentStep = getCurrentStep(props.current, props.status)

      return (
        <div class={Styles.container}>
          <div class={Styles.title}>Job状态</div>
          <div class={Styles.stepFlow}>
            <div class={[Styles.step, Styles.success]}>
              <NIcon class={Styles.icon}>
                <SuccessIcon />
              </NIcon>
              <spaπn>任务已提交</spaπn>
            </div>
            <div class={Styles.arrow}>→</div>
            <div class={[Styles.step, currentStep >= 1 ? Styles.success : '']}>
              <NIcon class={Styles.icon}>
                {currentStep >= 1 ? <SuccessIcon /> : ''}
              </NIcon>
              <span>排队中</span>
            </div>
            <div class={Styles.arrow}>→</div>
            <div class={[Styles.step, currentStep >= 2 ? Styles.success : '']}>
              <NIcon class={Styles.icon}>
                {currentStep >= 2 ? <SuccessIcon /> : ''}
              </NIcon>
              <span>脚本运行中</span>
            </div>
            <div class={Styles.arrow}>→</div>
            <div
              class={[
                Styles.step,
                props.status === 'FAILURE'
                  ? Styles.error
                  : currentStep === 3
                  ? Styles.success
                  : ''
              ]}
            >
              <NIcon class={Styles.icon}>
                {props.status === 'FAILURE' ? (
                  <ErrorIcon />
                ) : currentStep === 3 ? (
                  <SuccessIcon />
                ) : (
                  ''
                )}
              </NIcon>
              <span>
                {props.status === 'FAILURE' ? '执行失败' : '执行完成'}
              </span>
            </div>
          </div>
          <div class={Styles.progress}>
            <NProgress
              type='line'
              percentage={props.current * 100}
              status={getProgressStatus(props.status, props.current)}
              processing
              showIndicator
              height={14}
              color='#52c41a'
              railColor='#eee'
            />
          </div>
          {/* <div class={Styles.steps}>
            <NSpace vertical>
              {props.steps.map((step) => (
                <NTag key={step} type={getStatusType(step)}>
                  {step}
                </NTag>
              ))}
            </NSpace>
          </div> */}
          {props.progressInfo.length > 0 && (
            <div class={Styles.info}>
              {props.progressInfo.map((info) => (
                <div key={info} class={Styles.infoItem}>
                  {info}
                </div>
              ))}
            </div>
          )}
          {props.costTime && (
            <div class={Styles.time}>执行时间：{props.costTime}</div>
          )}
        </div>
      )
    }
  }
})
