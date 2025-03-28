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

import {
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  ref,
  watch
} from 'vue'
import { useFormItem } from 'naive-ui/es/_mixins'
import { call } from 'naive-ui/es/_utils'
import { useThemeStore } from '@/store/theme/theme'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import type {
  MaybeArray,
  OnUpdateValue,
  OnUpdateValueImpl,
  monaco as Monaco
} from './types'
import { debounce } from 'lodash'

const DEFAULT_SQL = `CREATE TABLE JDBC_table (
  id BIGINT,
  name STRING,
  age INT,
  status BOOLEAN,
  PRIMARY KEY (id) NOT ENFORCED
) WITH (
   'connector' = 'jdbc',
   'url' = 'jdbc:mysql://10.22.250.138:30007/dinky',
   'table-name' = 'users',
   'username' = 'citydo',
   'password' = 'Abc.123456'
);`

const props = {
  value: {
    type: String as PropType<string>,
    default: DEFAULT_SQL
  },
  defaultValue: {
    type: String as PropType<string>,
    default: DEFAULT_SQL
  },
  'onUpdate:value': [Function, Array] as PropType<MaybeArray<OnUpdateValue>>,
  onUpdateValue: [Function, Array] as PropType<MaybeArray<OnUpdateValue>>,
  options: {
    type: Object as PropType<Monaco.editor.IStandaloneEditorConstructionOptions>,
    default: () => ({
      readOnly: false,
      language: 'sql',
      minimap: { enabled: false },
      fontSize: 14,
      tabSize: 2,
      formatOnPaste: true,
      formatOnType: true,
      scrollBeyondLastLine: false,
      automaticLayout: true
    })
  },
  onMounted: {
    type: Function as PropType<
      (editor: monaco.editor.IStandaloneCodeEditor) => void
    >
  }
}

// @ts-ignore
window.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (['css', 'scss', 'less'].includes(label)) {
      return new cssWorker()
    }
    if (['html', 'handlebars', 'razor'].includes(label)) {
      return new htmlWorker()
    }
    if (['typescript', 'javascript'].includes(label)) {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

// SQL 关键字列表
const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'INSERT',
  'UPDATE',
  'DELETE',
  'CREATE',
  'DROP',
  'TABLE',
  'ALTER',
  'INDEX',
  'VIEW',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'INNER JOIN',
  'UNION',
  'ALL',
  'AS',
  'DISTINCT',
  'INTO',
  'VALUES',
  'SET',
  'NULL',
  'NOT NULL',
  'PRIMARY KEY',
  'FOREIGN KEY',
  'DEFAULT',
  'AUTO_INCREMENT',
  'INT',
  'VARCHAR',
  'TEXT',
  'DATE',
  'DATETIME',
  'TIMESTAMP',
  'BOOLEAN',
  'FLOAT',
  'DOUBLE'
]

// SQL 函数列表
const SQL_FUNCTIONS = [
  'COUNT',
  'SUM',
  'AVG',
  'MAX',
  'MIN',
  'ROUND',
  'CONCAT',
  'SUBSTRING',
  'TRIM',
  'UPPER',
  'LOWER',
  'DATE_FORMAT',
  'NOW',
  'COALESCE',
  'IFNULL',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END'
]

