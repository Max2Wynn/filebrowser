<template>
  <nav :class="{ active }">
    <template v-if="isLogged">
      <v-app>
        <template>
          <v-treeview
              v-model="tree"
              hoverable
              :items="items"
              activatable
              item-key="name"
              :load-children="fetchItems"
              open-on-click
              @click="onClick"
              @input="onClick"
          >
            <template v-slot:label="{ item }">
              <span @click="onItemClick(item)">{{ item.name }}</span>
            </template>
            <template v-slot:prepend="{ item, open }">
<!--              <span @click="onItemClick(item)">-->
              <v-icon v-if="!item.file">
                {{ open ? 'mdi-folder-open' : 'mdi-folder' }}
              </v-icon>
              <v-icon v-else>
                {{ files[item.file] }}
              </v-icon>
<!--              </span>-->
            </template>
          </v-treeview>
        </template>
      </v-app>




      <!--      <button-->
<!--        class="action"-->
<!--        @click="toRoot"-->
<!--        :aria-label="$t('sidebar.myFiles')"-->
<!--        :title="$t('sidebar.myFiles')"-->
<!--      >-->
<!--        <i class="material-icons">folder</i>-->
<!--        <span>{{ $t("sidebar.myFiles") }}</span>-->
<!--      </button>-->

<!--      <div v-if="user.perm.create">-->
<!--        <button-->
<!--          @click="$store.commit('showHover', 'newDir')"-->
<!--          class="action"-->
<!--          :aria-label="$t('sidebar.newFolder')"-->
<!--          :title="$t('sidebar.newFolder')"-->
<!--        >-->
<!--          <i class="material-icons">create_new_folder</i>-->
<!--          <span>{{ $t("sidebar.newFolder") }}</span>-->
<!--        </button>-->

<!--        <button-->
<!--          @click="$store.commit('showHover', 'newFile')"-->
<!--          class="action"-->
<!--          :aria-label="$t('sidebar.newFile')"-->
<!--          :title="$t('sidebar.newFile')"-->
<!--        >-->
<!--          <i class="material-icons">note_add</i>-->
<!--          <span>{{ $t("sidebar.newFile") }}</span>-->
<!--        </button>-->
<!--      </div>-->

<!--      <div>-->
<!--        <button-->
<!--          class="action"-->
<!--          @click="toSettings"-->
<!--          :aria-label="$t('sidebar.settings')"-->
<!--          :title="$t('sidebar.settings')"-->
<!--        >-->
<!--          <i class="material-icons">settings_applications</i>-->
<!--          <span>{{ $t("sidebar.settings") }}</span>-->
<!--        </button>-->

<!--        <button-->
<!--          v-if="canLogout"-->
<!--          @click="logout"-->
<!--          class="action"-->
<!--          id="logout"-->
<!--          :aria-label="$t('sidebar.logout')"-->
<!--          :title="$t('sidebar.logout')"-->
<!--        >-->
<!--          <i class="material-icons">exit_to_app</i>-->
<!--          <span>{{ $t("sidebar.logout") }}</span>-->
<!--        </button>-->
<!--      </div>-->
    </template>
    <template v-else>
      <router-link
        class="action"
        to="/login"
        :aria-label="$t('sidebar.login')"
        :title="$t('sidebar.login')"
      >
        <i class="material-icons">exit_to_app</i>
        <span>{{ $t("sidebar.login") }}</span>
      </router-link>

      <router-link
        v-if="signup"
        class="action"
        to="/login"
        :aria-label="$t('sidebar.signup')"
        :title="$t('sidebar.signup')"
      >
        <i class="material-icons">person_add</i>
        <span>{{ $t("sidebar.signup") }}</span>
      </router-link>
    </template>

