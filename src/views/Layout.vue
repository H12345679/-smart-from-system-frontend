<template>
  <el-container class="layout-container">
    <!-- 左侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <i class="el-icon-s-platform"></i>
        <span v-if="!isCollapse">智慧养殖</span>
      </div>
      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        background-color="#0d2137"
        text-color="#b0bec5"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <i class="el-icon-monitor"></i>
          <span slot="title">数据驾驶舱</span>
        </el-menu-item>
        <!-- 管理员可见 -->
        <el-menu-item index="/device" v-if="hasPermission(['ADMIN'])">
          <i class="el-icon-cpu"></i>
          <span slot="title">设备管理</span>
        </el-menu-item>
        <!-- 技术员 + 管理员 + 经理可见 -->
        <el-menu-item index="/batch" v-if="hasPermission(['ADMIN','MANAGER','TECHNICIAN'])">
          <i class="el-icon-notebook-2"></i>
          <span slot="title">养殖台账</span>
        </el-menu-item>
        <el-menu-item index="/alert">
          <i class="el-icon-bell"></i>
          <span slot="title">报警中心</span>
        </el-menu-item>
        <!-- 管理员+经理可见 -->
        <el-menu-item index="/analysis" v-if="hasPermission(['ADMIN','MANAGER'])">
          <i class="el-icon-s-marketing"></i>
          <span slot="title">数据分析</span>
        </el-menu-item>
        <!-- 仅管理员可见 -->
        <el-menu-item index="/rule" v-if="hasPermission(['ADMIN'])">
          <i class="el-icon-setting"></i>
          <span slot="title">规则引擎</span>
        </el-menu-item>
        <el-menu-item index="/user" v-if="hasPermission(['ADMIN'])">
          <i class="el-icon-user"></i>
          <span slot="title">用户管理</span>
        </el-menu-item>
        <el-menu-item index="/settings" v-if="hasPermission(['ADMIN'])">
          <i class="el-icon-s-tools"></i>
          <span slot="title">系统设置</span>
        </el-menu-item>
        <el-menu-item index="/audit" v-if="hasPermission(['ADMIN'])">
          <i class="el-icon-document-copy"></i>
          <span slot="title">操作日志</span>
        </el-menu-item>
      </el-menu>

      <!-- 角色标识 -->
      <div class="role-badge" v-if="!isCollapse">
        <el-tag :type="roleTagType" size="small">{{ roleLabel }}</el-tag>
      </div>
    </el-aside>

    <!-- 右侧 -->
    <el-container>
      <!-- 顶栏 -->
      <el-header class="header">
        <div class="header-left">
          <i :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'" @click="isCollapse = !isCollapse" class="collapse-btn"></i>
          <span class="page-title">{{ $route.meta.title }}</span>
        </div>
        <div class="header-right">
          <span class="time">{{ currentTime }}</span>
          <el-badge :value="alertCount" :max="99" class="alert-badge">
            <i class="el-icon-bell" @click="$router.push('/alert')"></i>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <i class="el-icon-user-solid"></i> {{ displayName }}
              <i class="el-icon-arrow-down"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item disabled>
                <i class="el-icon-user"></i> {{ roleLabel }}
              </el-dropdown-item>
              <el-dropdown-item command="changePassword">
                <i class="el-icon-lock"></i> 修改密码
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <i class="el-icon-switch-button"></i> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <!-- 技术员台账页面隐藏导出和部分功能提示 -->
        <router-view :userRole="currentRole" />
      </el-main>
    </el-container>

    <!-- 修改密码弹窗 -->
    <el-dialog title="修改密码" :visible.sync="passwordVisible" width="400px">
      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdForm" label-width="80px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="passwordVisible = false">取消</el-button>
        <el-button type="primary" @click="submitChangePassword" :loading="pwdLoading">确认修改</el-button>
      </span>
    </el-dialog>
  </el-container>
</template>

<script>
import { getStore, removestore } from "../libs/storage";
import wsManager from "../libs/websocket";

