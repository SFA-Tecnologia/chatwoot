import ConversationApi from '../../api/conversations';
import types from '../mutation-types';

export const state = {
  records: {
    conversations: [],
    total_pages: 0,
    current_page: 0,
    total_count: 0,
  },
}

export const getters = {
  getConversations(_state) {
    return _state.records;
  },
}

export const actions = {
  getConversations: async function ({commit}, params) {
    try {
      const response = await ConversationApi.getReportConversations(params);
      commit(types.CONVERSATIONS_BY_ASSIGNEE, response.data);
    } catch (error) {
      console.log(error);
    }
  },
  downloadXlsx: async function ({commit}, params) {
    try {
      const response = await ConversationApi.downloadXlsx(params);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.setAttribute('download', 'relatorio.xlsx');
      link.setAttribute('href', url);
      link.click();
      return link;
    } catch (error) {
      console.log(error);
    }
  },
  downloadPDF: async function ({commit}, params) {
    try {
      const response = await ConversationApi.downloadPDF(params);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.setAttribute('download', 'relatorio.pdf');
      link.setAttribute('href', url);
      link.click();
      return link;
    } catch (error) {
      console.log(error);
    }
  },
}

export const mutations = {
  [types.CONVERSATIONS_BY_ASSIGNEE](_state, payload) {
    if (payload === "") {
      _state.records = {
        conversations: [],
        total_pages: 0,
        current_page: 0,
        total_count: 0,
      };
    } else {
      _state.records = payload;
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
