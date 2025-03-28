/*
 * @Author: lishengmin shengminfang@foxmail.com
 * @Date: 2024-07-20 14:22:53
 * @LastEditors: lishengmin shengminfang@foxmail.com
 * @LastEditTime: 2025-03-27 15:17:28
 * @FilePath: /dolphinscheduler-ui/src/router/modules/ui-setting.ts
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

import type { Component } from 'vue'
import utils from '@/utils'

// All TSX files under the views folder automatically generate mapping relationship
const modules = import.meta.glob('/src/views/**/**.tsx')
const components: { [key: string]: Component } = utils.mapping(modules)

export default {
  path: '/ui-setting',
  name: 'ui-setting',
  meta: { title: '设置' },
  component: () => import('@/layouts/content'),
  children: [
    {
      path: '',
      name: 'ui-setting-detail',
      component: components['ui-setting'],
      meta: {
        title: '设置',
        activeMenu: 'ui-setting',
        showSide: false,
        auth: []
      }
    }
  ]
}
