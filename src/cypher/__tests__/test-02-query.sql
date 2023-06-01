SELECT
'item' as kind_from, _0_0___r__item__url.source_from, _0_0___r__item__url.key_from,
'url' as kind_to, _0_0___r__item__url.source_to, _0_0___r__item__url.key_to
FROM _a__item AS _0_0___a__item
INNER JOIN _r__item__url AS _0_0___r__item__url ON _0_0___a__item.key = _0_0___r__item__url.key_from AND _0_0___a__item.source = _0_0___r__item__url.source_from
INNER JOIN _a__url AS _0_2___a__url ON _0_0___r__item__url.key_to = _0_2___a__url.key AND _0_0___r__item__url.source_to = _0_2___a__url.source
WHERE _0_0___a__item.source='knpam.rusneb.ru'
AND
_0_2___a__url.source='test.rusneb.ru';
