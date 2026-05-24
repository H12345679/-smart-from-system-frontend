<template>
  <div class="settings-page">
    <el-card>
      <div slot="header"><span>水质阈值配置</span></div>
      <el-alert title="以下阈值参照《工厂化循环水养殖技术规范》(DB 21/T)，修改后将实时影响规则引擎判定" type="warning" show-icon :closable="false" style="margin-bottom:16px" />
      <el-table :data="thresholds" stripe v-loading="loading" style="width:100%">
        <el-table-column prop="parameterType" label="参数" width="100">
          <template slot-scope="{ row }">
            <el-tag size="small">{{ row.parameterType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="安全范围" min-width="150">
          <template slot-scope="{ row }">
            <span>{{ row.minValue }} ~ {{ row.maxValue }} {{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column label="致命范围" min-width="150">
          <template slot-scope="{ row }">
            <span style="color:#F56C6C">{{ row.criticalMin }} ~ {{ row.criticalMax }} {{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="{ row }">
            <el-button size="mini" type="primary" @click="editThreshold(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="编辑阈值" :visible.sync="editVisible" width="450px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="参数"><el-input :value="editForm.parameterType" disabled /></el-form-item>
        <el-form-item label="安全最小值"><el-input-number v-model="editForm.minValue" :precision="2" /></el-form-item>
        <el-form-item label="安全最大值"><el-input-number v-model="editForm.maxValue" :precision="2" /></el-form-item>
        <el-form-item label="致命最小值"><el-input-number v-model="editForm.criticalMin" :precision="2" /></el-form-item>
        <el-form-item label="致命最大值"><el-input-number v-model="editForm.criticalMax" :precision="2" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="editForm.description" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { listThresholds, updateThreshold } from "../api/modules/monitor";

export default {
  name: "Settings",
  data() {
    return {
      loading: false, editVisible: false,
      thresholds: [],
      editForm: {},
    };
  },
  created() { this.fetchThresholds(); },
  methods: {
    async fetchThresholds() {
      this.loading = true;
      try {
        const res = await listThresholds();
        this.thresholds = res.data || [];
      } catch (e) { this.$message.error("获取阈值配置失败"); }
      finally { this.loading = false; }
    },
    editThreshold(row) {
      this.editForm = { ...row };
      this.editVisible = true;
    },
    async submitEdit() {
      try {
        await updateThreshold(this.editForm.id, this.editForm);
        this.$message.success("阈值更新成功");
        this.editVisible = false;
        this.fetchThresholds();
      } catch (e) { this.$message.error("更新失败"); }
    },
  },
};
</script>
