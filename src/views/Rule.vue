<template>
  <div class="rule-page">
    <el-card v-loading="loading">
      <div slot="header" style="display:flex;justify-content:space-between;align-items:center">
        <span>自动化规则列表</span>
        <el-button type="success" icon="el-icon-plus" size="small" @click="openDrawer">添加规则</el-button>
      </div>
      <el-table :data="ruleList" stripe>
        <el-table-column prop="ruleName" label="规则名称" />
        <el-table-column label="触发条件 (IF)" width="280">
          <template slot-scope="{ row }">
            <code>传感器#{{ row.sensorDeviceId }} {{ row.operator }} {{ row.thresholdValue }}</code>
            <span v-if="row.durationSeconds > 0" class="duration-tag">持续{{ row.durationSeconds }}s</span>
          </template>
        </el-table-column>
        <el-table-column label="执行动作 (THEN)" width="220">
          <template slot-scope="{ row }">
            <el-tag size="small" type="warning">{{ row.alertLevel }}级报警</el-tag>
            <el-tag size="small" type="success" v-if="row.actuatorDeviceId" style="margin-left:4px">设备#{{ row.actuatorDeviceId }}: {{ row.actuatorAction }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template slot-scope="{ row }">
            <el-switch :value="row.enabled === 1" @change="toggleRule(row, $event)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="{ row }">
            <el-button size="mini" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer title="自动化规则配置" :visible.sync="drawerVisible" size="500px" direction="rtl">
      <div class="drawer-content">
        <el-form :model="ruleForm" label-width="100px">
          <h4 class="form-section">基本信息</h4>
          <el-form-item label="规则名称"><el-input v-model="ruleForm.ruleName" /></el-form-item>

          <h4 class="form-section">IF 条件</h4>
          <el-form-item label="传感器ID"><el-input-number v-model="ruleForm.sensorDeviceId" :min="1" /></el-form-item>
          <el-form-item label="运算符">
            <el-select v-model="ruleForm.operator" style="width:100px">
              <el-option label="<" value="<" /><el-option label=">" value=">" />
              <el-option label="<=" value="<=" /><el-option label=">=" value=">=" />
            </el-select>
          </el-form-item>
          <el-form-item label="阈值"><el-input-number v-model="ruleForm.thresholdValue" :precision="1" /></el-form-item>
          <el-form-item label="持续(秒)"><el-input-number v-model="ruleForm.durationSeconds" :min="0" :step="30" /></el-form-item>

          <h4 class="form-section">THEN 动作</h4>
          <el-form-item label="报警级别">
            <el-radio-group v-model="ruleForm.alertLevel">
              <el-radio :label="1">1级</el-radio><el-radio :label="2">2级</el-radio><el-radio :label="3">3级</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="联动设备ID"><el-input-number v-model="ruleForm.actuatorDeviceId" :min="0" /></el-form-item>
          <el-form-item label="执行动作" v-if="ruleForm.actuatorDeviceId">
            <el-radio-group v-model="ruleForm.actuatorAction">
              <el-radio label="ON">开启</el-radio><el-radio label="OFF">关闭</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>

        <el-alert v-if="conflictMessage" :title="conflictMessage" type="error" show-icon style="margin:16px 0" />

        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRule" :loading="submitLoading">保存规则</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { listRules, createRule, toggleRule as apiToggle, deleteRule, checkConflict } from "../api/modules/rule";

export default {
  name: "Rule",
  data() {
    return {
      loading: false, submitLoading: false, drawerVisible: false, conflictMessage: "",
      ruleList: [],
      ruleForm: { ruleName: "", sensorDeviceId: 1, operator: "<", thresholdValue: 6.0, durationSeconds: 180, alertLevel: 3, actuatorDeviceId: null, actuatorAction: "ON" },
    };
  },
  created() { this.fetchRules(); },
  methods: {
    async fetchRules() {
      this.loading = true;
      try {
        const res = await listRules({});
        this.ruleList = res.data || [];
      } catch (e) { this.$message.error("获取规则失败"); }
      finally { this.loading = false; }
    },
    openDrawer() { this.conflictMessage = ""; this.drawerVisible = true; },
    async submitRule() {
      this.submitLoading = true;
      this.conflictMessage = "";
      try {
        // 先检测冲突
        const conflictRes = await checkConflict(this.ruleForm);
        if (conflictRes.data && conflictRes.data.hasConflict) {
          this.conflictMessage = conflictRes.data.message;
          this.submitLoading = false;
          return;
        }
        await createRule(this.ruleForm);
        this.$message.success("规则保存成功");
        this.drawerVisible = false;
        this.fetchRules();
      } catch (e) { this.$message.error(e.message || "保存失败"); }
      finally { this.submitLoading = false; }
    },
    async toggleRule(row, val) {
      try {
        await apiToggle(row.id, val ? 1 : 0);
        this.$message.info(`规则已${val ? '启用' : '禁用'}`);
        this.fetchRules();
      } catch (e) { this.$message.error("操作失败"); }
    },
    handleDelete(row) {
      this.$confirm(`确认删除 "${row.ruleName}"?`, "提示", { type: "warning" }).then(async () => {
        try {
          await deleteRule(row.id);
          this.$message.success("删除成功");
          this.fetchRules();
        } catch (e) { this.$message.error("删除失败"); }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.drawer-content { padding: 0 20px 20px; }
.form-section { color: #409EFF; margin: 20px 0 10px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
.drawer-footer { margin-top: 24px; text-align: right; }
.duration-tag { margin-left: 8px; font-size: 12px; color: #999; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
</style>
