/*! CCTray Dashboard
 *
 * web-cctray.js
 *
 * @category   Dashboards
 * @author     Nicola Asuni <nicola.asuni@tecnick.com>
 * @copyright  2013-2017 Nicola Asuni - Tecnick.com LTD
 * @license    MIT (see LICENSE)
 * @link       https://github.com/tecnickcom/web-cctray
 */

(function() {

	// get selected dashboard looking at the "d" URL query value
	var urlquery = getUrlQueryParams();
	var mode = urlquery['d'] === undefined ? 'rotate' : urlquery['d'];

	function decodeComp(s) {
		return decodeURIComponent(s.replace(/\+/g, ' '));
	};

	function getUrlQueryParams() {
		var map  = {};
		var query = location.search.substring(1);
		var kv = query.split('&');
		for(var i in kv) {
			var key = kv[i].split('=');
			if (key.length > 1) {
				map[decodeComp(key[0])] = decodeComp(key[1]);
			}
		}
		return map;
	}

	function loadRemoteURL(url, access, mime, callback){
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if(xhr.readyState === 4 && xhr.status === 200){
				callback(xhr.responseText);
			}
		}
		xhr.overrideMimeType(mime);
		xhr.open('GET', url, true);
		xhr.withCredentials = true;
		if (access) {
			xhr.setRequestHeaders('Authorization', 'Basic '+btoa(access));
		}
		xhr.send();
	}

	function parseCctray(xml) {
		var obj = {};
		parser = new DOMParser();
		xmlDoc = parser.parseFromString(xml, 'text/xml');
		var xtag = xmlDoc.getElementsByTagName('Project');
		for (var i = 0; i < xtag.length; i++) {
			elem = xtag[i].attributes;
			var attr = {};
			for (var j = 0; j < elem.length; j++) {
				var attribute = elem.item(j);
				attr[attribute.nodeName] = attribute.nodeValue;
			}
			obj[attr['name']] = attr;
		}
		return obj;
	}

	function loadDashboard(config, dlist, idx, max, delay) {
		dashboard = config.dashboard[dlist[idx]];
		loadRemoteURL(dashboard.url, dashboard.access, 'application/xml', function(ctx) {
			xitem = parseCctray(ctx);
			
			var mainDiv = document.createElement('div');
			mainDiv.id = 'main';
			mainDiv.className = 'main';
			
			var numRows = dashboard.grid.length;
			for (var r = 0; r < numRows; r++) {
				
				var rowDiv = document.createElement('div');
				rowDiv.id = 'row_' + r;
				rowDiv.className = 'row';
				rowDiv.style.height = ''+(100 / numRows)+'%';
				
				row = dashboard.grid[r];
				var numCols = row.length;
				for (var c = 0; c < numCols; c++) {
					var name = row[c];

					var colDiv = document.createElement('div');
					colDiv.style.width = ''+(100 / numCols)+'%';
					colDiv.id = 'col_' + xitem[name].activity;
					colDiv.className = 'status_'+xitem[name].lastBuildStatus;
					colDiv.innerHTML = '<span id="info"><a href="'+xitem[name].webUrl+'" class="pipelineName">'+name+'</a><br/><span class="lastBuildLabel">'+xitem[name].lastBuildLabel+'</span> - <span class="lastBuildTime">'+xitem[name].lastBuildTime+'</span></span>';
					rowDiv.appendChild(colDiv);
				}
				
				mainDiv.appendChild(rowDiv);
			}
			
			document.body.removeChild(document.body.childNodes[0]);
			document.body.appendChild(mainDiv);
		});
		// load next dashboard
		idx++;
		if (idx > max) {
			idx = 0;
		}
		setTimeout(loadDashboard, delay, config, dlist, idx, max, delay);
	}

	loadRemoteURL('config/config.json', '', 'application/json', function(cfg) {
		var config = JSON.parse(cfg);
		var numDashboards = config.dashboard.length;
		// select dashboards to display
		var dlist = [];
		for (var i = 0; i < numDashboards; i++) {
			if ((mode == 'rotate') || (config.dashboard[i]['name'] == mode)) {
				dlist.push(i);
			}
		}
		loadDashboard(config, dlist, 0, (dlist.length - 1), (config.refresh * 1000))
	});

})();

