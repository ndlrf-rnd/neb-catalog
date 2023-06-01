const cluster = require('cluster');
const jsyaml = require('js-yaml');
const { globals } = require('../../jest.config');

Object.keys(globals).forEach(k => {
  process.env[k] = globals[k];
});

const fs = require('fs');
const path = require('path');
const { debug, info, wait, warn } = require('../utils');

// const BOOTSTRAP_DB = `
// INSERT INTO public.providers (code, time_sys, metadata) VALUES ('TestProvider', '["2020-07-09 02:59:37.192118",)', '{}');
// INSERT INTO public.sources (code, time_sys, metadata) VALUES ('TestSource', '["2020-07-09 02:59:42.355504",)', '{}');
//
// INSERT INTO public._a__instance (source, key) VALUES ('TestSource', '000000002');
// INSERT INTO public._a__instance (source, key) VALUES ('TestSource', '000000003');
// INSERT INTO public._a__instance (source, key) VALUES ('TestSource', '000000004');
// INSERT INTO public._a__instance (source, key) VALUES ('TestSource', '000000005');
// INSERT INTO public._a__instance (source, key) VALUES ('TestSource', '000000006');
// INSERT INTO public._a__instance (source, key) VALUES ('TestSource', '000000007');
// INSERT INTO public._a__instance (source, key) VALUES ('TestSource', '000000008');
// INSERT INTO public._a__instance (source, key) VALUES ('TestSource', '000000009');
// INSERT INTO public._a__instance (source, key) VALUES ('TestSource', '000000010');
// INSERT INTO public._a__instance (source, key) VALUES ('TestSource', '000000011');
//
// INSERT INTO public._d__instance (source, key, provider, time_source, record, record_hash) VALUES ('TestSource', '000000002', 'TestProvider', '["1991-10-09 00:00:00",)', '01353nam a2200301 i 4500001001000000003000800010005001700018008004100035017002300076035002500099040002600124041000800150072001900158084002700177084002900204084002900233100007600262245035200338260002500690300001100715650009200726787003800818852003400856852003400890856010400924979001201028979001101040000000002TestSource20150716164715.0911009s1990    ru ||||  a    |00 u rus d  a91-8563АbRuMoRKP  a(TestSource)DIS-0000114  aTestSourcebruscTestSource0 arus 7a07.00.032nsnr  aЭ38-36-021.4,02rubbk  aТ3(6Ег)63-4,022rubbk  aТ3(5Ср)63-4,022rubbk1 aАбдувахитов, Абдужабар Абдусаттарович00a"Братья-мусульмане" на общественно-политической арене Египта и Сирии в 1928-1963 гг. :bавтореферат дис. ... кандидата исторических наук : 07.00.03cАбдувахитов Абдужабар Абдусаттарович ; Ташк. гос. ун-т  aТашкентc1990  a17 с. 7aВсеобщая история (соответствующего периода)2nsnr18w008120708iДиссертация4 aРГБbFBj9 91-4/2388-xx714 aРГБbFBj9 91-4/2389-8x7041qapplication/pdfuhttp://dlib.rsl.ru/rsl01000000000/rsl01000000000/rsl01000000002/rsl01000000002.pdf  aautoref  adlopen', '057dab97-81cd-f779-9c34-17b3f1d68c83');
// INSERT INTO public._d__instance (source, key, provider, time_source, record, record_hash) VALUES ('TestSource', '000000003', 'TestProvider', '["1998-04-07 00:00:00",)', '01197nam a2200241 i 4500001001000000003000800010005001700018008004100035017002100076035002500097040002600122041000800148072001900156084002200175100004700197245040500244260002500649300001100674650018600685787003800871852003400909979001200943000000003TestSource20160404162233.0980407s1991    ru ||||  a    |00 u rus d  a4787-94bTestSource  a(TestSource)DIS-0000406  aTestSourcebruscTestSource0 arus 7a05.13.092nsnr  aР343.38,02rubbk1 aАбдукаримов, Абдуманоп00aАдаптивные алгоритмы вычисления оценок в задачах распознавания образов :bНа примере медицинской диагностики : автореферат дис. ... кандидата технических наук : 05.13.09cУзбекское научно-производ. объединение "КИБЕРНЕТИКА"  aТашкентc1991  a20 с. 7aУправление в биологических и медицинских системах (включая применение вычислительной техники)2nsnr18w007960763iДиссертация4 aРГБbFBj9 91-9/1198-1x70  aautoref', '6e1cb381-e50d-779c-62bb-82a3eb798be8');
// INSERT INTO public._d__instance (source, key, provider, time_source, record, record_hash) VALUES ('TestSource', '000000004', 'TestProvider', '["1998-03-22 00:00:00",)', '01251nam a2200253 i 4500001001000000003000800010005001700018008004100035017002300076035002500099040004000124041000800164072001900172084002700191100007800218245035700296260002300680800001100676650019200687787003800879852003400917852003400951979001200985000000004TestSource20170418134124.0980322s1997    ru ||||  a    |00 u rus d  a97-9909АbRuMoRKP  a(TestSource)DIS-0000982  aTestSourcebruscTestSourcedTestSourceercr0 arus 7a12.00.022nsnr  aХ621.163.012,02rubbk1 aАбдурахманов, Александр Амангельдыевич00aАдминистративный договор и его использование в деятельности органов внутренних дел :bавтореферат дис. ... кандидата юридических наук : 12.00.02cА. А. Абдурахманов ; Московский юридический институт  aМоскваc1997  a23 с. 7aКонституционное право - Государственное управление - Административное право - Муниципальное право2nsnr18w000177977iДиссертация4 aРГБbFBj9 97-5/2105-5x704 aРГБbFBj9 97-5/2106-3x70  aautoref', '58d6480b-b4ca-3cdd-9988-313661b2471a');
// INSERT INTO public._d__instance (source, key, provider, time_source, record, record_hash) VALUES ('TestSource', '000000005', 'TestProvider', '["1991-07-24 00:00:00",)', '01130nam a2200277 i 4500001001000000003000800010005001700018008004100035017002300076035002500099040002600124041000800150072001900158084002200177100005400199245028000253260002900533300001100562650004600573787003800619852003400657852003400691856010400725979001200829979001100841000000005TestSource20170201165925.0910724s1991    ru ||||  a    |00 u rus d  a91-4733АbRuMoRKP  a(TestSource)DIS-0000215  aTestSourcebruscTestSource0 arus 7a02.00.032nsnr  aГ276.22,02rubbk1 aАбрамов, Михаил Аркадьевич00a1-диалкиламиноэтенселенолаты и их аналоги в реакциях с нитрилиминами :bавтореферат дис. ... кандидата химических наук : 02.00.03cЛенинградский технол. ин-т  aЛенинградc1991  a20 с. 7aОрганическая химия2nsnr18w008078023iДиссертация4 aРГБbFBj9 91-2/4111-0x704 aРГБbFBj9 91-2/4112-9x7041qapplication/pdfuhttp://dlib.rsl.ru/rsl01000000000/rsl01000000000/rsl01000000005/rsl01000000005.pdf  aautoref  adlopen', '6c7ecf9f-4d92-ae25-6975-1452b658b587');
// INSERT INTO public._d__instance (source, key, provider, time_source, record, record_hash) VALUES ('TestSource', '000000006', 'TestProvider', '["1996-10-14 00:00:00",)', '01072nam a2200253 i 4500001001000000003000800010005001700018008004100035017002200076035002500098040002600123041000800149072001900157084003500176100005600211245034200267260004000609300001100649650004200660787003800702852003300740852003300773979001200806000000006TestSource20190704132949.0961014s1995    ru ||||  a    |00 u rus d  a96-363АbRuMoRKP  a(TestSource)DIS-0000725  aTestSourcebruscTestSource0 arus 7a10.02.042nsnr  aШ5(0)943.21-332.0в6,02rubbk1 aАбрамов, Сергей Рудольфович00aАнглоязычные версии нового завета как предмет филологической герменевтики :bавтореферат дис. ... кандидата филологических наук : 10.02.04cС. Р. Абрамов ; Российский пед. ун-т им. А. И. Герцена  aСанкт-Петербургc1995  a23 с. 7aГерманские языки2nsnr18w000152649iДиссертация4 aРГБbFBj9 96-1/699-3x704 aРГБbFBj9 96-1/700-0x70  aautoref', '4b1e7ba8-11f5-4485-9463-a6bcbc61b1fd');
// INSERT INTO public._d__instance (source, key, provider, time_source, record, record_hash) VALUES ('TestSource', '000000007', 'TestProvider', '["1990-12-28 00:00:00",)', '01013nam a2200253 i 4500001001000000003000800010005001700018008004100035017002400076035002500100040002600125041000800151072001900159084002100178100004800199245033700247260001900584300001100603650002700614787003800641852003400679852003400713979001200747000000007TestSource20161108132820.0901228s1990    ru ||||  a    |00 u rus d  a90-18630АbRuMoRKP  a(TestSource)DIS-0000604  aTestSourcebruscTestSource0 arus 7a03.00.042nsnr  aЕ643.1,02rubbk1 aАбрамова, Ирина Юрьевна00aАнализ белков теплового шока у некоторых видов животных аридной зоны :bавтореферат дис. ... кандидата биологических наук : 03.00.04cИ. Ю. Абрамова ; АН УССР. Ин-т биохимии им. А. В. Палладина  aКиевc1990  a18 с. 7aБиохимия2nsnr18w008073635iДиссертация4 aРГБbFBj9 90-8/2084-3x704 aРГБbFBj9 90-8/2085-1x70  aautoref', 'd8598956-b383-7823-a455-005aef4b9b4d');
// INSERT INTO public._d__instance (source, key, provider, time_source, record, record_hash) VALUES ('TestSource', '000000008', 'TestProvider', '["1991-07-17 00:00:00",)', '01188nam a2200253 i 4500001001000000003000800010005001700018008004100035017002300076035002500099040002700124041000800151072001900159084002900178100003100207245047300238260002300711300001100734650002800745720008100773852003400854852003400888979001200922000000008TestSource20180614163237.0910717s1991    ru ||||  a    |00 u rus d  a91-4203АbRuMoRKP  a(TestSource)DIS-0000875  aRKPbrusercrdTestSource0 arus 7a14.00.272nsnr  aР410.230.46-50,02rubbk1 aАбу Шавиш Зейд00aАдсорбирующие гидрофильные материалы в комплексном лечении трофических язв голени венозной этиологииh[Текст] :bавтореферат дис. ... кандидата медицинских наук : [специальность] 14.00.27cАбу Шавиш Зейд ; [Место защиты : Московская мед. академия им. И. М. Сеченова]  aМоскваc1991  a16 с. 7aХирургия2rubbk2 aМосковская мед. академия им. И. М. Сеченова4 aРГБbFBj9 91-2/3167-0x704 aРГБbFBj9 91-2/3168-9x70  aautoref', '45e3350e-3765-a53c-b2a6-691f23adf228');
// INSERT INTO public._d__instance (source, key, provider, time_source, record, record_hash) VALUES ('TestSource', '000000009', 'TestProvider', '["1989-09-12 00:00:00",)', '01379nam a2200277 i 4500001001000000003000800010005001700018008004100035017002400076035002500100040002600125041000800151072001900159084002500178100007000203245049100273260003900764300001100803650009700814787003800911852003400949852003400983852004001017852003201057979001201089000000009TestSource20161129095017.0890912s1989    ru ||||  a    |00 u rus d  a89-14423АbRuMoRKP  a(TestSource)DIS-0000937  aTestSourcebruscTestSource0 arus 7a05.22.072nsnr  aО812-048.9,02rubbk1 aАвдовский, Александр Александрович00aАнализ динамического взаимодействия жестких комбинированных автосцепок вагонов метрополитена и совершенствование их конструкции :bавтореферат дис. ... кандидата технических наук : 05.22.07cА. А. Авдовский ; Днепропетровский ин-т инженеров ж.-д. трансп. им. М. И. Калинина  aДнепропетровскc1989  a20 с. 7aПодвижной состав железный дорог и тяга поездов2nsnr18w008247279iДиссертация4 aРГБbFBj9 89-6/1512-6x704 aРГБbFBj9 89-6/1513-4x704 aРГБbMKjМК МКК-8/89-Гx814 aРГБbOMF2jФ 1/1651x81  aautoref', '7e45115d-d1ca-2694-bba3-7168aa353bb8');
// INSERT INTO public._d__instance (source, key, provider, time_source, record, record_hash) VALUES ('TestSource', '000000010', 'TestProvider', '["1998-11-06 00:00:00",)', '01216nam a2200277 i 4500001001000000003000800010005001700018008004100035017002300076017002400099035002500123040002600148041000800174072001900182084002900201100006600230245041600296260002300712300001100735650004600746852003400792852003400826852003300860852003300893979001200926000000010TestSource20160929154422.0981106s1998    ru ||||  a    |00 u rus d  a98-7952АbRuMoRKP  a98-15079АbRuMoRKP  a(TestSource)DIS-0000915  aTestSourcebruscTestSource0 arus 7a14.00.052nsnr  aР733.410.030-3,02rubbk1 aАвтандилов, Александр Георгиевич00aАртериальная гипертензия у подростков мужского пола :bКлиника, диагностика и медицинское освидетельствование : автореферат дис. ... доктора медицинских наук : 14.00.05cА. Г. Автандилов ; Рос. мед. акад. последипломного образования  aМоскваc1998  a38 с. 7aВнутренние болезни2nsnr4 aРГБbFBj9 98-4/2970-4x704 aРГБbFBj9 98-4/2971-2x704 aРГБbFBj9 98-8/340-1x704 aРГБbFBj9 98-8/341-Xx70  aautoref', 'cc8488ef-5a68-1ae2-036b-5b9eab62df6a');
// INSERT INTO public._d__instance (source, key, provider, time_source, record, record_hash) VALUES ('TestSource', '000000011', 'TestProvider', '["1998-09-25 00:00:00",)', '00995nam a2200265 i 4500001001000000003000800010005001700018008004100035017002300076035002500099040002600124041000800150044000700158072001900165084002200184100005800206245023400264260002300498300001100521650007900532787003800611852003400649852003400683979001200717000000011TestSource20190204115415.0980925s1998    ru ||||  a    |00 u rus d  a98-5511АbRuMoRKP  a(TestSource)DIS-0000286  aTestSourcebruscTestSource0 arus  aru 7a02.00.062nsnr  aГ727.63,02rubbk1 aАвчук, Светлана Валентиновна00an-Комплексы хрома и полимеры на их основе :bавтореферат дис. ... кандидата химических наук : 02.00.06cРоссийский химико-технол. ун-т  aМоскваc1998  a17 с. 7aХимия высокомолекулярных соединений2nsnr18w000186456iДиссертация4 aРГБbFBj9 98-3/2397-3x704 aРГБbFBj9 98-3/2398-1x70  aautoref', '87ef2d71-fd15-4dde-e66c-f333d4bfc0b9');
// `;

