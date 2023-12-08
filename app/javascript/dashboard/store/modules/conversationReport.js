import ConversationApi from '../../api/conversations';
import types from '../mutation-types';

export const state = {
  conversations: [],
}

export const getters = {
  getConversations(_state) {
    return _state.conversations;
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
}

export const mutations = {
  [types.CONVERSATIONS_BY_ASSIGNEE](_state, payload) {
    _state.conversations = payload;
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
