var resultDiv = "";
var data;
var filters = {};
var template;

$(document).ready(function() {
	console.log('init');

	resultDiv = $("#results");
	
	var source   = $("#shotTemplate").html();
	template = Handlebars.compile(source);
	resultDiv.html("<i>Fetching shots...</i>");
	
	$.get("/shots", {}, function(res) {
		//get unique devices;
		var deviceList = [];
		res.forEach(function(d) {
			d.shots.forEach(function(s) {
				if(deviceList.indexOf(s.data.device_model) == -1) deviceList.push(s.data.device_model);
			});					
		});
		//lame, not doing handlebars
		var devList = "";
		deviceList.forEach(function(d) {
			devList += "<li><a href='' class='devicefilter' data-device='"+d+"'>"+d+"</a></li>";
		});
		$("#deviceList").append(devList);
		
		data = res;
		renderData();
	}, "json");
	
	$(".nofilter").on("click", function(e) {
		e.preventDefault();
		filters = {};
		renderData();
	});
	
	$(".osfilter").on("click", function(e) {
		e.preventDefault();
		var os = $(this).data("os");
		filters.os = os;
		renderData();
	});

	$(document).on("click", ".devicefilter", function(e) {
		e.preventDefault();
		var device = $(this).data("device");
		filters.device = device;
		renderData();
	});

});

function renderData() {
	var toRender = [];
	//do we have filters?
	if(!filters.os && !filters.device) var html = template({requests:data});
	else {
		data.forEach(function(d) {
			var newReq = {
				url:d.url,
				date:d.date,
				shots:[]
			}
			d.shots.forEach(function(s) {
				if(filters.os) {
					if(s.data.os_name === filters.os) newReq.shots.push(s);
				}
				if(filters.device) {
					if(s.data.device_model === filters.device) newReq.shots.push(s);
				}
			});
			toRender.push(newReq);
		});
		//Now we may have to prune empty shots
		toRender = toRender.filter(function(elm,index,arr) {
			return elm.shots.length > 0;	
		});
		
		var html = template({requests:toRender});
	}
	
	resultDiv.html(html);
	$(".fancybox").fancybox();
}
	
Handlebars.registerHelper('fDate', function(d) {
	var date = new Date(d);
	return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + ' @ ' + (date.getHours()+1) + ':' + (date.getMinutes()+1) + ' ' + (date.getHours()>11?'pm':'am');
});
