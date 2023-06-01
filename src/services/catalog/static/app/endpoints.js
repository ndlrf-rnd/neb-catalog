import '../contrib/@apidevtools/json-schema-ref-parser.js';
import mapValues from '../contrib/lodash-es/mapValues.js';
import Vue from '../contrib/vue/vue@2.6.11.esm.browser.js';
import { parseTemplateStr } from './template-strings.js';
import VueHighlightJS from './vue-highlight-customized.js';
import OperationsWidget from './components/operations.js';

Error.stackTraceLimit = Infinity;
window.module = {};

Vue.use(VueHighlightJS);

function serializer(replacer, cycleReplacer) {
  let stack = [];
  let keys = [];

  if (cycleReplacer == null) {
    cycleReplacer = function (key, value) {
      if (stack[0] === value) return '[Circular ~]';
      return '[Circular ~.' + keys.slice(0, stack.indexOf(value)).join('.') + ']';
    };
  }

  return function (key, value) {
    if (stack.length > 0) {
      let thisPos = stack.indexOf(this);
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
      if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value);
    } else {
      stack.push(value);
    }

    return replacer == null ? value : replacer.call(this, key, value);
  };
}

function stringify(obj, replacer, spaces, cycleReplacer) {
  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces);
}

const getHyperSchemaEndpoints = async (hyperSchema) => {
  const parser = new window.$RefParser({ continueOnError: true });
  try {
    hyperSchema = await hyperSchema.json();
    hyperSchema = await (
      new Promise((res, rej) => parser.dereference(
        hyperSchema,
        {
          continueOnError: true,
          dereference: { circular: 'ignore' },
        },
        (err, schema) => {
          if (err) {
            rej(err);
          } else {
            res(schema);
          }
        }),
      )
    );
    // hyperSchema = await parser.bundle(hyperSchema, { dereference: { circular: true } });
  } catch (e) {
    return Promise.reject(e);
  }
  return (await Promise.all(
    (hyperSchema.links || []).filter(v => !!v).map(
      async res => {
        if (!res) {
          return null;
        }
        try {


          if (res.$ref) {
            if (hyperSchema.$defs) {
              res = hyperSchema.$defs[res.$ref];
            }
          }
          let hrefSchema = null;
          let targetSchemaStr = null;
          let submissionSchema = null;
          let submissionSchemaStr = null;
          let submissionExamplesStr = null;
          if (res.targetSchema) {
            targetSchemaStr = stringify(res.targetSchema, null, 2);
          }
          if (res.submissionSchema) {
            submissionSchema = res.submissionSchema;
            submissionSchemaStr = stringify(submissionSchema, null, 2);
            submissionExamplesStr = stringify((submissionSchema.examples || [{}])[0], null, 2);
          }

          if (res.hrefSchema) {
            hrefSchema = res.hrefSchema;
          }
          return {
            ...res,
            title: res.title || 'Untitled',
            submissionSchema,
            submissionSchemaStr,
            submissionExamplesStr,
            hrefSchema,
            targetSchemaStr,
          };
        } catch (err) {
          throw err;
        }
      },
    ),
  )).filter(v => !!v);
};

const getCurrentVariables = (schemaEndpoints) => schemaEndpoints.reduce(
  (a, { href }) => {
    if (href) {

      const uriTemplate = new window.UriTemplate(href);
      const uri = window.location.href.split('#').slice(-1)[0];
      const extracted = uriTemplate.fromUri(uri);
      Object.keys(extracted || {}).forEach(k => {
        if (extracted[k]) {
          a[k] = extracted[k];
        }
      });
    }
    return a;
  },
  {},
);

const getDefaultVariables = (hrefSchema) => Object.keys(hrefSchema || {}).reduce(
  (a, o) => ({
    ...a,
    [o]: hrefSchema[o].default,
  }),
  {},
);
Vue.component(
  'code-tabs',
  {
    props: {
      pending: Boolean,
      input: String,
      schema: String,
      name: String,
      editable: Boolean,
      title: String,
    },
    computed: {
      data: function () {
        return this.input;
      },
    },
    data: function () {
      return {
        content: this.input,
        schemaVisible: false,
      };
    },
    template: `<div class="code-tabs">
        <h3>
          <span v-bind:class="{tab: true, 'tab-active': !schemaVisible}" @click="toggle">{{title}}</span>
          <span v-bind:class="{tab: true, 'tab-active': schemaVisible}" @click="toggle">Schema</span>
          <div v-if="pending" class="rotating tab">☸</div>
        </h3>
        <span v-if="!schemaVisible">
          <textarea v-if="editable" v-bind:name="name" v-model="content" placeholder="You can edit this field"/>
          <pre v-highlightjs="data"><code class="language-json"/></pre>
<!--          <pre><code  class="language-json">{{data}}</code></pre>-->
        </span>
        <span v-if="schemaVisible">
            <pre v-highlightjs="schema"><code class="language-json" >{{schema}}</code></pre>
        </span>
    </div>`,
    methods: {
      toggle: function (e) {
        this.schemaVisible = !this.schemaVisible;
      },
    },
  },
);


