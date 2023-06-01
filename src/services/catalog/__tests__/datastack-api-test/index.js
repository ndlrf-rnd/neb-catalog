const ROOT="http://localhost:18080";
const PER_PAGE=100;
const OP = require("object-path");
const _ = require("lodash")
const request = require('request-json');
const client = request.createClient(ROOT);
const Ajv = require('ajv');
const ajv = new Ajv();
const validator = ajv.compile(require("./tests/api-schema.json"));
const fs = require("fs");
const path = require("path");
const OUTFILE = path.join(__dirname, "errors.json");

async function writeToLog(e) {
	return new Promise((resolve, reject) =>{
		if (Array.isArray(e))
			e=e.map(a=>JSON.stringify(a)).join("\n");
		else if (typeof e !="string")
			e=JSON.stringify(e);
		e+="\n";
		const d=new Date();
		fs.appendFile(OUTFILE, d.toISOString()+"\t"+e, (e)=>{
			if (e) reject(e);
			resolve()
		})
	});
}
async function catalogues() {
	return new Promise((resolve, reject) =>{
		client.get('/', function(err, res, data) {
			if (err) return reject(err);
			if (!data || !_.isObject(data)) {
				return reject(new Error("Empty data or not a Object response"));
			}
			if (!data.groups || !Array.isArray(data.groups)) {
				return reject(new Error("Empty groups or not a Array response"));
			}
			let r=[];
			let e=[];
			data.groups.forEach((g, i)=>{
				const uri=g.uri;
				const title=OP.get(g, "metadata.title")
				const id=OP.get(g, "metadata.identifier")
				const total=OP.get(g, "metadata.numberOfItems")
				if (!title) e.push("Group title not found at index "+i);
				if (!id) e.push("Group id not found at index "+i);
				if (!total) e.push("Group empty or numberOfItems==0 at index "+i);
				if (!uri || typeof uri !== "string") e.push("Group URI not found at index "+i);
				r.push({id, title, total, uri});
			});
			resolve({data:r, errors:e});
		});
	});
}
async function _doWithOnePage(uri) {
	return new Promise((resolve, reject) =>{
		console.log("Loading ", uri)
		client.get(uri, function(err, res, data) {
			if (err) return reject(err);
			if (!data || !_.isObject(data))  return reject(new Error("Empty data or not a Object response"));
			if (!data.groups || !Array.isArray(data.groups))  return reject(new Error("Empty groups or not a Array response"));

			const pgs=_.filter(data.groups, p=>Array.isArray(p.publications) );
			if (!pgs || !pgs.length) return reject(new Error("Empty publications list in groups"));
			let errors=[];
			pgs.forEach((pg, i)=>{
				pg.publications.forEach((p, i)=>{
					var valid = validator(p);
					if (!valid) errors.push({data:p, uri:uri, index:i, errors:validator.errors});
				})
			});
			console.log("Ready ", uri, " with "+errors.length+" errors")
			resolve(errors.length?errors:undefined);
		});
	});
}

async function items(catalogue) {
	let catErrors=[];
	for(let i=1; i<=Math.ceil(catalogue.total/PER_PAGE); i++) {
		const uri=catalogue.uri.match(/page=\d+/)?catalogue.uri.replace(/page=\d+/, i):catalogue.uri+"&page="+i;
		try {
			const errs=await _doWithOnePage(uri);
			if (errs) {
				catErrors=catErrors.concat(errs);
				if (catErrors.length) await writeToLog(catErrors);
			}
		} catch(e) {
			console.error(uri, e.message);
			catErrors.push({uri:uri, errors:[e.message]})
			if (catErrors.length) await writeToLog({uri:uri, errors:[e.message]});
		}
	}
	console.log(catalogue, catErrors)
	return catErrors;
}
async function dumpCats(cats) {
	let catErrors=[];
	for(let i=0; i<cats.length; i++) {
		try {
			const errs=await items(cats[i]);
			if (errs && errs.length)
				catErrors=catErrors.concat(errs)
		} catch(e) {
			catErrors.push({uri:cats[i].uri, errors:[e]})
		}
	}
	return catErrors;
}

fs.unlink(OUTFILE, ()=>{
	catalogues().then(cats=>{
		let gE=[];
		if (cats && cats.data && cats.data.length)
			console.log("Total catalogues", cats.data.length)
		else
			console.warn("Empty catalogues list:", cats)
		if (cats.errors)
			writeToLog(cats.errors);
		dumpCats(cats.data).then((errors)=>{
			errors =  errors || [];


			console.log("Finishing");
			process.exit(0)

		}).catch(e=>{
			console.error(e);
		})

	}).catch(e=>{
		console.error(e);
	})
});

// _doWithOnePage("https://catalog.rusneb.ru/collection/kp/civil-font-books-18-19?tsms=1574428749150&page=13").then(console.log).catch(console.error)
