import omit from 'lodash.omit';

const unwrapRefs = (v, schemas, depth = 0) => {
  if (v.$ref) {
    if (depth > 8) {
      return v;
    }
    return { ...omit(v, '$ref'), ...unwrapRefs(schemas[v.$ref], schemas, depth + 1) };
  }
  if (v.items) {
    return {
      ...v,
      type: 'array',
      items: unwrapRefs(v.items, schemas, depth + 1),
    };
  }
  if (v.properties) {
    return {
      ...v,
      properties: Object.keys(v.properties).sort().reduce(
        (a, k) => ({
          ...a,
          [k]: unwrapRefs(v.properties[k], schemas, depth + 1),
        }),
        {},
      ),
    };
  }
  if (v.oneOf || v.anyOf) {
    const fof = v.anyOf ? 'anyOf' : 'oneOf';
    const values = (v[fof]).map(
      (vv) => unwrapRefs(
        {
          ...omit(v, ['anyOf', 'oneOf', 'items', 'properties', 'required']),
          ...vv,
        },
        schemas,
        depth + 1,
      ),
    );
    return {
      ...omit(v, ['oneOf', 'anyOf', 'items', 'properties', 'required']),
      [fof]: values,
    };
  }
  return v;
};
