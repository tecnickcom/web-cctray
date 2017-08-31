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

	// get input query parameters
	var urlquery = getUrlQueryParams();

	// "c" can be used to specify an alternative configuration file name, excluding the ".json" extension.
	var configfile = urlquery['c'] === undefined ? 'config' : urlquery['c'];

	// "d" can be used to specify the configured dashboard to display, otherwise all the dashboards will be displayed in turn.
	var pipeline = urlquery['d'] === undefined ? 'all' : urlquery['d'];

	// "a" can be used to display only the pipelines with the selected activity status.
	// Valid values are: all, Sleeping, Building, CheckingModifications, Pending.
	var activity = urlquery['a'] === undefined ? 'all' : urlquery['a'];

	// "s" can be used to display only the pipelines with the selected build status.
	// Valid values are: all, Success, Failure, Exception, Unknown
	var status = urlquery['s'] === undefined ? 'all' : urlquery['s'];
	

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
		xhr.open('GET', url + '?_=' + new Date().getTime(), true);
		xhr.withCredentials = true;
		if (access) {
			xhr.setRequestHeader('Authorization', 'Basic '+btoa(access));
		}
		xhr.setRequestHeader('Cache-Control', 'no-cache');
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
			var numValidRows = 0;
			for (var r = 0; r < numRows; r++) {
				
				var rowDiv = document.createElement('div');
				rowDiv.id = 'row_' + r;
				rowDiv.className = 'row';

				row = dashboard.grid[r];
				var numCols = row.length;
				var numValidCols = 0;
				for (var c = 0; c < numCols; c++) {
					var name = row[c];
					if (typeof xitem[name] == 'undefined') {
						xitem[name] = {"activity":"Sleeping","lastBuildStatus":"Unknown","webUrl":"","lastBuildLabel":"-","lastBuildTime":"-"};
					}
					if (((activity != 'all') && (xitem[name].activity != activity)) || ((status != 'all') && (xitem[name].lastBuildStatus != status))) {
						continue;
					}
					var colDiv = document.createElement('div');
					colDiv.id = 'col_' + xitem[name].activity;
					colDiv.className = 'status_'+xitem[name].lastBuildStatus;
					colDiv.innerHTML = '<span id="info"><a href="'+xitem[name].webUrl+'" class="pipelineName">'+name+'</a><br/><span class="label"><span class="lastBuildLabel">'+xitem[name].lastBuildLabel+'</span> - <span class="lastBuildTime">'+xitem[name].lastBuildTime+'</span></span></span>';
					rowDiv.appendChild(colDiv);
					numValidCols ++
				}
				if (numValidCols > 0) {
					for(var child=rowDiv.firstChild; child!==null; child=child.nextSibling) {
						child.style.width = ''+(100 / numValidCols)+'%';
					}
					numValidRows++;
					mainDiv.appendChild(rowDiv);
				}
			}
			if (numValidRows > 0) {
				var rowHeight = ''+(100 / numValidRows)+'%';
				for(var child=mainDiv.firstChild; child!==null; child=child.nextSibling) {
					child.style.height = rowHeight;
				}
			}

			document.body.removeChild(document.body.childNodes[0]);
			document.body.appendChild(mainDiv);
			document.body.style.fontSize = 'calc(6px + '+(dashboard.fontratio)+'vmin)';
		});
		// load next dashboard
		idx++;
		if (idx > max) {
			idx = 0;
		}
		setTimeout(loadDashboard, delay, config, dlist, idx, max, delay);
	}

	loadRemoteURL('config/'+configfile+'.json', '', 'application/json', function(cfg) {
		var config = JSON.parse(cfg);
		var numDashboards = config.dashboard.length;
		// select dashboards to display
		var dlist = [];
		for (var i = 0; i < numDashboards; i++) {
			if ((pipeline == 'all') || (config.dashboard[i]['name'] == pipeline)) {
				dlist.push(i);
			}
		}
		loadDashboard(config, dlist, 0, (dlist.length - 1), (config.refresh * 1000))
	});

})();

