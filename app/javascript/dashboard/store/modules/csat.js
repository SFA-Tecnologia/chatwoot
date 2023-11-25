import * as MutationHelpers from 'shared/helpers/vuex/mutationHelpers';
import types from '../mutation-types';
import CSATReports from '../../api/csatReports';
import { downloadCsvFile } from '../../helper/downloadHelper';
import AnalyticsHelper from '../../helper/AnalyticsHelper';
import { REPORTS_EVENTS } from '../../helper/AnalyticsHelper/events';

const computeDistribution = (value, total) =>
  ((value * 100) / total).toFixed(2);

export const state = {
  records: [],
  metrics: {
    totalResponseCount: 0,
    ratingsCount: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
    },
    ratingsTechCount: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
    },
    totalSentMessagesCount: 0,
  },
  uiFlags: {
    isFetching: false,
    isFetchingMetrics: false,
  },
};

export const getters = {
  getCSATResponses(_state) {
    return _state.records;
  },
  getMetrics(_state) {
    return _state.metrics;
  },
  getUIFlags(_state) {
    return _state.uiFlags;
  },
  getSatisfactionScore(_state) {
    if (!_state.metrics.totalResponseCount) {
      return 0;
    }
    return computeDistribution(
      _state.metrics.ratingsCount[9] + _state.metrics.ratingsCount[10] +
      _state.metrics.ratingsTechCount[9] + _state.metrics.ratingsTechCount[10],
      _state.metrics.totalResponseCount * 2
    );
  },
  getResponseRate(_state) {
    if (!_state.metrics.totalSentMessagesCount) {
      return 0;
    }
    return computeDistribution(
      _state.metrics.totalResponseCount,
      _state.metrics.totalSentMessagesCount
    );
  },
  getRatingPercentage(_state) {
    if (!_state.metrics.totalResponseCount) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    }
    return {
      1: computeDistribution(
        _state.metrics.ratingsCount[1],
        _state.metrics.totalResponseCount
      ),
      2: computeDistribution(
        _state.metrics.ratingsCount[2],
        _state.metrics.totalResponseCount
      ),
      3: computeDistribution(
        _state.metrics.ratingsCount[3],
        _state.metrics.totalResponseCount
      ),
      4: computeDistribution(
        _state.metrics.ratingsCount[4],
        _state.metrics.totalResponseCount
      ),
      5: computeDistribution(
        _state.metrics.ratingsCount[5],
        _state.metrics.totalResponseCount
      ),
      6: computeDistribution(
        _state.metrics.ratingsCount[6],
        _state.metrics.totalResponseCount
      ),
      7: computeDistribution(
        _state.metrics.ratingsCount[7],
        _state.metrics.totalResponseCount
      ),
      8: computeDistribution(
        _state.metrics.ratingsCount[8],
        _state.metrics.totalResponseCount
      ),
      9: computeDistribution(
        _state.metrics.ratingsCount[9],
        _state.metrics.totalResponseCount
      ),
      10: computeDistribution(
        _state.metrics.ratingsCount[10],
        _state.metrics.totalResponseCount
      ),
    };
  },
  getRatingTechPercentage(_state) {
    if (!_state.metrics.totalResponseCount) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    }
    return {
      1: computeDistribution(
        _state.metrics.ratingsTechCount[1],
        _state.metrics.totalResponseCount
      ),
      2: computeDistribution(
        _state.metrics.ratingsTechCount[2],
        _state.metrics.totalResponseCount
      ),
      3: computeDistribution(
        _state.metrics.ratingsTechCount[3],
        _state.metrics.totalResponseCount
      ),
      4: computeDistribution(
        _state.metrics.ratingsTechCount[4],
        _state.metrics.totalResponseCount
      ),
      5: computeDistribution(
        _state.metrics.ratingsTechCount[5],
        _state.metrics.totalResponseCount
      ),
      6: computeDistribution(
        _state.metrics.ratingsTechCount[6],
        _state.metrics.totalResponseCount
      ),
      7: computeDistribution(
        _state.metrics.ratingsTechCount[7],
        _state.metrics.totalResponseCount
      ),
      8: computeDistribution(
        _state.metrics.ratingsTechCount[8],
        _state.metrics.totalResponseCount
      ),
      9: computeDistribution(
        _state.metrics.ratingsTechCount[9],
        _state.metrics.totalResponseCount
      ),
      10: computeDistribution(
        _state.metrics.ratingsTechCount[10],
        _state.metrics.totalResponseCount
      ),
    };
  },
};

export const actions = {
  get: async function getResponses({ commit }, params) {
    commit(types.SET_CSAT_RESPONSE_UI_FLAG, { isFetching: true });
    try {
      const response = await CSATReports.get(params);
      commit(types.SET_CSAT_RESPONSE, response.data);
    } catch (error) {
      // Ignore error
    } finally {
      commit(types.SET_CSAT_RESPONSE_UI_FLAG, { isFetching: false });
    }
  },
  getMetrics: async function getMetrics({ commit }, params) {
    commit(types.SET_CSAT_RESPONSE_UI_FLAG, { isFetchingMetrics: true });
    try {
      const response = await CSATReports.getMetrics(params);
      commit(types.SET_CSAT_RESPONSE_METRICS, response.data);
    } catch (error) {
      // Ignore error
    } finally {
      commit(types.SET_CSAT_RESPONSE_UI_FLAG, { isFetchingMetrics: false });
    }
  },
  downloadCSATReports(_, params) {
    return CSATReports.download(params).then(response => {
      downloadCsvFile(params.fileName, response.data);
      AnalyticsHelper.track(REPORTS_EVENTS.DOWNLOAD_REPORT, {
        reportType: 'csat',
      });
    });
  },
};

export const mutations = {
  [types.SET_CSAT_RESPONSE_UI_FLAG](_state, data) {
    _state.uiFlags = {
      ..._state.uiFlags,
      ...data,
    };
  },

  [types.SET_CSAT_RESPONSE]: MutationHelpers.set,
  [types.SET_CSAT_RESPONSE_METRICS](
    _state,
    {
      total_count: totalResponseCount,
      ratings_count: ratingsCount,
      ratings_tech_count: ratingsTechCount,
      total_sent_messages_count: totalSentMessagesCount,
    }
  ) {
    _state.metrics.totalResponseCount = totalResponseCount || 0;
    _state.metrics.ratingsCount = {
      1: ratingsCount['1'] || 0,
      2: ratingsCount['2'] || 0,
      3: ratingsCount['3'] || 0,
      4: ratingsCount['4'] || 0,
      5: ratingsCount['5'] || 0,
      6: ratingsCount['6'] || 0,
      7: ratingsCount['7'] || 0,
      8: ratingsCount['8'] || 0,
      9: ratingsCount['9'] || 0,
      10: ratingsCount['10'] || 0,
    };
    _state.metrics.ratingsTechCount = {
      1: ratingsTechCount['1'] || 0,
      2: ratingsTechCount['2'] || 0,
      3: ratingsTechCount['3'] || 0,
      4: ratingsTechCount['4'] || 0,
      5: ratingsTechCount['5'] || 0,
      6: ratingsTechCount['6'] || 0,
      7: ratingsTechCount['7'] || 0,
      8: ratingsTechCount['8'] || 0,
      9: ratingsTechCount['9'] || 0,
      10: ratingsTechCount['10'] || 0,
    };
    _state.metrics.totalSentMessagesCount = totalSentMessagesCount || 0;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