Vue.component(
  'endpoint',
  {
    props: {
      currentVariables: Object,
      // variables: Object,
      urlTemplate: Object,
      method: String,
      href: String,
      hrefSchema: Object,
      hrefTemplate: String,
      targetSchemaStr: String,
      submissionExamplesStr: String,
      submissionSchemaStr: String,
      isCurrent: Boolean,
      title: String,
      description: String,
    },
    data: function () {
      return {
        // response: '{"links":[]}',
        response: null,
        responsePending: null,
      };
    },
    template: `<div :class="'endpoint' + (isCurrent ? ' current' : '')">
        <div class="heading">
        <h2><a :href="'#' + renderedHref">{{title}}</a></h2>
        <code>[{{method}}] {{fullHref}}</code>
        <div>{{description}}</div>
        </div>
        <form
            :action="renderedHref" 
            :method="method" 
            novalidate="true" 
            @submit="submit"
            class="form"
        >
            <div class="group" v-for="(variables,operator) in fields">
              <p class="variable" v-for="variable in variables">
                <span class="operator">{{operator}}</span>
                <span class="input">
                  <label v-bind:for="variable.name">{{variable.title}}</label>
                  <input
                      v-model="variable.value"
                      v-bind:name="variable.name"
                      v-bind:placeholder="variable.name"
                  />
                </span>
              </p>
            </div>

            <code-tabs
                :pending="responsePending"
                :schema="submissionSchemaStr"
                :title="'Body payload'"
                :editable="true"
                :name="'body'"
                :input="submissionExamplesStr"
                v-if="submissionSchemaStr"
            >
            </code-tabs>
            
            <div class="group group-centered">
              <button class="button-send" type="submit">Send request</button>
            </div>
            </form>
            
            <operations-viewer
              :input="response"
              v-if="fullHref.match(/operations/uig) && response"
            ></operations-viewer>
            
            <code-tabs
              :pending="responsePending"
              :schema="targetSchemaStr"
              :title="'Response'"
              :input="response"
              v-if="isCurrent && (targetSchemaStr || response || responsePending)"
            />
          </div>`,
    computed: {
      defaultVariables: function () {
        return getDefaultVariables(this.hrefSchema);
      },

      renderedHref: function () {
        if (this.href) {


          const uriTemplate = new window.UriTemplate(this.href);
          return uriTemplate.fill(
            Object.assign(
              {},
              this.defaultVariables,
              this.currentVariables,
            ),
          );
        }
      },
      fields: function () {
        const defaultVariables = this.defaultVariables;
        const currentVariables = this.currentVariables;
        const templateVars = parseTemplateStr(this.href) || {};
        return mapValues(templateVars, vars => vars.map(vv => {
          const value = currentVariables[vv] || defaultVariables[vv];
          return {
            ...this.hrefSchema[vv],
            name: vv,
            value,
          };
        }));
      },
      fullHref: function () {
        return location.origin + this.href;
      },
    },
    methods: {
      submit: async function (e) {
        e.preventDefault();
        const { action, method } = e.target;
        const data = {};
        e.target.querySelectorAll('input,textarea').forEach(el => {
          if (el.value) {
            data[el.getAttribute('name')] = el.value;
          }
        });
        this.responseStatus = null;
        this.response = null;
        this.responsePending = true;
        if (this.href) {
          try {

            const uriTemplate = new window.UriTemplate(this.href);
            const url = uriTemplate.fill(data);
            const res = await fetch(
              url,
              {
                method,
                ...(data.body ? {
                  body: data.body,
                  headers: { 'Content-Type': 'application/json' },
                } : {}),
              },
            );
            const mediaType = res.headers.get('Content-Type');
            if (mediaType.match(/json/uig)) {
              this.response = stringify(await res.json(), null, 2);
            } else {
              this.response = await res.text();
            }
            this.responsePending = false;
            this.responseStatus = res.status;
          } catch (e) {
            this.response = e;
            this.responseStatus = e.message.status;
            this.responsePending = false;
          }
        }
      },
    },
  },
);

// define the endpoints component
Vue.component(
  'endpoints',
  async () => {
    const res = await fetch(location.origin + '/schemas/hyper-schema.json?bundle=true');
    let schemaEndpoints = [];
    try {
      schemaEndpoints = await getHyperSchemaEndpoints(res);
    } catch (e) {
      console.error('ERROR:', e);
    }
    return {
      template: `<section class="endpoints">
            <div v-for="endpoint in endpoints" >
                <endpoint 
                    v-bind="endpoint" 
                    :responsePending="responsePending"
                />
            </div>
        </section>`,

      data: function () {
        const a = {};
        schemaEndpoints.forEach(endpointObj => {
          if (endpointObj.href) {

            const uriTemplate = new window.UriTemplate(endpointObj.href);
            const extracted = uriTemplate.fromUri(window.location.href);
            Object.keys(extracted || {}).forEach(k => {
              if (extracted[k]) {
                a[k] = extracted[k];
              }
            });
          }
        });
        return {
          response: null,
          responseStatus: null,
          responsePending: false,
          schemaEndpoints,
          // variables,
        };
      },
      props: {
        currentPath: String,
      },
      computed: {
        endpoints: function () {
          const currentVariables = getCurrentVariables(this.schemaEndpoints);
          return schemaEndpoints.map(
            endpointObj => {
              const { href, hrefSchema, method } = endpointObj;
              if (href) {

                const uriTemplate = new window.UriTemplate(href);
                const renderedHref = uriTemplate.fill(currentVariables);
                const isCurrent = (this.currentPath === renderedHref);
                return {
                  ...endpointObj,
                  currentVariables,
                  isCurrent,
                  uriTemplate,
                };
              }
              return null;
            },
          ).filter(v => !!v);
        },
      },
    };
  },
);
