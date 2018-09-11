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


var kk = new Kakasi({
    debug: true
});

const file = './data/chubu.csv';
let data = fs.readFileSync(file);

let res = csvSync(data);

var place = [];
res.forEach( function(e,index){
  if (index > 0){
		if (e[11] != null  && e[11] != '') {
			place.push([e[9] + e[11], e[10] + e[12]])
		}
	}
});
var nandoku = [];

var i = 0;
var kk = new Kakasi({
	debug: false
});

var promiseProducer = function () {
	if (i >= place.length){
		return null;
	}
	var kanji = place[i][0];
	var yomi = moji(place[i][1]).convert('KK', 'HG').toString();
	i++;
	return kk.transliterate(kanji)
		.then(results => {
			if (!results.includes(yomi)){
				console.log(kanji);
				console.log(results);
				nandoku.push(kanji);
			}
		})
		.catch(error => {
			reject(error);
	});
}

var pool = new PromisePool(promiseProducer, 20);

pool.start().then(
  function(results){
	// returen values in this.resolves
	console.log(nandoku.length)
  }
	).catch(
	function(error){
		console.log(error);
	}
)  



