/*
I handle scanning the folder and parsing the file names and data. I will return an array
where each index is a hash containing:
  date: date/time string of when the shots were taken
  shots: an array where each item is...
  	url: filename really, outside app will handle rendering it
  	label: Based on filename, like "Raymond's iPod"
  	data: hash of values for the shot. Below is an example
  		url = http://html.adobe.com/
		page_size = 1624515 bytes
		os_name = iOS
		os_version = 6.0
		device_model = iPad 3G WiFi
		device_res = 1024x768
		pixel_density = 264 ppi
*/

var fs = require('fs');

var getDateFromPath = function(path) {
	var parts = path.split("_");
	var datePartStr = parts.shift() + " " + parts.shift();
	var datePartArr = datePartStr.split(/[\. \-]/);
	return new Date(datePartArr[0], datePartArr[1]-1, datePartArr[2], datePartArr[3]-1, datePartArr[4], datePartArr[5]);
};

var getNameFromPath = function(path) {
	var parts = path.split("_");
	return parts[2].split(".")[0];
};

var parseText = function(txt) {
	var result = {};
	var lines = txt.split(/\n/);
	
	for(var i=0, len=lines.length; i<len; i++) {
		if(lines[i] === "") continue;
		var parts = lines[i].split("=");
		result[parts[0].trim()] = parts[1].trim();
	}
	return result;
};

/*
Example: 2012-10-19_14.49.01_Raymond\'s iPhone.png
Result should be:
  date = 2012-10-19 14.49.01
  name = Raymond's iPhone
  data = defined above
*/
var parse = function(shot) {
	var result = {};

	result.date = getDateFromPath(shot.file);
	result.url = shot.file;

	result.name = getNameFromPath(shot.file);

	result.data = parseText(fs.readFileSync(shot.txtfile,'utf8'));
	return result;
};

exports.getData = function(path,cb) {
	var result = [];
	var requestOb = {};
	var fileList = [];
	
	fs.exists(path, function(exists) {
		if(!exists) throw new Exception(path + " isn't a valid path!");
		fs.readdir(path, function(err, files) {

			var filesToParse = [];

			for(var i=0, len=files.length; i<len; i++) {
				var file = files[i];
				var ext = file.split(".").pop();
				/*
					Logic is - if we have a png, then it is a shot, 
					and we need to find a corresponding .txt file. But, 
					we have to accept that the txt file may have a slightly
					different time stamp. Our threshold will be 2 seconds
				*/

				if(ext === "png") {
					var myname = getNameFromPath(file);
					var date = getDateFromPath(file);
					for(var k=0, len2=files.length; k<len2; k++) {
						var txtfile = files[k];
						var txtext = txtfile.split(".").pop();
						if(txtext === "txt" && getNameFromPath(txtfile) === myname) {
							var txtdate = getDateFromPath(txtfile);
							if(Math.abs(date-txtdate) < 2000) {
								filesToParse.push({file:file,txtfile:path+'/'+txtfile});
							}
						}
					}
				}
			}

			//Now we have an array of shot+txt data paths, we need to build an array of results
			filesToParse.forEach(function(item) {
				/*
				New mod for 4/2013: We now restrict data to screenshots that include the request_id propery.
				We've also changed from an array of obs, where each ob is a shot, to an array of request obs.
				Requests contain a url/date property an array of shots.
				*/
				var parsedItem = parse(item);
				if(parsedItem.data.hasOwnProperty("request_id")) {
					fileList.push(parse(item));
				} else {
					console.log("Skipping old file "+parsedItem.url);
				}
							
			});

			fileList.forEach(function(f) {
				if(!requestOb.hasOwnProperty(f.data.request_id)) {
					//We bad the metadata for the request on the first item found	
					var request = {};
					request.url = f.data.url;
					request.date = f.date;
					request.shots = [];
					requestOb[f.data.request_id] = request;
				}
				requestOb[f.data.request_id].shots.push(f);
				
			});

			/*
			Ok, now that we've got a hash of request obs, we need a sorted result for the result. That
			way the front end can list them by request/date with a date sort. 
			*/

			for(var req in requestOb) {
				result.push(requestOb[req]);	
			}

			result.sort(function(x,y) {
				var xD = new Date(x.date);
				var yD = new Date(y.date);
				if(xD.getTime() < yD.getTime()) return 1;
				if(xD.getTime() > yD.getTime()) return -1;
				return 0;
			});

			cb(result);
		});
	});

}