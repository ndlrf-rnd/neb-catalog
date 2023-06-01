const isEmpty = (x) => ((typeof x === 'undefined') || (x == null));
const isObject = (x) => {
  if (!x) {
    return false;
  }
  const t = typeof x;
  return (t === 'object') || (t === 'function');
};

// import lodash from '../../contrib/lodash-es/lodash.js';

// const { uniq, zip, get, flattenDeep } = lodash.flatMapDeep;
import uniq from '../../contrib/lodash-es/uniq.js';
import zip from '../../contrib/lodash-es/zip.js';
import get from '../../contrib/lodash-es/get.js';
import flattenDeep from '../../contrib/lodash-es/flattenDeep.js';


export const PUB_ROOT_SCHEMA = 'marc21-bibliographic-rsl-1.0.0.schema.json';
// export const PUB_ROOT_SCHEMA = 'publication.schema.json';
// export const PUB_SCHEMAS_PATHS = [
//   'bcp.schema.json',
//   'contributor.schema.json',
//   'contributor-object.schema.json',
//   'link.schema.json',
//   'localizable.schema.json',
//   'localizable-object.schema.json',
//   'publication.schema.json',
//   'resource.categorization.schema.json',
//   'url.schema.json',
//
// ];
export const PUB_SCHEMAS_PATHS = ['marc21-bibliographic-rsl-1.0.0.schema.json'];
export const PUB_OVERRIDES_PATHS = [
  // 'bcp.schema.json',
  // 'link.schema.json',
  // 'publication.schema.json',
];
/**
 * Fast function for omitting object properties
 *
 * Aligned with ES6
 * Source: https://levelup.gitconnected.com/omit-is-being-removed-in-lodash-5-c1db1de61eaf
 *
 * @param originalObject
 * @param keysToOmit
 * @returns {{}}
 */
const omit = (originalObject = {}, keysToOmit = []) => {
  const clonedObject = { ...originalObject };

  for (const path of keysToOmit) {
    delete clonedObject[path];
  }

  return clonedObject;
};

/***
 * @const Constants
 */
const NESTED_SCHEMA_PROPERTIES = [
  'anyOf',
  'oneOf',
  'items',
  'properties',
];

const DEFAULT_I18N = {
  SAVE_BUTTON_TITLE: 'Save',
};

const SORTABLE_CONFIG = {
  swapThreshold: 0.75,
  animation: 100,
  handle: '.sortable-handle',
  ghostClass: 'sortable-ghost',
};
const MAX_CIRCULAR_DEPTH = 2;


const extendClass = (oldClass, newClass) => uniq([
  ...(oldClass || '').split(/\p{Z}+/uig).filter(
    (x) => x.trim().length > 0,
  ),
  newClass,
]).sort().join(' ');

const removeClass = (oldClass, classToRemove) => (oldClass || '').split(/\p{Z}+/uig).filter(
  (x) => x !== classToRemove,
).join(' ');


const forceArray = (x) => (Array.isArray(x) ? x : [x].filter((v) => !!v));

const makeSelect = (fieldValues = [{
  key: '',
  label: '---',
}], path, value = '', editable = true) => {
  const el = document.createElement(editable ? 'select' : 'div');
  el.setAttribute('id', path.join('.'));
  if (editable) {
    if (Array.isArray(value)) {
      el.setAttribute('multiple', 'multiple');
    }
    fieldValues.forEach(
      ({ v, label }) => {
        const key = (typeof v === 'string') ? null : Object.keys(v).sort()[0];
        const fieldValue = (typeof v === 'string') ? v : v[key];
        if (isEmpty(fieldValue)) {
          return null;
        }
        const optionEl = document.createElement('option');
        optionEl.setAttribute('value', fieldValue);
        if ((Array.isArray(value) ? value : (value ? [typeof value === 'string' ? value : value[key]] : [])).indexOf(fieldValue) !== -1) {
          optionEl.setAttribute('selected', 'selected');
        }
        if (label) {
          optionEl.setAttribute('label', [v, label].join(' - '));
        }
        optionEl.innerText = (typeof v === 'string')
          ? v
          : Object.keys(v).sort().filter(sk => sk !== key).map(sk => v[sk]);
        el.append(optionEl);
      },
    );
  } else {
    el.className = 'select-disabled';
    if (Array.isArray(value)) {
      value.forEach(
        v => {
          const optionEl = document.createElement('div');
          optionEl.innerText = v;
          el.append(optionEl);
        },
      );
    } else {
      el.append(document.createTextNode(value));
    }
  }

  return el;
};

