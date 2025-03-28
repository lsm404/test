/*
 * @Author: lishengmin shengminfang@foxmail.com
 * @Date: 2024-07-20 14:22:53
 * @LastEditors: lishengmin shengminfang@foxmail.com
 * @LastEditTime: 2025-03-27 16:28:29
 * @FilePath: /dolphinscheduler-ui/src/views/projects/workflow/components/dag/dag-canvas.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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

import { defineComponent, ref, inject } from 'vue'
import Styles from './dag.module.scss'
import { useCanvasInit, useCellActive } from './dag-hooks'

export default defineComponent({
  name: 'workflow-dag-canvas',
  emits: ['drop'],
  setup(props, context) {
    const readonly = inject('readonly', ref(false))
    const graph = inject('graph', ref())

    const { paper, minimap, container } = useCanvasInit({ readonly, graph })

    // Change the style on cell hover and select
    useCellActive({ graph })
    const preventDefault = (e: DragEvent) => {
      e.preventDefault()
    }

    return () => (
      <div
        ref={container}
        class={[Styles.canvas, 'dag-container']}
        onDrop={(e: DragEvent) => {
          context.emit('drop', e)
        }}
        onDragenter={preventDefault}
        onDragover={preventDefault}
        onDragleave={preventDefault}
      >
        <div ref={paper} class={Styles.paper}></div>
        <div ref={minimap} class={Styles.minimap}></div>
      </div>
    )
  }
})
