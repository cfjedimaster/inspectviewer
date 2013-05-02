var express = require('express');
var app = express();

var fs = require('fs');

var inspectparser = require('./inspectparser');

var args = process.argv.slice(2);

if(args.length === 0) {
	console.log("Usage: node app <<path to edge inspect screen shots>> <<port, defaults to 3000>>");
	process.exit();
}

var inspectPath = args[0];
if(!inspectPath) throw new Error("Path to Edge Inspect screen shots must be passed.");
if(!fs.existsSync(inspectPath)) throw new Error(inspectPath + " does not exist.");

var port = args[1] || 3000;
//throw an error? nah - just ignore
if(isNaN(port)) port=3000;

//app.set('view engine', 'ejs');
//app.engine('.html', require('ejs').__express);
//app.set('views', __dirname + '/views');

//To use with static crap, like images, jquery, etc
app.use('/static', express.static(__dirname + '/public',{maxAge:86400000}));

app.locals.title = 'Edge Inspect Screenshot Viewer';

//default request for home page
app.get("/", function(request, response) {
	
	response.sendfile(__dirname+"/views/home.html");

});


//app.use("/",express.static(__dirname+"/views/home.html"));

app.get("/shots", function(request,response) {
	inspectparser.getData(inspectPath, function(res) {
		response.writeHead(200, {'Content-Type':'application/json'});
		response.end(JSON.stringify(res));
	});
	
});

app.use('/display', express.static(inspectPath));

app.listen(port);
console.log("Ready on port "+port);
