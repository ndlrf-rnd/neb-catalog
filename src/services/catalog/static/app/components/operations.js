import Vue from '../../contrib/vue/vue@2.6.11.esm.browser.js';
import { ms2minStr, parseTsRange } from '../utils.js';

export const STATE_TO_COLOR = {
  'PENDING': '#b6daf2',
  'PROCESSING': '#2196F3',
  'FINALIZING': '#009688',
  'SUCCESSFUL': '#4CAF50',
  'FAILED': '#F44336',
  'CANCELLING': '#404040',
  'CANCELLED': '#202020',
  'UNSPECIFIED': '#FFC107',
};

// define the endpoints component
export default Vue.component(
  'operations-viewer',
  async () => {
    return {
      template: `<section class="operations">
      <div v-for="operation in operations" class="operation">
      <div class="operation-id">{{operation.id}}</div>
      <div class="operation-type">{{operation.type}}</div>
      <div class="operation-state badge" v-bind:style="{'background-color': operation.stateColor}">{{operation.state}}</div>
      <div class="row"><span>Elapsed: {{operation.secondsPassed}}</span></div>
      <div>
          <span style="font-weight: bolder">{{operation.documents_completed}} {{operation.documents_estimated ? operation.documents_estimated : '?'}} recs</span>\`,
          <span style="font-weight: bolder">{{operation.bytes_completed}} {{operation.bytes_estimated ? operation.bytes_estimated : '?'}} recs</span>\`,
      </div>
      <div>
          <span style="font-weight: bolder">{{operation.rps}} rec/sec</span>
          <span style="font-weight: bolder">{{operation.bps}} bytes/sec</span>
      </div>
      <div v-if="operation.input" class="io-cell">
        <pre class="io-data"><code>{{JSON.stringify(operation.input, null, 2)}}</code></pre>
      </div>
      <div v-if="operation.output" class="io-cell">
        <pre class="io-data"><code>{{JSON.stringify(operation.output, null, 2)}}</code></pre>
      </div>
    </div>
            </div>
        </section>`,
      computed: {
        operations: function () {
          try {
            const res = JSON.parse(this.input || '');
            return res.links.map(op => {
              const running_time = parseTsRange(op.running_time);
              const now = new Date();
              const msPassed = (running_time[1] || now).getTime() - (running_time[0] || now).getTime();
              const secondsPassed = msPassed / 1000;
              return ({
                ...op,
                secondsPassed: ms2minStr(msPassed),
                rps: secondsPassed ? ((op.documents_completed || 0) / secondsPassed).toFixed(0) : '...',
                bps: secondsPassed ? ((op.bytes_completed || 0) / secondsPassed).toFixed(0) : '...',
                stateColor: STATE_TO_COLOR[op.state],
              });
            });
          } catch (e) {
            return [{
              id: null,
              type: null,
              error: 'Invalid response',
            }];
          }
        },
      },
      props: {
        input: String,
      },
    };
  },
);
