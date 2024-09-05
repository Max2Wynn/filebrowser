<template>
  <header>
    <img v-if="showLogo !== undefined" :src="logoURL" />
    <action
      v-if="showMenu !== undefined"
      class="menu-button"
      icon="menu"
      :label="$t('buttons.toggleSidebar')"
      @action="openSidebar()"
    />

    <slot />

    <button
        class="action"
        @click="toRoot"
        :aria-label="$t('sidebar.myFiles')"
        :title="$t('sidebar.myFiles')"
    >
      <i class="material-icons">folder</i>
      <span>{{ $t("sidebar.myFiles") }}</span>
    </button>

    <button
        @click="$store.commit('showHover', 'newDir')"
        class="action"
        :aria-label="$t('sidebar.newFolder')"
        :title="$t('sidebar.newFolder')"
    >
      <i class="material-icons">create_new_folder</i>
      <span>{{ $t("sidebar.newFolder") }}</span>
    </button>

    <button
        @click="$store.commit('showHover', 'newFile')"
        class="action"
        :aria-label="$t('sidebar.newFile')"
        :title="$t('sidebar.newFile')"
    >
      <i class="material-icons">note_add</i>
      <span>{{ $t("sidebar.newFile") }}</span>
    </button>

    <button
        class="action"
        @click="toSettings"
        :aria-label="$t('sidebar.settings')"
        :title="$t('sidebar.settings')"
    >
      <i class="material-icons">settings_applications</i>
      <span>{{ $t("sidebar.settings") }}</span>
    </button>

    <button
        v-if="canLogout"
        @click="logout"
        class="action"
        id="logout"
        :aria-label="$t('sidebar.logout')"
        :title="$t('sidebar.logout')"
    >
      <i class="material-icons">exit_to_app</i>
      <span>{{ $t("sidebar.logout") }}</span>
    </button>


    <div id="dropdown" :class="{ active: this.currentPromptName === 'more' }">
      <slot name="actions" />
    </div>

    <action
      v-if="this.$slots.actions"
      id="more"
      icon="more_vert"
      :label="$t('buttons.more')"
      @action="$store.commit('showHover', 'more')"
    />

    <div
      class="overlay"
      v-show="this.currentPromptName == 'more'"
      @click="$store.commit('closeHovers')"
    />



  </header>
</template>

<script>
import {disableExternal, disableUsedPercentage, loginPage, logoURL, noAuth, signup, version} from "@/utils/constants";

import Action from "@/components/header/Action.vue";
import {mapGetters, mapState} from "vuex";
import * as auth from "@/utils/auth.js";

export default {
  name: "header-bar",
  props: ["showLogo", "showMenu"],
  components: {
    Action,
  },
  data: function () {
    return {
      logoURL,
    };
  },
  methods: {
    openSidebar() {
      this.$store.commit("showHover", "sidebar");
    },
    toRoot() {
        this.$router.push({ path: "/files/" }, () => {});
        this.$store.commit("closeHovers");
    },
    logout: auth.logout,
    toSettings() {
        this.$router.push({ path: "/settings" }, () => {});
        this.$store.commit("closeHovers");
    },
  },
  computed: {
    ...mapGetters(["currentPromptName"]),
    canLogout: () => !noAuth && loginPage,
    signup: () => signup,
  },
};
</script>

<style></style>
