import Vue from "vue";
import VueRouter from "vue-router";
import { getStore } from "../libs/storage";

Vue.use(VueRouter);

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
  },
  {
    path: "/",
    component: () => import("../views/Layout.vue"),
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("../views/Dashboard.vue"),
        meta: { title: "数据驾驶舱", icon: "el-icon-monitor" },
      },
      {
        path: "device",
        name: "Device",
        component: () => import("../views/Device.vue"),
        meta: { title: "设备管理", icon: "el-icon-cpu" },
      },
      {
        path: "batch",
        name: "Batch",
        component: () => import("../views/Batch.vue"),
        meta: { title: "养殖台账", icon: "el-icon-notebook-2" },
      },
      {
        path: "alert",
        name: "Alert",
        component: () => import("../views/Alert.vue"),
        meta: { title: "报警中心", icon: "el-icon-bell" },
      },
      {
        path: "rule",
        name: "Rule",
        component: () => import("../views/Rule.vue"),
        meta: { title: "规则引擎", icon: "el-icon-setting" },
      },
      {
        path: "user",
        name: "User",
        component: () => import("../views/User.vue"),
        meta: { title: "用户管理", icon: "el-icon-user" },
      },
      {
        path: "settings",
        name: "Settings",
        component: () => import("../views/Settings.vue"),
        meta: { title: "系统设置", icon: "el-icon-s-tools" },
      },
      {
        path: "batch-detail/:id",
        name: "BatchDetail",
        component: () => import("../views/BatchDetail.vue"),
        meta: { title: "批次详情", icon: "el-icon-document" },
      },
      {
        path: "analysis",
        name: "Analysis",
        component: () => import("../views/Analysis.vue"),
        meta: { title: "数据分析", icon: "el-icon-s-marketing" },
      },
      {
        path: "audit",
        name: "Audit",
        component: () => import("../views/Audit.vue"),
        meta: { title: "操作日志", icon: "el-icon-document-copy" },
      },
    ],
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  if (to.path === "/login") {
    next();
  } else {
    const token = getStore("token");
    if (!token) {
      next("/login");
    } else {
      next();
    }
  }
});

export default router;
