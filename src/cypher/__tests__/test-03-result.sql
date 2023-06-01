SELECT
'instance' as kind_from, _0_0___r__instance__item.source_from, _0_0___r__instance__item.key_from,
'item' as kind_to, _0_0___r__instance__item.source_to, _0_0___r__instance__item.key_to
FROM _a__instance AS _0_0___a__instance
INNER JOIN _r__instance__item AS _0_0___r__instance__item ON _0_0___a__instance.key = _0_0___r__instance__item.key_from AND _0_0___a__instance.source = _0_0___r__instance__item.source_from
INNER JOIN _a__item AS _0_2___a__item ON _0_0___r__instance__item.key_to = _0_2___a__item.key AND _0_0___r__instance__item.source_to = _0_2___a__item.source
WHERE _0_0___a__instance.source='RuMoRGB' AND _0_0___a__instance.key='009930133'
AND
_0_2___a__item.source='RuMoRGB' AND _0_2___a__item.key='009930133'
UNION
SELECT
'item' as kind_from, _1_2___r__item__url.source_from, _1_2___r__item__url.key_from,
'url' as kind_to, _1_2___r__item__url.source_to, _1_2___r__item__url.key_to
FROM _a__instance AS _1_0___a__instance
INNER JOIN _r__instance__item AS _1_0___r__instance__item ON _1_0___a__instance.key = _1_0___r__instance__item.key_from AND _1_0___a__instance.source = _1_0___r__instance__item.source_from
INNER JOIN _a__item AS _1_2___a__item ON _1_0___r__instance__item.key_to = _1_2___a__item.key AND _1_0___r__instance__item.source_to = _1_2___a__item.source
INNER JOIN _r__item__url AS _1_2___r__item__url ON _1_2___a__item.key = _1_2___r__item__url.key_from AND _1_2___a__item.source = _1_2___r__item__url.source_from
INNER JOIN _a__url AS _1_4___a__url ON _1_2___r__item__url.key_to = _1_4___a__url.key AND _1_2___r__item__url.source_to = _1_4___a__url.source
WHERE _1_0___a__instance.source='RuMoRGB' AND _1_0___a__instance.key='009930133'
AND
_1_2___a__item.source='RuMoRGB' AND _1_2___a__item.key='009930133'
AND
_1_4___a__url.source='RuMoRGB' AND _1_4___a__url.key='rsl01009930133.pdf'
UNION
SELECT
'url' as kind_from, _2_4___r__url__instance.source_from, _2_4___r__url__instance.key_from,
'instance' as kind_to, _2_4___r__url__instance.source_to, _2_4___r__url__instance.key_to
FROM _a__instance AS _2_0___a__instance
INNER JOIN _r__instance__item AS _2_0___r__instance__item ON _2_0___a__instance.key = _2_0___r__instance__item.key_from AND _2_0___a__instance.source = _2_0___r__instance__item.source_from
INNER JOIN _a__item AS _2_2___a__item ON _2_0___r__instance__item.key_to = _2_2___a__item.key AND _2_0___r__instance__item.source_to = _2_2___a__item.source
INNER JOIN _r__item__url AS _2_2___r__item__url ON _2_2___a__item.key = _2_2___r__item__url.key_from AND _2_2___a__item.source = _2_2___r__item__url.source_from
INNER JOIN _a__url AS _2_4___a__url ON _2_2___r__item__url.key_to = _2_4___a__url.key AND _2_2___r__item__url.source_to = _2_4___a__url.source
INNER JOIN _r__url__instance AS _2_4___r__url__instance ON _2_4___a__url.key = _2_4___r__url__instance.key_from AND _2_4___a__url.source = _2_4___r__url__instance.source_from
INNER JOIN _a__instance AS _2_6___a__instance ON _2_4___r__url__instance.key_to = _2_6___a__instance.key AND _2_4___r__url__instance.source_to = _2_6___a__instance.source
WHERE _2_0___a__instance.source='RuMoRGB' AND _2_0___a__instance.key='009930133'
AND
_2_2___a__item.source='RuMoRGB' AND _2_2___a__item.key='009930133'
AND
_2_4___a__url.source='RuMoRGB' AND _2_4___a__url.key='rsl01009930133.pdf'
AND
_2_6___a__instance.source='RuMoRGB' AND _2_6___a__instance.key='http://dlib.rsl.ru/rsl01009000000/rsl01009930000/rsl01009930133/rsl01009930133.pdf';
