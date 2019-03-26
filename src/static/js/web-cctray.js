/*! CCTray Dashboard
 *
 * web-cctray.js
 *
 * @category   Dashboards
 * @author     Nicola Asuni <nicola.asuni@tecnick.com>
 * @copyright  2013-2019 Nicola Asuni - Tecnick.com LTD
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

	// "a" comma-separated list of activities to filter.
	// Valid values are: Sleeping, Building, CheckingModifications, Pending.
	var activity = urlquery['a'] === undefined ? [] : urlquery['a'].split(',');

	// "s" comma-separated list of statuses to filter.
	// Valid values are: Success, Failure, Exception, Unknown
	var status = urlquery['s'] === undefined ? [] : urlquery['s'].split(',');

	// "x" comma-separated list of substrings to remove from the the pipeline name.
	var stripname = urlquery['x'] === undefined ? [] : urlquery['x'].split(',');

	// "l" flag to enable lexicographical order
	var sort = urlquery['l'] === undefined ? false : ((urlquery['l'] == '1') || (urlquery['l'].toLowerCase() == 'true'));

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

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
	function escapeRegExp(str) {
		return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	}

	function replaceAll(str, find, replace) {
		return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
	}

	function cmp(a,b) {
		var x = a.toLowerCase();
		var y = b.toLowerCase();
		if (x < y) {return -1;}
		if (x > y) {return 1;}
		return 0;
	};

	function loadDashboard(config, dlist, idx, max, delay, blank) {
		dashboard = config.dashboard[dlist[idx]];
		loadRemoteURL(dashboard.url, dashboard.access, 'application/xml', function(ctx) {
			xitem = parseCctray(ctx);

			var mainDiv = document.createElement('div');
			mainDiv.id = 'main';
			mainDiv.className = 'main';

			// select pipelines to display
			var pipeline = [];

			if (dashboard.pipeline[0] == "all") {
				// import all pipelines specified in cctray.xml
				dashboard.pipeline = Object.keys(xitem);
			}

			if (!dashboard.hasOwnProperty('exclude')) {
				dashboard.exclude = [];
			}

			// merge query arguments with configuration parameters
			if (dashboard.hasOwnProperty('activity')) {
				dashboard.activity = dashboard.activity.concat(activity);
			} else {
				dashboard.activity = activity;
			}
			if (dashboard.hasOwnProperty('status')) {
				dashboard.status = dashboard.status.concat(status);
			} else {
				dashboard.status = status;
			}
			if (dashboard.hasOwnProperty('stripname')) {
				dashboard.stripname = dashboard.stripname.concat(stripname);
			} else {
				dashboard.stripname = stripname;
			}
			if (dashboard.hasOwnProperty('sort')) {
				dashboard.sort = dashboard.sort || sort;
			} else {
				dashboard.sort = sort;
			}

			for (var p = 0; p < dashboard.pipeline.length; p++) {
				var name = dashboard.pipeline[p];
				if (typeof xitem[name] == 'undefined') {
					if (name[0] == "*") {
						// external URL content
						xitem[name] = {"activity":"url","webUrl":name.substr(1)};
					} else {
						xitem[name] = {"activity":"Sleeping","lastBuildStatus":"Unknown","webUrl":"","lastBuildLabel":"-","lastBuildTime":"-"};
					}
				}
				if (dashboard.exclude.includes(name) || ((xitem[name].activity != "url") && ((dashboard.activity.length && (!dashboard.activity.includes(xitem[name].activity))) || (dashboard.status.length && (!dashboard.status.includes(xitem[name].lastBuildStatus)))))) {
					continue;
				}
				pipeline.push(name);
			}

			if (dashboard.sort) {
				pipeline.sort(cmp);
			}

			// calculate grid size
			var numPipelines = pipeline.length;
			if ((numPipelines == 0) && (blank !== undefined) && (blank !== "")) {
				xitem['blank'] = {"activity":"url","webUrl":blank};
				pipeline.push('blank');
				numPipelines = 1;
			}
			var gridRatio = dashboard.boxratio * window.innerHeight / window.innerWidth;
			var numCols = Math.round(Math.sqrt(numPipelines / gridRatio));
			var numRows = Math.ceil(numPipelines / numCols);
			var rowHeight = Math.round(window.innerHeight / numRows);
			var colWidth = Math.round(window.innerWidth / numCols);

			var rowDiv;
			var colDiv;
			var setCols = 0; // number of pipelines in the current row
			var r = 0;
			var name = '';
			var backgroundClass = '';
			for (var p = 0; p < numPipelines; p++) {
				if ((p % numCols) == 0) {
					if (typeof(rowDiv) === 'object') {
						mainDiv.appendChild(rowDiv);
					}
					r++;
					rowDiv = document.createElement('div');
					rowDiv.id = 'row_' + r;
					rowDiv.className = 'row';
					rowDiv.style.height = rowHeight+'px';
					setCols = 0;
				}
				var name = pipeline[p];
				var title = name;
				for(var i in dashboard.stripname) {
					title = replaceAll(title, dashboard.stripname[i], '');
				}
				var titleFontRatio = (getStringLengthRatio(title) / (7 * title.length));
				setCols++;
				colDiv = document.createElement('div');
				colDiv.className = 'box';
				colDiv.style.width = colWidth+'px';
				colDiv.style.height = rowHeight+'px';
				pipDiv = document.createElement('div');
				if (xitem[name].activity == 'url') {
					// external URL content
					pipDiv.innerHTML='<iframe class="external" src="'+xitem[name].webUrl+'"></iframe>';
				} else {
					titleFontSize = Math.min((rowHeight/5), (Math.round(colWidth / (titleFontRatio * title.length))));
					labelFontSize = Math.min((0.8 * titleFontSize), (1 + Math.round(1.3*colWidth/(xitem[name].lastBuildLabel.length+xitem[name].lastBuildTime.length+3))));
					pipDiv.innerHTML = '<span id="info"><a href="'+xitem[name].webUrl+'" class="pipelineName" style="font-size:'+titleFontSize+'px;">'+title+'</a><br/><span class="label" style="font-size:'+labelFontSize+'px;"><span class="lastBuildLabel">'+xitem[name].lastBuildLabel+'</span><br/><span class="lastBuildTime">'+xitem[name].lastBuildTime+'</span></span></span>';
					if (xitem[name].activity == 'Building') {
						backgroundClass = 'background_'+xitem[name].activity;
					} else {
						backgroundClass = 'background_'+xitem[name].lastBuildStatus;
					}
					pipDiv.className = 'border_'+xitem[name].lastBuildStatus+' '+backgroundClass;
					pipDiv.style.borderWidth = (1 + Math.round(Math.min(rowHeight,colWidth)/10))+'px';
				}
				colDiv.appendChild(pipDiv);
				rowDiv.appendChild(colDiv);
			}
			if (typeof(rowDiv) === 'object') {
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
		setTimeout(loadDashboard, delay, config, dlist, idx, max, delay, blank);
	}

	loadRemoteURL('config/'+configfile+'.json', '', 'application/json', function(cfg) {
		var config = JSON.parse(cfg);
		var blank = config.blank;
		var numDashboards = config.dashboard.length;
		// select dashboards to display
		var dlist = [];
		for (var i = 0; i < numDashboards; i++) {
			if ((pipeline == 'all') || (config.dashboard[i]['name'] == pipeline)) {
				dlist.push(i);
			}
		}
		// load first dashboard
		loadDashboard(config, dlist, 0, (dlist.length - 1), (config.refresh * 1000), blank);
	});

	window.addEventListener('resize', function() {
		this.location.href = this.location.href;
	});

	function getStringLengthRatio(str) {
		this.element = document.createElement('canvas');
		this.context = this.element.getContext("2d");
		this.context.font = "10px Arial";
		return this.context.measureText(str).width;
	}

})();
