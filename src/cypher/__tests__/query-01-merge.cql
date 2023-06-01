MERGE (
  c:Collection {source: 'test.rusneb.ru', record: 'Coll'}
)<-[w2c:part_of]-(
  w:Work {source: 'RuSpRNB', record: 'test Work'}
)-[i2w:instance_of]->(
  inst:Instance {source: 'RuSpRNB', record: 'test Instance'}
)-[i2i:item_of]-(
  itm:Item {source: 'RuSpRNB', record: 'test Item'}
);
