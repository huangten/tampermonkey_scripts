<template>
  <el-config-provider :teleported="true">

    <el-affix position="bottom" :offset="150">
      <el-button type="primary" @click="openDialog">复制书名</el-button>
    </el-affix>
    <el-affix position="bottom" :offset="110">
      <el-button type="primary" @click="">下载全部</el-button>
    </el-affix>
    <el-affix position="bottom" :offset="70">
      <el-button type="primary" @click="">清除下载</el-button>
    </el-affix>
    <el-affix position="bottom" :offset="20">
      <el-button type="primary" @click="openDialog2">章节列表</el-button>
    </el-affix>


    <!--      <el-button type="primary" @click="openDialog">-->
    <!--        打开 Dialog-->
    <!--      </el-button>-->


    <el-drawer v-model="drawerVisible" :modal="false" modal-penetrable>
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

const visible = ref(false)
const drawerVisible = ref(false)

function openDialog() {
  visible.value = true
}


function openDialog2() {
drawerVisible.value = true

}
</script>
