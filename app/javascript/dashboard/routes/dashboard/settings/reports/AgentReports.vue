<template>
  <div class="flex-1 overflow-auto p-4">
    <report-filter-selector
        :show-agents-filter="true"
        :show-inbox-filter="true"
        :show-business-hours-switch="false"
        @filter-change="onFilterChange"
    />
    <woot-button
        color-scheme="success"
        class-names="button--fixed-top"
        icon="arrow-download"
        @click="downloadReports"
    >
      {{ $t('REPORT.DOWNLOAD_AGENT_REPORTS') }}
    </woot-button>
    <agent-table :page-index="pageIndex" @page-change="onPageNumberChange"/>
  </div>

</template>

<script>
import ReportFilterSelector from './components/FilterSelector.vue';
import {mapGetters} from "vuex";
import WootButton from "../../../../components/ui/WootButton.vue";
import AgentTable from "./components/AgentTable.vue";
import alertMixin from '../../../../../shared/mixins/alertMixin';
import {REPORTS_EVENTS} from "../../../../helper/AnalyticsHelper/events";

export default {
  components: {
    WootButton,
    AgentTable,
    ReportFilterSelector,
  },
  mixins: [alertMixin],
  data() {
    return {
      pageIndex: 1,
      from: 0,
      to: 0,
      userIds: [],
      inbox: null,
    }
  },
  computed: {
    ...mapGetters({
      accountId: 'getCurrentAccountId',
      conversationsResponses: 'conversationReport/getConversations',
    }),
    requestPayload() {
      return {
        from: this.from,
        to: this.to,
        user_ids: this.userIds,
        inbox_id: this.inbox
      };
    }
  },
  methods: {
    getConversartions() {
      try {
        this.$store.dispatch('conversationReport/getConversations', {
          page: this.pageIndex,
          ...this.requestPayload,
        });
      } catch {
        this.showAlert(this.$t('REPORT.DATA_FETCHING_FAILED'));
      }
    },
    downloadReports() {
      console.info('TESTE');
    },
    onPageNumberChange(pageIndex) {
      this.pageIndex = pageIndex;
      this.getConversartions();
    },
    onFilterChange({
                     from,
                     to,
                     selectedAgents,
                     selectedInbox,
                   }) {
      // do not track filter change on inital load
      if (this.from !== 0 && this.to !== 0) {
        this.$track(REPORTS_EVENTS.FILTER_REPORT, {
          filterType: 'date',
          reportType: 'agent',
        });
      }

      this.from = from;
      this.to = to;
      this.userIds = selectedAgents.map(el => el.id);
      this.inbox = selectedInbox?.id;
      this.pageIndex = 1;

      this.getConversartions();
    },
  },
};
</script>