export default {
  name: "Layout",
  data() {
    return {
      isCollapse: false,
      currentTime: "",
      alertCount: 0,
      timer: null,
      currentRole: "",
      displayName: "",
      passwordVisible: false,
      pwdLoading: false,
      pwdForm: { oldPassword: "", newPassword: "", confirmPassword: "" },
      pwdRules: {
        oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
        newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }, { min: 6, message: "密码至少6位", trigger: "blur" }],
        confirmPassword: [{ required: true, message: "请确认新密码", trigger: "blur" }],
      },
    };
  },
  computed: {
    roleLabel() {
      const map = {
        ADMIN: "系统管理员",
        MANAGER: "运营经理",
        TECHNICIAN: "现场技术员",
      };
      return map[this.currentRole] || "未知角色";
    },
    roleTagType() {
      const map = { ADMIN: "danger", MANAGER: "warning", TECHNICIAN: "" };
      return map[this.currentRole] || "info";
    },
  },
  created() {
    this.loadUserInfo();
    this.updateTime();
    this.timer = setInterval(this.updateTime, 1000);
    this.fetchAlertCount();
    // 启动WebSocket
    wsManager.connect();
    wsManager.onMessage(this.handleWsMessage);
  },
  beforeDestroy() {
    clearInterval(this.timer);
    wsManager.removeListener(this.handleWsMessage);
  },
  methods: {
    handleWsMessage(data) {
      if (data.type === "alert" || data.type === "escalation") {
        this.alertCount++;
        this.$notify({ title: data.type === "escalation" ? "报警已升级" : "新报警", message: data.message, type: "error", duration: 8000 });
      } else if (data.type === "device_offline") {
        this.$notify({ title: "设备离线", message: data.message, type: "warning", duration: 5000 });
      }
    },
    async fetchAlertCount() {
      try {
        const { getActiveAlertCount } = await import("../api/modules/alert");
        const res = await getActiveAlertCount();
        this.alertCount = res.data || 0;
      } catch (e) { /* 静默 */ }
    },
    loadUserInfo() {
      this.currentRole = getStore("role") || "TECHNICIAN";
      try {
        const info = JSON.parse(getStore("userInfo") || "{}");
        this.displayName = info.realName || info.username || "用户";
      } catch (e) {
        this.displayName = "用户";
      }
    },
    hasPermission(roles) {
      return roles.includes(this.currentRole);
    },
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleString("zh-CN", { hour12: false });
    },
    handleCommand(cmd) {
      if (cmd === "logout") {
        removestore("token");
        removestore("userInfo");
        removestore("role");
        this.$router.push("/login");
      } else if (cmd === "changePassword") {
        this.pwdForm = { oldPassword: "", newPassword: "", confirmPassword: "" };
        this.passwordVisible = true;
      }
    },
    async submitChangePassword() {
      this.$refs.pwdForm.validate(async (valid) => {
        if (!valid) return;
        if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) {
          this.$message.error("两次输入的新密码不一致");
          return;
        }
        this.pwdLoading = true;
        try {
          const { put } = await import("../api/axios");
          await put("/auth/change-password", {
            oldPassword: this.pwdForm.oldPassword,
            newPassword: this.pwdForm.newPassword,
          });
          this.$message.success("密码修改成功，请重新登录");
          this.passwordVisible = false;
          removestore("token");
          this.$router.push("/login");
        } catch (e) {
          this.$message.error(e.message || "修改失败");
        } finally {
          this.pwdLoading = false;
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
}
.sidebar {
  background: #0d2137;
  transition: width 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409EFF;
  font-size: 18px;
  font-weight: bold;
  i { font-size: 24px; margin-right: 6px; }
}
.role-badge {
  margin-top: auto;
  padding: 16px;
  text-align: center;
}
.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 16px;
  color: #333;
}
.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.time {
  color: #666;
  font-size: 13px;
}
.alert-badge {
  cursor: pointer;
  i { font-size: 20px; color: #666; }
}
.user-info {
  cursor: pointer;
  color: #333;
  font-size: 14px;
}
.main-content {
  background: #f0f2f5;
  padding: 16px;
}
</style>