const makeBoolean = (path, checked = false, editable = true) => {
  const el = document.createElement(editable ? 'input' : 'div');
  el.setAttribute('id', path.join('.'));
  if (editable) {
    el.setAttribute('type', 'checkbox');
    if (checked) {
      el.setAttribute('checked', 'checked');
    }
  } else {
    el.append(document.createTextNode(checked ? '✓' : '✕'));
    el.className = checked ? 'boolean-true' : 'boolean-false';
  }
  const wrapperEl = document.createElement('div');
  wrapperEl.append(el);
  return wrapperEl;
};
const normalizePath = (schemaPath) => {
  if (typeof schemaPath === 'string') {
    if (schemaPath.match('^#')) {
      return schemaPath.replace(/^#[\/]?/ug, '').split(/[\/]/ug);

    }
    return schemaPath.split('.');
  }
  return schemaPath || [];
};
const getField = (schema, schemaPath, defaultValue = null) => {
  const cleanPath = normalizePath(schemaPath);
  const startSchema = schema.$ref ? get(schema, normalizePath(schema.$ref)) : schema;
  const field = (cleanPath.length === 0) ? startSchema : cleanPath.reduce(
    (a, o) => {
      if (a && a[o] && a[o].$ref) {
        return get(schema, normalizePath(a[o].$ref), defaultValue);
      }
      return a && a[o] ? a[o] : defaultValue;
    },
    startSchema,
  );


  if (
    ['oneOf', 'anyOf'].indexOf(
      cleanPath.slice(-1)[0],
    ) !== -1
  ) {
    return {
      ...omit(getField(schema, cleanPath.slice(0, -1)), NESTED_SCHEMA_PROPERTIES),
      ...field,
    };
  }
  return field;
};

const determiniseMatchingBranch = (schema, schemaPath = [], refs = []) => {
  const field = getField(schema, schemaPath, null);
  if (field.$id && refs.filter(ref => ref === field.$id).length >= 2) {
    return null;
  }
  if (field.type === 'array') {
    return determiniseMatchingBranch(
      schema,
      [...schemaPath, 'items'],
      field.$id ? [...refs, field.$id] : refs,
    );
  } else if (field.type === 'object') {
    const requiredMatches = (field.required || []).map(
      (k) => {
        return determiniseMatchingBranch(
          schema,
          [...schemaPath, 'properties', k],
          field.$id ? [...refs, field.$id] : refs,
        );
      },
    );
    if (requiredMatches.length > 0) {
      return requiredMatches;
    }
    return Object.keys(field.properties).sort().map(
      (k) => {
        return determiniseMatchingBranch(
          schema,
          [...schemaPath, 'properties', k],
          field.$id ? [...refs, field.$id] : refs,
        );
      },
    );
  } else if (field.anyOf || field.oneOf) {
    const sf = field.anyOf ? 'anyOf' : 'oneOf';
    return field[sf].map(
      (subField, idx) => determiniseMatchingBranch(
        schema,
        [...schemaPath, sf, idx],
        field.$id ? [...refs, field.$id] : refs,
      ),
    );
  } else if ((['string', 'number', 'boolean'].indexOf(field.type) !== -1) || (field.format)) {
    return {
      field,
      schemaPath,
    };
  }
  return null;
};


const chooseBestOfMatching = fields => {
  if (!fields) {
    return fields;
  }
  return flattenDeep(forceArray(fields)).filter(v => !!v).sort(
    (a, b) => (b.schemaPath.filter(
      v => (v === 'items') || (v === 'properties'),
    ).length - a.schemaPath.filter(
      v => (v === 'items') || (v === 'properties'),
    ).length) || (b.schemaPath.length - a.schemaPath.length),
  )[0];
};

const renderValue = (
  schema,
  dirtySchemaPath = [],
  path = [],
  data = [],
  extensions = {},
  editable = true,
) => {
  let schemaPath = normalizePath(dirtySchemaPath);
  let field = getField(schema, schemaPath, null);
  let value = path.length > 0 ? get(data, path, null) : data;
  if (!field) {
    const failEl = document.createElement('span');
    failEl.append('Not found: ' + JSON.stringify(['path', path, 'dsp', dirtySchemaPath, 'sp', schemaPath]));
    return failEl;
  }
  if (isEmpty(value)) {
    return null;
  }
  let el = document.createElement('div');
  el.setAttribute('id', path.join('.'));

  if (field.$ref && (!field.$ref.match(/^#[\/]?$/uig))) {
    field = getField(schema, field.$ref, { type: 'string' });
  }
  if (field.oneOf || field.anyOf) {
    const fof = field.anyOf ? 'anyOf' : 'oneOf';
    const matching = determiniseMatchingBranch(schema, schemaPath, []);
    // const matching = flattenDeep(
    //   determiniseMatchingBranch(field, [], path, []),
    // ).filter(v => !!v);

    // const best = chooseBestOfMatching(matching);
    // field = get(field, best.fieldPath.slice(0, 2));
    // if (typeof value === 'string') {
    //   set(data, path, null);
    //   set(data, best.path, value);
    // }

    if (matching && !isObject(value)) {
      const better = chooseBestOfMatching(matching);
      // const better = chooseBestOfMatching(matching);
      el.append(
        renderValue(
          schema,
          better ? better.schemaPath.slice(0, schemaPath.length + 2) : [...schemaPath, fof, 0],
          path,
          // better.path,
          data,
          extensions,
          editable,
        ),
      );
    }
  } else if (field.const) {
    el.className = 'auto-former-array-row';
    const textBlock = document.createElement('span');
    textBlock.className = 'constant';
    textBlock.append(document.createTextNode(field.const || ''));
    el.append(textBlock);
  } else if (field.enum) {
    el.append(makeSelect(zip(field.enum, field.enumDescription).map(([v, label]) => ({
      v,
      label,
    })), path, field.default || value, extensions, editable));
  } else if (field.type === 'boolean') {
    el.append(makeBoolean(path, value, extensions, editable));
  } else if (field.items && Array.isArray(field.items)) {
    // Tuple

    // el = document.createElement('div');
    const arrayEl = document.createElement('div');
    arrayEl.setAttribute('id', path.join('.'));
    arrayEl.className = 'auto-former-fields-array';
    field.items.forEach(
      (subfieldSchema, idx) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'auto-former-array-row';
        rowEl.appendChild(
          renderValue(
            schema,
            [...schemaPath, 'items', idx],
            Array.isArray(path) ? [...path, idx] : path,
            data,
            extensions,
            editable,
          ),
        );
      },
    );
    el.append(arrayEl);
  } else if (field.items) {
    const arrayEl = document.createElement('div');
    arrayEl.setAttribute('id', path.join('.'));
    arrayEl.className = 'auto-former-fields-array';
    // Array
    // let sortableObj = null;
    // const makeSortable = (targetEl) => {
    //   targetEl.className = extendClass(targetEl.className, 'sortable');
    //   return new Sortable(
    //     targetEl,
    //     SORTABLE_CONFIG,
    //   );
    // };
    // const makeNonSortable = (targetEl, sortableObj) => {
    //   arrayEl.className = removeClass(arrayEl.className, 'sortable');
    // };
    // const updateSortable = () => {
    //   if (arrayEl.children.length > 1) {
    //     sortableObj = makeSortable(arrayEl);
    //   } else {
    //     makeNonSortable(arrayEl, sortableObj);
    //   }
    // };

    const getChild = (idx, data, childEditable) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'auto-former-array-row';

      const handleEl = document.createElement('div');
      handleEl.className = 'sortable-handle';
      rowEl.append(handleEl);
      rowEl.appendChild(renderValue(
        schema,
        [...schemaPath, 'items'],
        Array.isArray(value) ? [...path, idx] : path,
        data,
        extensions,
        childEditable,
      ));

      const removeButtonEl = document.createElement('button');
      removeButtonEl.setAttribute('type', 'button');
      // https://en.wikipedia.org/wiki/X_mark
      removeButtonEl.innerText = '🗙';
      removeButtonEl.className = 'button-remove';
      const l = (e) => {
        if (e.which === 1) {
          e.stopPropagation();
          removeButtonEl.removeEventListener('mouseup', l);
          removeButtonEl.parentNode.parentNode.removeChild(removeButtonEl.parentNode);
          // updateSortable();
        }
      };
      removeButtonEl.addEventListener('mouseup', l);
      rowEl.appendChild(removeButtonEl);
      return rowEl;
    };
    const addButtonEl = document.createElement('button');
    addButtonEl.setAttribute('type', 'button');
    addButtonEl.className = 'button-add';
    addButtonEl.innerText = '✚';


    const l = (e) => {
      if (e.which === 1) {
        arrayEl.appendChild(getChild(arrayEl.children.length, null, true));
      }
    };
    addButtonEl.addEventListener('mouseup', l);
    el.appendChild(addButtonEl);

    const records = forceArray(get(data, path, [])).filter(v => !!v);
    records.filter(v => !!v).forEach(
      (rec, idx) => arrayEl.appendChild(getChild(idx, data, true)),
    );
    el.append(arrayEl);
    // forceArray(field.contains).forEach(
    //   (containsRec) => {
    //     if (containsRec.const) {
    //       const rowEl = document.createElement('div');
    //       rowEl.className = 'auto-former-array-row';
    //       arrayEl.appendChild(rowEl);
    //
    //       const handleEl = document.createElement('div');
    //       handleEl.className = 'sortable-handle';
    //       rowEl.append(handleEl);
    //
    //       const textBlock = document.createElement('span');
    //       textBlock.className = 'constant';
    //       textBlock.append(document.createTextNode(containsRec.const || ''));
    //       rowEl.append(textBlock);
    //     }
    //   },
    // );
    // updateSortable();
  } else if (field.properties) {
    // const unassignedDataKeys = difference(isObject(value) ? Object.keys(value) : [], schemaKeys);
    // el = document.createElement('div');
    el.className = 'auto-former-field-row-content';
    const schemaKeys = Object.keys(field.properties || {});
    schemaKeys.sort(
      (a, b) => {
        if (field.required) {
          let comp1 = 0;
          let comp2 = 0;
          if (field.required) {
            comp1 = (field.required.indexOf(b) - field.required.indexOf(a));
          }
          if (isObject(value)) {
            comp2 = (value[b] ? 1 : 0) - (value[a] ? 1 : 0);
          }
          // noinspection PointlessArithmeticExpressionJS
          return comp1 * 2 + comp2 * 1;
        }
      },
    ).forEach(
      k => {
        const childEl = document.createElement('div');
        childEl.className = 'auto-former-field-row';
        // Label
        const labelEl = document.createElement('label');

        labelEl.className = 'field-title';
        if (field.properties && field.properties[k] && field.properties[k].title) {
          labelEl.appendChild(document.createTextNode([k, field.properties[k].title].join(' - ')));
        } else {
          labelEl.appendChild(document.createTextNode(k));
        }
        // description
        const descriptionEl = document.createElement('span');

        descriptionEl.appendChild(
          document.createTextNode(
            get(field, ['properties', k, 'description'], ''),
          ),
        );
        descriptionEl.className = 'field-description';
        labelEl.appendChild(descriptionEl);
        childEl.appendChild(labelEl);

        const fieldEl = renderValue(
          schema,
          [...schemaPath, 'properties', k],
          isObject(value) ? [...path, k] : path,
          data,
          extensions,
          editable,
        );
        if (fieldEl) {
          fieldEl.className = extendClass(fieldEl.className, 'auto-former-field-row-content');
          childEl.appendChild(fieldEl);
          el.appendChild(childEl);
        }

      },
    );
    // if (!editable) {
    //   const l = (e) => {
    //     if (e.which === 1) {
    //
    //       e.stopPropagation();
    //       e.target.removeEventListener('mouseup', l);
    //       const newChild = renderValue(
    //         schema,
    //         schemaPath,
    //         path,
    //         data,
    //         extensions,
    //         true);
    //       el.parentNode.replaceChild(newChild, el);
    //       setTimeout(() => {
    //         newChild.focus();
    //       }, 100);
    //     }
    //   };
    //   el.addEventListener('mouseup', l);
    // }
    const extPath = path.map(
      v => `${parseInt(v, 10)}` === `${v}` ? '*' : v,
    ).join('.');
    if (extensions[extPath] && !(field.oneOf || field.anyOf)) {
      extensions[extPath](el, value, path);
    }
  }
  if ((typeof value === 'string') || (typeof value === 'number')) {
    const matching = determiniseMatchingBranch(schema, schemaPath, [], path, []);
    if (matching) {
      const better = chooseBestOfMatching(matching);
      if (better && (better.schemaPath.length > schemaPath.length)) {
        el.append(renderValue(
          schema,
          better.schemaPath,
          path,
          data,
          extensions,
          editable,
        ));
      }
    } else {
      el.className = 'input';
      // if (
      //   ((['string', 'number'].indexOf(typeof value) !== -1))
      //   || (['string', 'number'].indexOf(typeof field.type) !== -1)
      //   || isEmpty(value)
      //   || field.format
      //   || field.anyOf
      //   || field.oneOf
      // ) {
      //   const matching = flattenDeep(determiniseMatchingBranch(schema, schemaPath, schemaPath, [], path, [])).filter(v => !!v);
      //   const best = chooseBestOfMatching(matching);
      //   if (best) {
      //     return renderValue(
      //       schema,
      //       best.schemaPath,
      //       path,
      //       data,
      //       extensions,
      //       editable,
      //     );
      //   }
      // }
      // const valueStr = (typeof value === 'string') || isEmpty(value) ? value || '' : JSON.stringify(value);
      // if (editable) {
      //   const inputEl = document.createElement('input');
      //   inputEl.setAttribute('name', path.join('.'));
      //   inputEl.setAttribute('type', 'text');
      //   inputEl.setAttribute('value', valueStr);
      //   inputEl.value = valueStr;
      //   el.append(inputEl);
      // } else {
      //   if (isEmpty(value)) {
      //     el.append(document.createTextNode('N/A'));
      //   } else {
      //     const textValueBlock = document.createElement('span');
      //     textValueBlock.className = 'constant';
      //     textValueBlock.append(document.createTextNode(valueStr));
      //     el.append(textValueBlock);
      //   }
      // }
    }
  }
  if (!isEmpty(value)) {
    if ((!field.enum) && (!isObject(value))) {
      const debugEl = document.createElement('input');
      debugEl.className = 'form-value';
      debugEl.setAttribute('value', value);
      el.append(debugEl);
    }
  }
  return el;
};

export const AutoFormer = (rootData, schema, extensions, editable = false, i18n = DEFAULT_I18N) => {
  const formEl = document.createElement('form');
  formEl.className = 'auto-former';
  formEl.appendChild(renderValue(
    schema,
    [],
    [],
    rootData,
    extensions,
    [],
    false,
  ));

  if (editable) {
    const submitButtonEl = document.createElement('button');
    submitButtonEl.setAttribute('type', 'submit');
    submitButtonEl.innerText = i18n.SAVE_BUTTON_TITLE;
    formEl.appendChild(submitButtonEl);
  }

  return formEl;
};

export const initAutoFormer = async (domEl) => {
  const manifest = await (await fetch('/static/examples/example_0001_marc21_input.json')).json();//, 'utf-8'));

  const dirtySchemas = {};
  const overrides = {};
  await Promise.all(
    PUB_SCHEMAS_PATHS.map(
      async p => {
        dirtySchemas[p] = await (await fetch(`/schemas/marc21/${p}`)).json();
      },
    ),
  );
  // await Promise.all(
  //   PUB_OVERRIDES_PATHS.map(
  //     async p => {
  //       overrides[p] = await (await fetch(`/schemas/pub-manifest/overrides/${p}`)).json();
  //     },
  //   ),
  // );
  // const overrides = OVERRIDES.map(
  //   p => JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'schemas', 'pub-manifest', 'overrides', p), 'utf-8')),
  // );
  const schemas = Object.keys(dirtySchemas).reduce(
    (a, k) => ({
      ...a,
      [k]: Object.assign(
        {},
        dirtySchemas[k],
        overrides[k],
      ),
    }),
    {},
  );
  let myPromiseResolver = {
    // Return the value in an ES6 Promise
    async read(file) {
      const data = schemas[file.url.split('/').slice(-1)[0]];
      if (data) {
        return data;
      } else {
        // Error !
        throw new Error('No data!');
      }
    },
  };
  const schema = await $RefParser.dereference(
    schemas[PUB_ROOT_SCHEMA],
    {
      resolve: {
        file: myPromiseResolver,
        http: myPromiseResolver,
      },
      dereference: {
        circular: true,
      },
    },
  );
  domEl.append(AutoFormer(manifest, schema, {}));
};
