<template>
  <el-config-provider :teleported="true">
    <el-affix position="bottom" :offset="100">
      <el-button-group size="small" direction="vertical">
        <el-button type="primary" @click="copyChapterContent">复制内容</el-button>
        <el-button type="primary" @click="copyChapterHtml">复制HTML</el-button>
      </el-button-group>
    </el-affix>
  </el-config-provider>
</template>

<script setup lang="ts">
import {copyContext} from '../../common/common.js'

function copyChapterContent() {
  const preElement = unsafeWindow.document.getElementsByTagName('pre')[0];
  const brs = preElement.getElementsByTagName('br');
  for (let i = brs.length - 1; i >= 0; i--) {
    preElement.removeChild(brs[i]);
  }
  console.log(preElement);
  copyContext(preElement.innerText);
}

function copyChapterHtml() {
  return copyContext(unsafeWindow.document.getElementsByTagName('pre')[0].innerHTML);
}

</script>
