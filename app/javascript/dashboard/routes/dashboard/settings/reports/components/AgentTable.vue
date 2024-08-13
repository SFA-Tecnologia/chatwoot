<template>
  <div class="csat--table-container">
    <ve-table
      max-height="calc(100vh - 21.875rem)"
      :fixed-header="true"
      :border-around="true"
      :columns="columns"
      :table-data="tableData"
      :sort-option="sortOption"
    />
    <div v-show="conversationsResponses.total_count === 0" class="csat--empty-records">
      {{ $t('CSAT_REPORTS.NO_RECORDS') }}
    </div>
    <div class="table-pagination">
      <ve-pagination
        :total="conversationsResponses.total_count"
        :page-index="pageIndex"
        :page-size="25"
        :page-size-option="[25]"
        @on-page-number-change="onPageNumberChange"
      />
    </div>
  </div>
</template>
<script>
import {VePagination, VeTable} from "vue-easytable";
import timeMixin from 'dashboard/mixins/time';
import rtlMixin from 'shared/mixins/rtlMixin';
import {mapGetters} from "vuex";

export default {
  components: {
    VeTable,
    VePagination,
  },
  mixins: [timeMixin, rtlMixin],
  props: {
    pageIndex: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      sortOption: {
        sortChange: params => {
          this.sortChange(params);
        },
      },
    };
  },
  computed: {
    ...mapGetters({
      conversationsResponses: 'conversationReport/getConversations',
    }),
    columns() {
      return [
        {field: "username", key: "username", title: "Nome do Agente", align: "left"},
        {
          field: "protocolo",
          key: "protocolo",
          title: "Protocolo",
          align: "center",
        },
        {
          field: "datachegada",
          key: "datachegada",
          title: "Data de Chegada",
          align: "center",
          sortBy: "",
        },
        {
          field: "dataatendimento",
          key: "dataatendimento",
          title: "Data de Atendimento",
          align: "center",
          sortBy: "asc",
          sortBy: "asc",
        },
        {
          field: "status",
          key: "status",
          title: "Status",
          align: "center",
        },
      ];
    },
    tableData() {
      return this.conversationsResponses.conversations.map(conversation => ({
        username: conversation.assignee?.name || '---',
        protocolo: conversation.additional_attributes.protocolo || '---',
        datachegada: new Date(conversation.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        dataatendimento: conversation.first_reply_created_at ? new Date(conversation.first_reply_created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '---',
        status: this.$t(`CHAT_LIST.CHAT_STATUS_FILTER_ITEMS.${conversation.status}.TEXT`),
      }));
    },
  },
  methods: {
    onPageNumberChange(pageIndex) {
      this.$emit('page-change', pageIndex);
    },
    sortChange(params) {
      const sortField = Object.keys(params).find(key => params[key] !== '');
      const sortOrder = params[sortField];

      if (sortField) {
        this.tableData.sort((a, b) => {
          const x = new Date(a[sortField]).getTime();
          const y = new Date(b[sortField]).getTime();

          if (sortOrder === 'asc') {
            return x - y;
          }
          if (sortOrder === 'desc') {
            return y - x;
          }
          return 0;
        });
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.csat--table-container {
  display: flex;
  flex-direction: column;
  flex: 1;

  .ve-table {
    @apply bg-white dark:bg-slate-900;

    &::v-deep {
      .ve-table-container {
        border-radius: var(--border-radius-normal);
      }

      th.ve-table-header-th {
        font-size: var(--font-size-mini) !important;
        padding: var(--space-normal) !important;
      }

      td.ve-table-body-td {
        padding: var(--space-small) var(--space-normal) !important;
      }
    }
  }

  &::v-deep .ve-pagination {
    background-color: transparent;
  }

  &::v-deep .ve-pagination-select {
    display: none;
  }

  .emoji-response {
    font-size: var(--font-size-large);
  }

  .table-pagination {
    margin-top: var(--space-normal);
    text-align: right;
  }
}

.csat--empty-records {
  align-items: center;
  // border: 1px solid var(--color-border);
  border-top: 0;
  display: flex;
  font-size: var(--font-size-small);
  height: 12.5rem;
  justify-content: center;
  margin-top: -1px;
  width: 100%;
  @apply text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-900 border border-t-0 border-solid border-slate-75 dark:border-slate-700;
}

.csat--timestamp {
  @apply text-slate-600 dark:text-slate-200 text-sm;
}
</style>
