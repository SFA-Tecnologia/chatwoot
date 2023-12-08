/* global axios */
import ApiClient from './ApiClient';

class ConversationApi extends ApiClient {
  constructor() {
    super('conversations', { accountScoped: true });
  }

  getLabels(conversationID) {
    return axios.get(`${this.url}/${conversationID}/labels`);
  }

  updateLabels(conversationID, labels) {
    return axios.post(`${this.url}/${conversationID}/labels`, { labels });
  }

  getReportConversations({ page, from, to, user_ids, inbox_id } = {}) {
    return axios.get(`${this.url}/get_conversations_by_assignee`, {
      params: { since: from, until: to,
        sort: '-created_at', user_ids, inbox_id, page },
    });
  }
}

export default new ConversationApi();
