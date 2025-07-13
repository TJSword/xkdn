/*
 * @Author: BoLin
 * @Date: 2022-07-30 16:38:25
 * @LastEditors: BoLin
 * @LastEditTime: 2023-04-03 17:23:29
 * @Description: file content
 * @FilePath: \digital-twin-system-framework\.eslintrc.js
 */
module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    // 继承某些已有的规则
    extends: [
        'eslint:recommended',
        'plugin:vue/vue3-essential',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        // 解决自动导入vue相关api后, eslint报错问题
        './.eslintrc-auto-import.json'
    ],
    parser: 'vue-eslint-parser', // 指定如何解析语法
    // 优先级低于 parse 的语法解析配置
    parserOptions: {
        ecmaVersion: 'latest',
        parser: '@typescript-eslint/parser',
        sourceType: 'module'
    },
    plugins: ['vue', '@typescript-eslint'],
    rules: {
        // 解决不能使用any问题
        '@typescript-eslint/no-explicit-any': ['off'],
        // 解决定义空对象报红
        '@typescript-eslint/ban-types': [
            'error',
            {
                extendDefaults: true,
                types: {
                    '{}': false
                }
            }
        ],

        // 解决定义变量未使用问题
        'no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unused-vars': ['off'],

        // 解决prettier长度超出和eslint冲突问题
        // 'prettier/prettier': 'off',

        // vue (https://eslint.vuejs.org/rules)
        'vue/no-v-html': 'off', // 禁止使用 v-html
        'vue/script-setup-uses-vars': 'error', // 防止<script setup>使用的变量<template>被标记为未使用，此规则仅在启用该no-unused-vars规则时有效。
        'vue/v-slot-style': 'error', // 强制执行 v-slot 指令样式
        'vue/no-mutating-props': 'off', // 不允许组件 prop的改变
        'vue/html-closing-bracket-newline': 'off', // 在标签的右括号之前要求或禁止换行
        'vue/max-attributes-per-line': 'off', // 强制每行的最大属性数
        'vue/multiline-html-element-content-newline': 'off', // 在多行元素的内容之前和之后需要换行符
        'vue/singleline-html-element-content-newline': 'off', // 在单行元素的内容之前和之后需要换行符
        'vue/attribute-hyphenation': 'off', // 对模板中的自定义组件强制执行属性命名样式
        'vue/require-default-prop': 'off', // 此规则要求为每个 prop 为必填时，必须提供默认值
        'vue/multi-word-component-names': 'off' // 要求组件名称始终为 “-” 链接的单词
    }
}
