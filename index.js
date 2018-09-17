'use strict';

var Kakasi = require('../kakasi.js/kakasi');
const fs = require('fs');
const csvSync = require('csv-parse/lib/sync'); // requiring sync module
var Es6PromisePool = require('es6-promise-pool');
const moji = require('moji');

/**
 * Promise Pool
 *
 * Extends the es6-promise-pool class to enable it to function much
 * like Promise.all() functions by returning the array of results.
 */
class PromisePool extends Es6PromisePool {
	/**
	 * Constructor
	 *
	 * @param {Function} source - function to generate data
	 * @param {Number} concurrency - amount of concurrency
	 * @param {Object} options - key value pairs of options
	 */
	constructor(source, concurrency, options) {
	  super(source, concurrency, options);
	  this.resolves = [];
	}
  
	/**
	 * Start
	 *
	 * @return {Promise}
	 */
	start() {
	  this.addEventListener('fulfilled', (event) => {
		this.resolves.push(event.data.result);
	  });
  
	  return super.start().then(() => {
		return Promise.resolve(this.resolves);
	  });
	}
}

const file = './data/chubu.csv';
let data = fs.readFileSync(file);

let res = csvSync(data);

var place = [];
res.forEach( function(e,index){
  if (index > 0){
		if (e[11] != null  && e[11] != '') {
			place.push([e[9], e[10], e[11], e[12]])
		}
	}
});
var count = 0;

var i = 0;
var kk = new Kakasi({
	debug: false
});
var cityMap = {};
var townMap = {};

var promiseProducer = function () {
	if (i >= place.length){
		return null;
	}

	var c = place[i][0];
	var cy = moji(place[i][1]).convert('KK', 'HG').toString();
	var t = place[i][2];
	var ty = moji(place[i][3]).convert('KK', 'HG').toString();

	i++;

	return new Promise( function (resolve, reject){
	
		judge(c, cy, t, ty).then( function (nandoku){
			if (nandoku) {
				console.log(c + t + " " + cy + ty);
				count++;
			}
			resolve();
		}).catch( function(error){
			console.log(c + t + " " + cy + ty + " " + error);
			resolve();
			count++;
		});
	});

}


var pool = new PromisePool(promiseProducer, 1);

pool.start().then(
  function(results){
	// returen values in this.resolves
	console.log("total" + count)
  }
	).catch(
	function(error){
		console.log(error);
	}
)  


async function judge(c, cy, t, ty){

	if(c in cityMap ) {
		if (cityMap[c]) {
			return true;
		}
	}
	else {
		var yomi = await kk.read(c);
		if (yomi.includes(cy)){
			cityMap[c] = false;
		} else {
			var onkun = await kk.transliterate(c);
			if (!onkun.includes(cy)){
				cityMap[c] = true;
				return true;
			}
			cityMap[c] = false;
		}
	}

	if(t in townMap ) {
		if (townMap[t]) {
			return true;
		} else {
			return false;
		}
	}
	else {
		var yomi = await kk.read(t);
		if (yomi.includes(ty)){
			townMap[t] = false;
			return false;
		}	else {
			var onkun = await kk.transliterate(t);
			if (!onkun.includes(ty)){
				townMap[t] = true;
				return true;
			}	
			townMap[t] = false;
			return false;
		}
	}
}

