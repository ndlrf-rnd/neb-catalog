import * as colors from './contrib/g6/colors.es2015.js';
import capitalize from './contrib/lodash-es/capitalize.js';
import uniq from './contrib/lodash-es/uniq.js';

const roundRobinStyles = Object.keys(colors).sort().filter(
  key => (['white', 'black', 'darkText', 'lightText', 'darkIcons', 'lightIcons'].indexOf(key) === -1),
).map(
  (k) => {
    const style = {
      stroke: colors[k][900],
      fill: colors[k][100],
    };
    return (colors[k]) ? style : null;
  },
).filter(v => !!v);


G6.registerNode(
  'entity',
  {
    drawShape(cfg, group) {
      const rect = group.addShape('rect', {
        attrs: {
          x: -60,
          y: -30,
          width: 120,
          height: 60,
          ...cfg.style,
          lineWidth: 1,
          stroke: colors.grey[500],
        },
        name: 'rect-shape',
      });
      group.addShape('text', {
        attrs: {
          text: cfg.kind.split('_').map(v => capitalize(v)).join(' '),
          x: 0,
          y: -20,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 'bold',
          textBaseline: 'middle',
          fill: 'rgba(0,0,0,0.65)',
        },
        name: 'text-shape-1',
      });
      group.addShape('text', {
        attrs: {
          text: `${cfg.source}`,
          x: 0,
          y: 10,
          textAlign: 'center',
          fontSize: 12,
          textBaseline: 'middle',
          fill: 'rgba(0,0,0,0.65)',
        },
        name: 'text-shape-2',
      });
      group.addShape('text', {
        attrs: {
          text: `${cfg.provider}`,
          x: 0,
          y: 20,
          textAlign: 'center',
          fontSize: 12,
          textBaseline: 'middle',
          fill: 'rgba(0,0,0,0.65)',
        },
        name: 'text-shape-3',
      });

      group.addShape('text', {
        attrs: {
          text: `${cfg.count}`,
          x: 0,
          y: -5,
          fill: colors.grey[800],
          fontSize: 14,
          textBaseline: 'middle',
          textAlign: 'center',
        },
        name: 'text-shape-count',
      });
      return rect;
    },
  },
  'single-node',
);

const makeEdge = ({ id, kind_from, kind_to, count, provider, source_from, source_to }) => {
  return {
    id,
    source_from,
    source_to,
    kind_from,
    kind_to,
    provider,
    source: [kind_from, source_from].join('/'),
    target: [kind_to, source_to].join('/'),
    type: [kind_from, source_from].join('/') === [kind_to, source_to].join('/') ? 'loop': 'line',
    label: count,
    // count,
    // weight: count,
    // type: 'line',
    style: {
      stroke: colors.grey[500],
      lineWidth: Math.max(1, Math.log(count) ** (1 / Math.E)),
      startArrow: false,
      endArrow: true,
      radius: 8,
    },

  };
};
const makeNode = ({ id, kind, style, source, provider, count }) => ({
  id,
  kind,
  provider,
  source,

  cluster: kind,
  count,
  type: 'entity',
  weight: count,
  size: Math.max(16, Math.log10(count)),
  style,
  linkPoints: {
    top: true,
    bottom: true,
    left: true,
    right: true,
  },
});

const drawGraph = ({ metadata, items }, container) => {
  const kinds = uniq(items.reduce(
    (a, { kind, kind_from, kind_to }) => ([...a, ...[kind, kind_from, kind_to].filter(v => !!v)]),
    [],
  ));
  const kindToStyle = kinds.reduce(
    (a, kind) => ({
        ...a,
        [kind.toLocaleLowerCase()]: roundRobinStyles[Object.keys(a).length % roundRobinStyles.length],
      }
    ),
    {},
  );

  const edges = items.filter((item) => item && item.kind_from && item.kind_to).map(v => makeEdge(v)).filter(v => !!v);
  const width = document.getElementById('container').scrollWidth;
  const height = document.getElementById('container').scrollHeight || 500;

  const nodes = [
    ...items.filter((item) => item && item.kind).map((n) => ({
      ...n,
      id: [n.kind, n.source].join('/'),
    })),
    ...edges.reduce(
      (a, { source_from, kind_from, provider, source_to, kind_to, source, target, count }) => ([
        ...a,
        {
          source: source_from,
          kind: kind_from,
          provider,
          id: source,
        },
        {
          source: source_to,
          kind: kind_to,
          provider,
          id: target,
        },
      ]),
      [],
    ),
  ].map(
    n => makeNode({
      ...n,
      style: kindToStyle[n.kind.toLocaleLowerCase()],
    }),
  ).filter(v => !!v);

  const data = {
    nodes,
    edges,
  };
  const graph = new G6.Graph({
      container,
      width,
      height,
      renderer: 'svg',
      fitCenter: true,
      fitView: true,
      linkCenter: false,
      modes: {
        default: ['zoom-canvas', 'drag-canvas', 'drag-node'],
      },
      fitViewPadding: 10,
      layout: {
        type: 'fruchterman',
        preventOverlap: true,
        gravity: 1,
        speed: 25,
        cluster: 'kind',
      },
      animate: true,
      defaultCombo: {
        type: 'rect',
      },
      defaultEdge: {
        background: {
          fill: '#FFFFFF',
          stroke: '#000000',
        },
        labelCfg: {
          // autoRotate: true,
          style: {
            background: {
              fill: colors.white,
              padding: [2, 2, 2, 2],
              lineWidth: 0,
              fontSize: 14,
            },
          },
        },
        type: 'line',
        style: {
          stroke: '#F6BD16',
          fill: '#F6BD16',
          endArrow: true,
        },
        loopCfg: {
          position: 'top',
          dist: 64,
        },
      },
    },
  );
  graph.data(data);
  graph.render();

  graph.on('node:mouseenter', (evt) => {
    graph.setItemState(evt.item, 'hover', true);
  });

  graph.on('node:mouseleave', (evt) => {
    graph.setItemState(evt.item, 'hover', false);
  });
};

fetch('/stats.json?statCountThreshold=5').then(res => res.json()).then(
  data => {
    const container = document.getElementById('container');

    const body = document.querySelector('body');
    body.style.width = '100%';
    body.style.height = '100%';
    body.style.padding = 0;
    body.style.margin = 0;
    body.style.overflow = 'hidden';
    body.parentElement.style.width = '100%';
    body.parentElement.style.height = '100%';
    body.parentElement.style.overflow = 'hidden';
    container.style['user-select'] = 'none';
    container.style.width = '100%';
    container.style.height = '100%';
    drawGraph(data, 'container');
  },
);
