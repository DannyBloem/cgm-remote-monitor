'use strict';

const browserSettings = require('./browser-settings');

var client = {};

client.settings = browserSettings(client, window.serverSettings, $);

// console.log('settings', client.settings);
// client.settings now contains all settings

client.query = function query() {
	console.log('query');
	$.ajax('/api/v1/entries.json?count=3', {
		success: client.render
	});
}

client.render = function render(xhr) {
	console.log('got data', xhr);

	let rec;

	xhr.some(element => {
		if (element.sgv) {
			rec = element;
			return true;
		}
	});

	let last = new Date(rec.date);
	let now = new Date();

	// Convert BG to mmol/L if necessary.
	if (window.serverSettings.settings.units == 'mmol') {
		rec.sgv = Nightscout.units.mgdlToMMOL(rec.sgv);
	}

	// Insert the BG value text.
	$('#bgnow').html(rec.sgv);

	// Insert the trend arrow.
	$('#arrow').attr('src', '/images/' + rec.direction + '.svg');

	// Time before data considered stale.
	let staleMinutes = 13;
	let threshold = 1000 * 60 * staleMinutes;

	// Toggle stale if necessary.
	$('#bgnow').toggleClass('stale', (now - last > threshold));

	// Generate and insert the clock.
	let timeDivisor = (window.serverSettings.settings.timeFormat) ? window.serverSettings.settings.timeFormat : 12;
	let today = new Date(),
		h = today.getHours() % timeDivisor;
	if (timeDivisor == 12) {
		h = (h == 0) ? 12 : h; // In the case of 00:xx, change to 12:xx for 12h time
	}
	if (timeDivisor == 24) {
		h = (h < 10) ? ("0" + h) : h; // Pad the hours with a 0 in 24h time
	}
	let m = today.getMinutes();
	if (m < 10) m = "0" + m;
	$('#clock').text(h + ":" + m);

	if (clockFace == 'clock-color') {

		var bgHigh = window.serverSettings.settings.thresholds.bgHigh;
		var bgLow = window.serverSettings.settings.thresholds.bgLow;
		var bgTargetBottom = window.serverSettings.settings.thresholds.bgTargetBottom;
		var bgTargetTop = window.serverSettings.settings.thresholds.bgTargetTop;

		// Convert BG to mmol/L if necessary.
		if (window.serverSettings.settings.units == 'mmol') {
			rec.sgv = Nightscout.units.mgdlToMMOL(rec.sgv);
			bgHigh = Nightscout.units.mgdlToMMOL(bgHigh);
			bgLow = Nightscout.units.mgdlToMMOL(bgLow);
			bgTargetBottom = Nightscout.units.mgdlToMMOL(bgTargetBottom);
			bgTargetTop = Nightscout.units.mgdlToMMOL(bgTargetTop);
		}

		var bgNum = parseFloat(rec.sgv);

		// These are the particular shades of red, yellow, green, and blue.
		var red = 'rgba(213,9,21,1)';
		var yellow = 'rgba(234,168,0,1)';
		var green = 'rgba(134,207,70,1)';
		var blue = 'rgba(78,143,207,1)';

		var elapsedMins = Math.round(((now - last) / 1000) / 60);

		// Insert the BG stale time text.
		$('#staleTime').text(elapsedMins + ' minutes ago');

		// Threshold background coloring.
		if (bgNum < bgLow) {
			$('body').css('background-color', red);
		}
		if ((bgLow <= bgNum) && (bgNum < bgTargetBottom)) {
			$('body').css('background-color', blue);
		}
		if ((bgTargetBottom <= bgNum) && (bgNum < bgTargetTop)) {
			$('body').css('background-color', green);
		}
		if ((bgTargetTop <= bgNum) && (bgNum < bgHigh)) {
			$('body').css('background-color', yellow);
		}
		if (bgNum >= bgHigh) {
			$('body').css('background-color', red);
		}

		// Restyle body bg, and make the "x minutes ago" visible too.
		if (now - last > threshold) {
			$('body').css('background-color', 'grey');
			$('body').css('color', 'black');
			$('#staleTime').css('display', 'block');
		} else {
			$('#staleTime').css('display', 'none');
			$('body').css('color', 'white');
		}
	}
}

client.init = function init() {
	console.log('init');
	client.query();
	setInterval(client.query, 1 * 60 * 1000);
}

module.exports = client;