<template>
  <div class="audit-page">
    <el-card>
      <div slot="header" class="card-header">
        <span><i class="el-icon-document-copy"></i> 系统操作日志</span>
        <el-form inline style="float:right">
          <el-form-item>
            <el-select v-model="filter.module" placeholder="模块" clearable size="small" style="width:120px">
              <el-option label="认证" value="AUTH" />
              <el-option label="台账" value="BATCH" />
              <el-option label="设备" value="DEVICE" />
              <el-option label="规则" value="RULE" />
              <el-option label="报警" value="ALERT" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="filter.username" placeholder="用户名" clearable size="small" style="width:120px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" icon="el-icon-search" @click="fetchLogs">查询</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="logList" stripe v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="操作人" width="100" />
        <el-table-column prop="module" label="模块" width="80">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="moduleType(row.module)">{{ row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operation" label="操作" width="100" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="requestMethod" label="方式" width="70">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="methodType(row.requestMethod)">{{ row.requestMethod }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column prop="createTime" label="时间" min-width="160" />
      </el-table>

      <el-pagination style="margin-top:16px;text-align:right"
        :current-page="page" :page-size="size" :total="total"
        @current-change="handlePageChange" layout="total, prev, pager, next" />
    </el-card>
  </div>
</template>

<script>
import { get } from "../api/axios";

export default {
  name: "Audit",
  data() {
    return {
      loading: false,
      filter: { module: "", username: "" },
      page: 1, size: 15, total: 0,
      logList: [],
    };
  },
  created() { this.fetchLogs(); },
  methods: {
    async fetchLogs() {
      this.loading = true;
      try {
        const params = { page: this.page, size: this.size };
        if (this.filter.module) params.module = this.filter.module;
        if (this.filter.username) params.username = this.filter.username;
        const res = await get("/audit/list", params);
        const pageData = res.data;
        this.logList = pageData.records || [];
        this.total = pageData.total || 0;
      } catch (e) { this.$message.error("获取日志失败"); }
      finally { this.loading = false; }
    },
    handlePageChange(p) { this.page = p; this.fetchLogs(); },
    moduleType(m) {
      const map = { AUTH: "", BATCH: "success", DEVICE: "warning", RULE: "danger", ALERT: "danger" };
      return map[m] || "info";
    },
    methodType(m) {
      const map = { POST: "success", PUT: "warning", DELETE: "danger", GET: "info" };
      return map[m] || "";
    },
  },
};
</script>

<style lang="scss" scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: 500; i { margin-right: 6px; color: #409EFF; } }
</style>
