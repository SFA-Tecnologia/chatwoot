/* global axios */
import ApiClient from './ApiClient';

class ConversationApi extends ApiClient {
  constructor() {
    super('conversations', {accountScoped: true});
  }

  getLabels(conversationID) {
    return axios.get(`${this.url}/${conversationID}/labels`);
  }

  updateLabels(conversationID, labels) {
    return axios.post(`${this.url}/${conversationID}/labels`, {labels});
  }

  getReportConversations({page, from, to, user_ids, inbox_id} = {}) {
    return axios.get(`${this.url}/get_conversations_by_assignee`, {
      params: {
        since: from, until: to,
        sort: '-created_at', user_ids, inbox_id, page
      }
    });
  }

  downloadXlsx({from, to, user_ids, inbox_id} = {}) {
    return axios.get(`${this.url}/download_xlsx`, {
      params: {
        since: from,
        until: to,
        sort: '-created_at',
        user_ids,
        inbox_id
      },
      responseType: 'blob',
    });
  }

  downloadPDF({from, to, user_ids, inbox_id} = {}) {
    return axios.get(`${this.url}/download_pdf`, {
      params: {
        since: from,
        until: to,
        sort: '-created_at',
        user_ids,
        inbox_id
      },
      responseType: 'blob',
    });
  }
}

export default new ConversationApi();
