<template>
  <el-config-provider :teleported="true">

    <el-affix position="bottom" :offset="10">
      <el-button-group size="small" direction="vertical">
        <el-button type="primary" @click="openDialog">复制书名</el-button>
        <el-button type="primary">下载全部</el-button>
        <el-button type="primary">清除下载</el-button>
        <el-button type="primary" @click="openDialog2">章节列表</el-button>
      </el-button-group>
    </el-affix>

    <el-drawer v-model="drawerVisible" size="20%" :modal="false" lock-scroll="false" resizable="true" show-close="true" destroy-on-close="true"
               modal-penetrable="true">
      <span>It's a modal Drawer</span>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">Cancel</el-button>
          <el-button type="primary" @click="drawerVisible = false">
            Confirm
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="visible" title="Hello">
      Element Plus Dialog in Tampermonkey 🎉
    </el-dialog>

  </el-config-provider>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {
  House,
  Notification,
  Operation,
} from '@element-plus/icons-vue'

const visible = ref(false)
const drawerVisible = ref(false)

function openDialog() {
  visible.value = true
}


function openDialog2() {
  drawerVisible.value = true

}
</script>
