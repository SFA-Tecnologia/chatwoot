<template>
    <div class="flex-1 overflow-auto p-4">
        <div class="flex justify-between items-center mb-4">
            <!-- Filters on the Left, with flex-grow to take available space -->
            <div class="flex-grow">
                <report-filter-selector
                        :show-agents-filter="true"
                        :show-inbox-filter="true"
                        :show-business-hours-switch="false"
                        @filter-change="onFilterChange"
                />
            </div>

            <!-- Buttons on the Right -->
            <div class="flex items-center space-x-2">
                <woot-button
                        color-scheme="success"
                        icon="arrow-download"
                        @click="downloadXLSXReports"
                >
                    {{ $t('REPORT.DOWNLOAD_AGENT_REPORTS.XLSX') }}
                </woot-button>
                <woot-button
                        color-scheme="success"
                        icon="arrow-download"
                        @click="downloadPDFReports"
                >
                    {{ $t('REPORT.DOWNLOAD_AGENT_REPORTS.PDF') }}
                </woot-button>
            </div>
        </div>

        <!-- Agent Table -->
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
    downloadXLSXReports() {
      try {
        this.$store.dispatch('conversationReport/downloadXlsx', this.requestPayload);
      } catch (error) {
        this.showAlert(this.$t('AGENT_REPORTS.DOWNLOAD_FAILED'));
      }
    },
    downloadPDFReports() {
      try {
        this.$store.dispatch('conversationReport/downloadPDF', this.requestPayload);
      } catch (error) {
        this.showAlert(this.$t('AGENT_REPORTS.DOWNLOAD_FAILED'));
      }
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