<!--    <div-->
<!--      class="credits"-->
<!--      v-if="-->
<!--        $router.currentRoute.path.includes('/files/') && !disableUsedPercentage-->
<!--      "-->
<!--      style="width: 90%; margin: 2em 2.5em 3em 2.5em"-->
<!--    >-->
<!--      <progress-bar :val="usage.usedPercentage" size="small"></progress-bar>-->
<!--      <br />-->
<!--      {{ usage.used }} of {{ usage.total }} used-->
<!--    </div>-->

  </nav>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import * as auth from "@/utils/auth";
import {
  version,
  signup,
  disableExternal,
  disableUsedPercentage,
  noAuth,
  loginPage,
} from "@/utils/constants";
import { files as api } from "@/api";
import ProgressBar from "vue-simple-progress";
import prettyBytes from "pretty-bytes";

export default {
  name: "sidebar",
  components: {
    ProgressBar,
  },
  computed: {
    ...mapState(["user"]),
    ...mapGetters(["isLogged", "currentPrompt"]),
    active() {
      return this.currentPrompt?.prompt === "sidebar";
    },
    signup: () => signup,
    version: () => version,
    disableExternal: () => disableExternal,
    disableUsedPercentage: () => disableUsedPercentage,
    canLogout: () => !noAuth && loginPage,
  },
  asyncComputed: {
    async items () {
        console.log('/......................')
        try {
            let items = (await api.fetch("/")).items;
            return this.mapItem(items)
        } catch (error) {
            this.$showError(error);
        }
    },
    usage: {
      async get() {
        let path = this.$route.path.endsWith("/")
          ? this.$route.path
          : this.$route.path + "/";
        let usageStats = { used: 0, total: 0, usedPercentage: 0 };
        if (this.disableUsedPercentage) {
          return usageStats;
        }
        try {
          let usage = await api.usage(path);
          usageStats = {
            used: prettyBytes(usage.used, { binary: true }),
            total: prettyBytes(usage.total, { binary: true }),
            usedPercentage: Math.round((usage.used / usage.total) * 100),
          };
        } catch (error) {
          this.$showError(error);
        }
        return usageStats;
      },
      default: { used: "0 B", total: "0 B", usedPercentage: 0 },
      shouldUpdate() {
        return this.$router.currentRoute.path.includes("/files/");
      },
    },
  },
  methods: {
    mapItem: function(items) {
              items = items.map((item) => {
                  if (item.isDir) {
                      return {
                          name: item.name,
                          path: item.path,
                          children: []
                      }
                  }
                  return {
                      name: item.name,
                      path: item.path
                  }
              })
              return items

    },
    open: function (name) {
        this.$router.push({ path: name});
    },
    toRoot() {
      this.$router.push({ path: "/files/" }, () => {});
      this.$store.commit("closeHovers");
    },
    toSettings() {
      this.$router.push({ path: "/settings" }, () => {});
      this.$store.commit("closeHovers");
    },
    help() {
      this.$store.commit("showHover", "help");
    },
    logout: auth.logout,
    async fetchItems(item) {
        try {
            let items = (await api.fetch("/resources/" + item.path + "/")).items;
            // let items = (await api.fetch("/")).items;
            items = this.mapItem(items)
            item.children.push(...items)
            console.log(".................")
            console.log(item.name)
            this.open(item.path)
        } catch (error) {
            this.$showError(error);
        }

    },
    onItemClick(item) {
        console.log("click...............")
        console.log(item)
        this.open(item.path)
    }
  },
  data: () => ({
      files: {
          html: 'mdi-language-html5',
          js: 'mdi-nodejs',
          json: 'mdi-code-json',
          md: 'mdi-language-markdown',
          pdf: 'mdi-file-pdf',
          png: 'mdi-file-image',
          txt: 'mdi-file-document-outline',
          xls: 'mdi-file-excel',
      },
      tree: [],
      // items: []
      // tree: [],
      // items: [
      //     {
      //         id: 1,
      //         name: '施工技术管理 :',
      //         children: [
      //
      //             {
      //                 name: '工程概况',
      //                 id: '1.1',
      //                 children: [
      //                     {
      //                         name: '招标文件',
      //                         id: '1.1.1',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '投标文件',
      //                         id: '1.1.2',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工合同',
      //                         id: '1.1.3',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '工程量清单',
      //                         id: '1.1.4',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '测量控制点交桩',
      //                         id: '1.1.5',
      //                         children: [
      //                             {
      //                                 name: '测量控制点交桩记录',
      //                                 id: '1.1.5.1',
      //                                 children: [
      //
      //                                 ]
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         name: '地勘资料',
      //                         id: '1.1.6',
      //                         children: [
      //                             {
      //                                 name: '地质勘察报告',
      //                                 id: '1.1.6.1',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '地址补充勘察',
      //                                 id: '1.1.6.2',
      //                                 children: [
      //
      //                                 ]
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         name: '现场勘查',
      //                         id: '1.1.7',
      //                         children: [
      //                             {
      //                                 name: '现场陆域自然条件信息记录',
      //                                 id: '1.1.7.1',
      //                                 children: [
      //
      //                                 ]
      //
      //                             },
      //                             {
      //                                 name: '水、电、路等情况调查记录',
      //                                 id: '1.1.7.2',
      //                                 children: [
      //
      //                                 ]
      //
      //                             },
      //                             {
      //                                 name: '地貌特征记录',
      //                                 id: '1.1.7.3',
      //                                 children: [
      //
      //                                 ]
      //
      //                             },
      //                             {
      //                                 name: '现场工前条件记录',
      //                                 id: '1.1.7.4',
      //                                 children: [
      //
      //                                 ]
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         name: '工程概况说明',
      //                         id: '1.1.8',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '工程重难点',
      //                         id: '1.1.9',
      //                         children: [
      //
      //                         ]
      //                     },
      //                 ],
      //             },
      //             {
      //                 name: '图纸和BIM模型管理',
      //                 id: '1.2',
      //                 children: [
      //                     {
      //                         name: '施工图纸',
      //                         id: '1.2.1',
      //                         children: [
      //                             {
      //                                 name: '现场水域、陆域自然条件信息',
      //                                 id: '1.2.1.1',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '1.2.1.2 地质勘察报告',
      //                                 id: '1.2.1.2',
      //                                 children: [
      //
      //                                 ]
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         name: '工程量清单',
      //                         id: '1.2.2',
      //                         children: [
      //                             {
      //                                 name: '1.2.2.1 投标工程量清单',
      //                                 id: '1.2.2.1',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '1.2.2.2 施工图工程量清单核对表',
      //                                 id: '1.2.2.2',
      //                                 children: [
      //
      //                                 ]
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         name: '图纸会审',
      //                         id: '1.2.3',
      //                         children: [
      //                             {
      //                                 name: '1.2.3.1 设计交底材料',
      //                                 id: '1.2.3.1',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '1.2.3.2 图纸会审记录',
      //                                 id: '1.2.3.2',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '1.2.3.3 图纸问题清单',
      //                                 id: '1.2.3.3',
      //                                 children: [
      //
      //                                 ]
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         name: '设计变更管理',
      //                         id: '1.2.4',
      //                         children: [
      //                             {
      //                                 name: '1.2.4.1 变更图纸',
      //                                 id: '1.2.4.1',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '1.2.4.2 变更质量要求',
      //                                 id: '1.2.4.2',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '1.2.4.3 变更概况',
      //                                 id: '1.2.4.3',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '1.2.4.4 变更工程量',
      //                                 id: '1.2.4.4',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '1.2.4.5 变更概况',
      //                                 id: '1.2.4.5',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '1.2.4.6 变更施工方案',
      //                                 id: '1.2.4.6',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: '1.2.4.7 下发变更技术通知单',
      //                                 id: '1.2.4.7',
      //                                 children: [
      //
      //                                 ]
      //                             },
      //
      //                         ]
      //                     },
      //                 ],
      //             },
      //             {
      //                 name: '施工组织策划',
      //                 id: '1.3',
      //                 children: [
      //                     {
      //                         name: '施工合同',
      //                         id: '1.3.1',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工总平面布置图',
      //                         id: '1.3.2',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '人、机、料使用计划',
      //                         id: '1.3.3',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '主要施工工序、工艺',
      //                         id: '1.3.4',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "施工进度计划",
      //                         id: '1.3.5',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "施工重难点分析",
      //                         id: '1.3.6',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '现场水域、陆域自然条件信息',
      //                         id: '1.3.7',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '主要材料来源',
      //                         id: '1.3.8',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '船机设备来源',
      //                         id: '1.3.9',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '规范标准',
      //                         id: '1.3.10',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '安全策划',
      //                         id: '1.3.11',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '分部分项危险点',
      //                         id: '1.3.12',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '质量目标',
      //                         id: '1.3.13',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '创优目标',
      //                         id: '1.3.14',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '工程概况',
      //                         id: '1.3.15',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '投标文件',
      //                         id: '1.3.16',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '招标文件',
      //                         id: '1.3.17',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工图纸',
      //                         id: '1.3.18',
      //                         children: [
      //
      //                         ]
      //                     },
      //                 ],
      //             },
      //             {
      //                 name: '施工组织设计、施工方案编制',
      //                 id: '1.4',
      //                 children: [
      //                     {
      //                         name: '施工合同',
      //                         id: '1.4.1',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工总平面布置图',
      //                         id: '1.4.2',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工进度计划',
      //                         id: '1.4.3',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '人员使用计划',
      //                         id: '1.4.4',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '物资使用计划',
      //                         id: '1.4.5',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '设备使用计划',
      //                         id: '1.4.6',
      //                         children: [
      //
      //                         ]
      //
      //                     },
      //                     {
      //                         name: '主要施工工序、工艺',
      //                         id: '1.4.7',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '临时用电方案',
      //                         id: '1.4.8',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '临建方案',
      //                         id: '1.4.9',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '质量保证措施',
      //                         id: '1.4.10',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '安全、环保保证措施',
      //                         id: '1.4.11',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工组织设计、方案台账',
      //                         id: '1.4.12',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工专项方案',
      //                         id: '1.4.13',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '研讨记录',
      //                         id: '1.4.14',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '工程概况及施工重难点',
      //                         id: '1.4.15',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '工程量',
      //                         id: '1.4.16',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '投标文件',
      //                         id: '1.4.17',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '招标文件',
      //                         id: '1.4.18',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '现场调查报告',
      //                         id: '1.4.19',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '项目策划书',
      //                         id: '1.4.20',
      //                         children: [
      //
      //                         ]
      //                     }
      //                 ]
      //             },
      //             {
      //                 name: '工程分部分项划分',
      //                 id: '1.5',
      //                 children: [
      //                     {
      //                         name: '工程分部分项划分',
      //                         id: '1.5.1',
      //                         children: [
      //
      //                         ]
      //                     },
      //                 ]
      //             },
      //             {
      //                 name: '典型施工方案及总结',
      //                 id: '1.6',
      //                 children: [
      //                     {
      //                         name: '现场施工进度计划',
      //                         id: '1.6.1',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '新材料、新设备、新工艺、新方法的选用',
      //                         id: '1.6.2',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工过程数据收集',
      //                         id: '1.6.3',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '典型施工总结',
      //                         id: '1.6.4',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工组织设计及方案',
      //                         id: '1.6.5',
      //                         children: [
      //
      //                         ]
      //                     }
      //                 ]
      //             }
      //         ],
      //     },
      //     {
      //         id: 5,
      //         name: '测量管理 :',
      //         children: [
      //             {
      //                 name: '测量总体方案、沉降位移观测方案',
      //                 id: '2.1',
      //                 children: [
      //                     {
      //                         name: '交桩信息',
      //                         id: '2.1.1',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '工程概况',
      //                         id: '2.1.2',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工平面布置图',
      //                         id: '2.1.3',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '测量规范',
      //                         id: '2.1.4',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '设计图纸',
      //                         id: '2.1.5',
      //                         children: [
      //
      //                         ]
      //                     },
      //
      //                 ]
      //             },
      //             {
      //                 name: '测量控制点复测',
      //                 id: '2.2',
      //                 children: [
      //                     {
      //                         name: '施工控制测量计算书',
      //                         id: '2.2.1',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '测量控制点复测成果',
      //                         id: '2.2.2',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '测量控制点通知单',
      //                         id: '2.2.3',
      //                         children: [
      //
      //                         ]
      //                     }
      //                 ]
      //             },
      //             {
      //                 name: '加密测量控制点测设',
      //                 id: '2.3',
      //                 children: [
      //                     {
      //                         name: '加密测量控制点测量成果',
      //                         id: '2.3.1',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '测量总体方案',
      //                         id: '2.3.2',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '加密测量控制点布设',
      //                         id: '2.3.3',
      //                         children: [
      //
      //                         ]
      //                     }
      //                 ]
      //             }
      //         ],
      //     },
      //     {
      //         id: 15,
      //         name: '试验管理 :',
      //         children: [
      //             {
      //                 name: "原材料检验计划",
      //                 id: "3.1",
      //                 children: [
      //                     {
      //                         name: "工程材料使用计划",
      //                         id:  "3.1.1",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "规范标准",
      //                         id: "3.1.2",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "设计文件",
      //                         id: "3.1.3",
      //                         children: [
      //
      //                         ]
      //                     }
      //                 ]
      //             },
      //             {
      //                 name: "配合比委托",
      //                 id: "3.2",
      //                 children: [
      //                     {
      //                         name: "原材信息",
      //                         id: "3.2.1",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "配合比委托单",
      //                         id: "3.2.2",
      //                         children: [
      //
      //                         ]
      //                     }
      //                 ]
      //             }
      //         ],
      //     },
      //     {
      //         id: 19,
      //         name: '质量管理 :',
      //         children: [
      //             {
      //                 name: "工程质量策划方案",
      //                 id: "5.1",
      //                 children: [
      //                     {
      //                         name: "技术质量管理岗位管理办法",
      //                         id: "5.1.1",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "工程创优目标",
      //                         id: "5.1.2",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "施工进度计划",
      //                         id: "5.1.3",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "工程整改与奖惩信息",
      //                         id: "5.1.4",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "工程项目典型施工信息",
      //                         id: "5.1.5",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "工程项目工艺研讨信息",
      //                         id: "5.1.6",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "沉降位移观测方案",
      //                         id: "5.1.7",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "试验检测计划与方案",
      //                         id: "5.1.8",
      //                         children: [
      //
      //                         ]
      //                     },
      //
      //                 ]
      //             },
      //             {
      //                 name: "测量控制点计算书审核与验收",
      //                 id: "5.2",
      //                 children: [
      //                     {
      //                         name: "测量控制点交接资料",
      //                         id: "5.2.1",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "测量控制点复测资料",
      //                         id: "5.2.2",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "测量控制点计算书",
      //                         id: "5.2.3",
      //                         children: [
      //
      //                         ]
      //
      //                     },
      //                     {
      //                         name: "工程测量控制点验收安排",
      //                         id: "5.2.4",
      //                         children: [
      //
      //                         ]
      //                     }
      //                 ]
      //             }
      //         ],
      //     },
      //     {
      //         name: '安全管理',
      //         children: [
      //             {
      //                 name: "危险源辨识",
      //                 id: "6.1",
      //                 children: [
      //                     {
      //                         name: "修订工程危险源",
      //                         id: "6.1.1",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "用料安全、消防信息",
      //                         id: "6.1.2",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "危险源辨识会议",
      //                         id: "6.1.3",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "分部分项工程清单",
      //                         id: "6.1.4",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "工程地理位置",
      //                         id: "6.1.5",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "材料投入情况",
      //                         id: "6.1.6",
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: "船机投入情况",
      //                         id: "6.1.7",
      //                         children: [
      //
      //                         ]
      //                     },
      //                 ]
      //             },
      //             {
      //                 name: "制度建设",
      //                 id: "6.2",
      //                 children: [
      //                     {
      //                         name: "安全、文明施工管理制度",
      //                         id: "6.2.1",
      //                         children: [
      //
      //                         ]
      //                     }
      //                 ]
      //             }
      //         ]
      //     },
      //     {
      //         name: '物资管理',
      //         children: [
      //
      //             {
      //                 name: '库房仓库布置规划方案',
      //                 id: '7.1',
      //                 children: [
      //                     {
      //                         name: '工程位置',
      //                         id: '7.1.1',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '工程用料计划',
      //                         id: '7.1.2',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工平面布置',
      //                         id: '7.1.3',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '施工用料计划',
      //                         id: '7.1.4',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '用料安全，消防信息',
      //                         id: '7.1.5',
      //                         children: [
      //
      //                         ]
      //                     },
      //
      //                 ]
      //             }
      //         ]
      //     },
      //     {
      //         name: '成产调度管理',
      //         children: [
      //             {
      //                 name: "现场勘查",
      //                 id: "4.1",
      //                 children: [
      //                     {
      //                         name: "工程位置",
      //                         id: "4.1.1",
      //                         children: [
      //                             {
      //                                 name: "水、电、路等情况",
      //                                 id: "4.1.1.1",
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: "现场自然环境",
      //                                 id: "4.1.1.2",
      //                                 children: [
      //
      //                                 ]
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         name: "工程概况",
      //                         id: "4.1.2",
      //                         children: [
      //                             {
      //                                 name: "地貌特征",
      //                                 id: "4.1.2.1",
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: "现场工前条件等",
      //                                 id: "4.1.2.2",
      //                                 children: [
      //
      //                                 ]
      //                             }
      //                         ]
      //
      //                     }
      //                 ]
      //             },
      //             {
      //                 name: "组织策划施工",
      //                 id: "4.2",
      //                 children: [
      //                     {
      //                         name: "合同工期",
      //                         id: "4.2.1",
      //                         children: [
      //                             {
      //                                 name: "人、机、料投入初步计划",
      //                                 id: "4.2.1.1",
      //                                 children: [
      //
      //                                 ]
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         name: "工程特点",
      //                         id: "4.2.2",
      //                         children: [
      //                             {
      //                                 name: "施工总平面布置建议",
      //                                 id: "4.2.2.1",
      //                                 children: [
      //
      //                                 ]
      //                             },
      //                             {
      //                                 name: "施工总计划初步安排",
      //                                 id: "4.2.2.2",
      //                                 children: [
      //
      //                                 ]
      //                             }
      //                         ]
      //                     },
      //                     {
      //                         name: "工程量",
      //                         id: "4.2.3",
      //                         children: [
      //                             {
      //                                 name: "施工工序初步安排",
      //                                 id: "4.2.3.1",
      //                                 children: [
      //
      //                                 ]
      //                             }
      //
      //                         ]
      //                     }
      //                 ]
      //             }
      //
      //         ]
      //     },
      //     {
      //         name: '设备管理',
      //         children: [
      //             {
      //                 name: '船机管理',
      //                 id: '8.1',
      //                 children: [
      //                     {
      //                         name: '船机使用计划',
      //                         id: '8.1.1',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '船机租赁合同',
      //                         id: '8.1.2',
      //                         children: [
      //
      //                         ]
      //                     },
      //                     {
      //                         name: '船机管理制度',
      //                         id: '8.1.3',
      //                         children: [
      //
      //                         ]
      //                     }
      //
      //                 ]
      //             },
      //         ]
      //     },
      //     {
      //         name: '资料管理',
      //         children: []
      //     },
      //     {
      //         name: '合同管理',
      //         children: []
      //     }
      //
      //
      // ],
  }),
  props: [
      "name",
      "isDir",
      "url",
      "type",
      "size",
      "modified",
      "index",
      "readOnly",
      "path",
  ],
};
</script>
