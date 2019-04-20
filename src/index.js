const express = require('express')
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
var port = 3000;

app.use(bodyParser.json());
var file = JSON.parse(fs.readFileSync('devices.json', 'utf8').toString());

var lastId = file.length;

function createDevice(jo, name_in, inputs_in){
	jo.name = name_in;
	jo.id = lastId;
	lastId ++;
	jo.inputs = inputs_in;
	jo.outputs = {};
	jo.lastPosted = 0;
	return jo;
}

app.route('/devices')
	.post(function(req, res, next){
		if(req.body.hasOwnProperty('name') && req.body.hasOwnProperty('inputs')){
			file[file.length] = createDevice(new Object(), req.body.name, req.body.inputs);
			fs.writeFileSync('devices.json', JSON.stringify(file));
			var response = new Object();
			response.id = file[file.length - 1].id;
			response.auth_key = "000";
			res.status(201).json(response);
		}
		else{
			next();
		}
	})
	.all(function(req, res){
		res.sendStatus(400);
	})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));