export default defineComponent({
  name: 'MonacoEditor',
  props,
  emits: ['change', 'focus', 'blur'],
  setup(props, ctx) {
    const editorRef = ref<HTMLElement>()
    let editor: monaco.editor.IStandaloneCodeEditor | null = null
    const themeStore = useThemeStore()
    const monacoEditorThemeRef = ref(themeStore.darkTheme ? 'vs-dark' : 'vs')
    const getValue = () => editor?.getValue()
    const formItem = useFormItem({})

    const initMonacoEditor = () => {
      const dom = editorRef.value
      if (dom) {
        editor = monaco.editor.create(dom, {
          ...props.options,
          value: props.value || props.defaultValue || '',
          theme: monacoEditorThemeRef.value,
          automaticLayout: false,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          wordBasedSuggestions: 'off',
          quickSuggestions: {
            other: false,
            comments: false,
            strings: false
          },
          parameterHints: { enabled: false },
          folding: false,
          lineNumbers: 'on',
          renderWhitespace: 'none',
          contextmenu: false,
          links: false,
          hover: { enabled: false }
        })

        // 注册 SQL 语言
        monaco.languages.register({ id: 'sql' })

        // 设置 SQL 语言配置
        monaco.languages.setLanguageConfiguration('sql', {
          wordPattern:
            /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
          comments: {
            lineComment: '--',
            blockComment: ['/*', '*/']
          },
          brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
          ],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"\'"', close: '"\'"' },
            { open: '"\'"', close: '"\'"' }
          ]
        })

        // 注册 SQL 自动完成提供程序
        monaco.languages.registerCompletionItemProvider('sql', {
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position)
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
            }

            const suggestions = [
              ...SQL_KEYWORDS.map((keyword) => ({
                label: keyword,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: keyword,
                detail: '关键字',
                range
              })),
              ...SQL_FUNCTIONS.map((func) => ({
                label: func,
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: func,
                detail: '函数',
                range
              }))
            ]

            return { suggestions }
          }
        })

        // 设置 SQL 语言的 Monarch 语法规则
        monaco.languages.setMonarchTokensProvider('sql', {
          defaultToken: '',
          tokenPostfix: '.sql',
          ignoreCase: true, // SQL 关键字不区分大小写

          keywords: SQL_KEYWORDS,
          operators: [
            '=',
            '<=',
            '>=',
            '!=',
            '<>',
            '<',
            '>',
            '+',
            '-',
            '*',
            '/',
            '%',
            'AND',
            'OR',
            'NOT',
            'LIKE',
            'IN',
            'IS',
            'NULL'
          ],
          functions: SQL_FUNCTIONS,

          brackets: [
            { open: '[', close: ']', token: 'delimiter.square' },
            { open: '(', close: ')', token: 'delimiter.parenthesis' }
          ],

          tokenizer: {
            root: [
              { include: '@whitespace' },
              { include: '@numbers' },
              { include: '@strings' },
              { include: '@comments' },

              [/[;,.]/, 'delimiter'],
              [/[\[\]()]/, '@brackets'],

              // 识别函数
              [
                /[a-zA-Z_]\w*(?=\s*\()/,
                {
                  cases: {
                    '@functions': 'function',
                    '@default': 'identifier'
                  }
                }
              ],

              // 识别关键字和标识符
              [
                /[a-zA-Z_]\w*/,
                {
                  cases: {
                    '@keywords': 'keyword',
                    '@operators': 'operator',
                    '@default': 'identifier'
                  }
                }
              ]
            ],

            whitespace: [[/\s+/, 'white']],

            comments: [
              [/--+.*/, 'comment'],
              [/\/\*/, { token: 'comment.quote', next: '@comment' }]
            ],

            comment: [
              [/[^/*]+/, 'comment'],
              [/\*\//, { token: 'comment.quote', next: '@pop' }],
              [/./, 'comment']
            ],

            strings: [
              [/'/, { token: 'string', next: '@string' }],
              [/"/, { token: 'string', next: '@string_double' }]
            ],

            string: [
              [/[^']+/, 'string'],
              [/''/, 'string'],
              [/'/, { token: 'string', next: '@pop' }]
            ],

            string_double: [
              [/[^"]+/, 'string'],
              [/""/, 'string'],
              [/"/, { token: 'string', next: '@pop' }]
            ],

            numbers: [
              [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
              [/\d+/, 'number']
            ]
          }
        })

        const debouncedChange = debounce(() => {
          const { onUpdateValue, 'onUpdate:value': _onUpdateValue } = props
          const value = editor?.getValue() || ''

          if (onUpdateValue) call(onUpdateValue as OnUpdateValueImpl, value)
          if (_onUpdateValue) call(_onUpdateValue as OnUpdateValueImpl, value)
          ctx.emit('change', value)

          formItem.nTriggerFormChange()
          formItem.nTriggerFormInput()
        }, 300)

        editor.onDidChangeModelContent(debouncedChange)
        editor.onDidBlurEditorWidget(() => {
          ctx.emit('blur')
          formItem.nTriggerFormBlur()
        })
        editor.onDidFocusEditorWidget(() => {
          ctx.emit('focus')
          formItem.nTriggerFormFocus()
        })

        // 触发 onMounted 事件
        if (props.onMounted) {
          props.onMounted(editor)
        }
      }
    }

    onMounted(() => initMonacoEditor())

    onUnmounted(() => {
      editor?.dispose()
    })

    watch(
      () => props.value,
      (val) => {
        if (val !== getValue()) {
          editor?.setValue(val)
        }
      }
    )

    watch(
      () => formItem.mergedDisabledRef.value,
      (value) => {
        editor?.updateOptions({ readOnly: value })
      }
    )

    watch(
      () => themeStore.darkTheme,
      () => {
        editor?.dispose()
        monacoEditorThemeRef.value = themeStore.darkTheme ? 'vs-dark' : 'vs'
        initMonacoEditor()
      }
    )

    ctx.expose({ getValue })

    return { editorRef }
  },
  render() {
    return (
      <div
        ref='editorRef'
        style={{
          height: '400px',
          width: '100%',
          border: '1px solid var(--n-border-color)',
          marginBottom: '16px'
        }}
      />
    )
  }
})