// const TEARDOWN_DB = `
// DELETE FROM _d__instance WHERE source='TestSource';
// DELETE FROM _a__instance WHERE source='TestSource';
// DELETE FROM providers WHERE code='TestProvider';
// DELETE FROM sources WHERE code='TestSource';
// `;


module.exports = async () => {
  if (cluster.isMaster) {
    debug(`ENV variables:\n------------\n${jsyaml.safeDump(process.env, { sortKeys: true })}\n------------\n`);
    const { runCatalogServer } = require('../services/catalog');
    const { importStream, importUrl } = require('../operations/importStream');


    const { registerOperation } = require('../services/lro');
    const { migrate } = require('../dao/migrate');
    const { resetDb } = require('../operations/resetDb');
    const { PG_MIGRATIONS_PATH, PG_CONN_CRED } = require('../dao/constants');

    await resetDb(true);
    await migrate(
      {
        pgConnCred: PG_CONN_CRED,
        pgMigrationsPath: PG_MIGRATIONS_PATH,
      },
    );

    registerOperation('import', importUrl, true);

    // Some MARC records
    await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/heritage-rumorgb-2019-0000001-0000013.mrc')), {
        mediaType: 'application/marc',
        provider: 'rusneb.ru',
        jobs: 1,
        sync: true,
      },
    );
    // Couple of records to test diff on KP-s
    await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/test-fixture-kp-1.json')), {
        mediaType: 'application/vnd.rusneb.knpam+json',
        provider: 'rusneb.ru',
        jobs: 1,
        sync: true,
      },
    );

    // Re-upload records from upload 1
    await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/test-fixture-kp-2.json')), {
        mediaType: 'application/vnd.rusneb.knpam+json',
        provider: 'rusneb.ru',
        jobs: 1,
        sync: true,
      },
    );
    // Import other knpam test records
    await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/test-fixture-kp-3.json')), {
        mediaType: 'application/vnd.rusneb.knpam+json',
        provider: 'rusneb.ru',
        jobs: 1,
        sync: true,
      },
    );
    // Import 8369
    await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/test-fixture-kp-4.json')), {
        mediaType: 'application/vnd.rusneb.knpam+json',
        provider: 'rusneb.ru',
        jobs: 1,
        sync: true,
      },
    );
    await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/test_heritage__collection__details.tsv')), {
        mediaType: 'text/tab-separated-values',
        provider: 'rusneb.ru',
        jobs: 1,
        sync: true,
      },
    );
    await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/test_heritage_urls.tsv')), {
        mediaType: 'text/tab-separated-values',
        provider: 'rusneb.ru',
        jobs: 1,
        sync: true,
      },
    );
    await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/test_heritage__collection__to__collection.tsv')), {
        jobs: 1,
        mediaType: 'text/tab-separated-values',
        provider: 'rusneb.ru',
        sync: true,
      },
    );
    await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/test_heritage__collection__to__item.tsv')), {
        jobs: 1,
        mediaType: 'text/tab-separated-values',
        provider: 'rusneb.ru',
        sync: true,
      },
    );
    await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/test_heritage__item__to__pdf_url_with_s3_resolution.tsv')), {
        jobs: 1,
        mediaType: 'text/tab-separated-values',
        provider: 'rusneb.ru',
        sync: true,
      },
    );

    const nqRes =await importStream(
      fs.createReadStream(path.join(__dirname, 'fixtures/test-rdf-1.nq')), {
        jobs: 1,
        mediaType: 'application/n-quads',
        provider: 'rusneb.ru',
        sync: true,
      },
    );

    global.server = await runCatalogServer({});
    info('Server started');
    await wait(1000);
  }
};
