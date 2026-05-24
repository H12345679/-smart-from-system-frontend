<template>
  <div class="user-page">
    <el-card>
      <div slot="header" style="display:flex;justify-content:space-between;align-items:center">
        <span>用户管理</span>
        <el-button type="success" icon="el-icon-plus" size="small" @click="createVisible = true">添加用户</el-button>
      </div>
      <el-table :data="userList" stripe v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="realName" label="姓名" min-width="100" />
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column prop="roleName" label="角色" min-width="120">
          <template slot-scope="{ row }">
            <el-tag :type="row.role === 'ADMIN' ? 'danger' : row.role === 'MANAGER' ? 'warning' : 'info'" size="small">
              {{ row.roleName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template slot-scope="{ row }">
            <el-switch :value="row.status === 1" @change="toggleStatus(row)" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160" />
        <el-table-column label="操作" width="120">
          <template slot-scope="{ row }">
            <el-button size="mini" type="danger" @click="resetPassword(row)" :disabled="row.username === 'admin'">重置密码</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="添加用户" :visible.sync="createVisible" width="450px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" placeholder="默认admin123" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.realName" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="运营经理" value="MANAGER" />
            <el-option label="技术员" value="TECHNICIAN" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { get, post, put } from "../api/axios";

export default {
  name: "User",
  data() {
    return {
      loading: false, createVisible: false,
      userList: [],
      form: { username: "", password: "admin123", realName: "", phone: "", role: "TECHNICIAN" },
    };
  },
  created() { this.fetchUsers(); },
  methods: {
    async fetchUsers() {
      this.loading = true;
      try {
        const res = await get("/auth/users");
        this.userList = res.data || [];
      } catch (e) { this.$message.error("获取用户列表失败"); }
      finally { this.loading = false; }
    },
    async submitCreate() {
      try {
        await post("/auth/register", this.form);
        this.$message.success("用户创建成功");
        this.createVisible = false;
        this.fetchUsers();
      } catch (e) { this.$message.error(e.message || "创建失败"); }
    },
    async toggleStatus(row) {
      try {
        await put(`/auth/users/${row.id}/status`, { status: row.status === 1 ? 0 : 1 });
        this.$message.success("状态已更新");
        this.fetchUsers();
      } catch (e) { this.$message.error("操作失败"); }
    },
    resetPassword(row) {
      this.$confirm(`确认重置 ${row.username} 的密码为 admin123?`, "提示").then(async () => {
        try {
          await put(`/auth/users/${row.id}/reset-password`);
          this.$message.success("密码已重置为 admin123");
        } catch (e) { this.$message.error("重置失败"); }
      });
    },
  },
};
</script>
