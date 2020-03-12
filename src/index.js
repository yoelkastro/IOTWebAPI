const express = require('express')
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
var port = 3000;

app.use(bodyParser.json());
var deviceData = JSON.parse(fs.readFileSync('devices.json', 'utf8').toString());
var authData = JSON.parse(fs.readFileSync('auth.json', 'utf8').toString());

var lastId = deviceData.length;

function createDevice(jo, nameIn, inputsIn){
	jo.name = nameIn;
	jo.id = lastId;
	lastId ++;
	jo.inputs = inputsIn;
	jo.outputs = {};
	jo.lastPosted = 0;
	return jo;
}

function generateToken(){
	var ret = "";
	while(ret.length < 30){
		ret += Math.floor(Math.random() * 17).toString(16);
	}
	return ret;
}

function findById(arr, id){
	var ret = -1;
	for(i = 0; i < arr.length; i ++){
		if(arr[i].id == id){
			ret = i;
			break;
		}
	}
	return ret;
}

function checkKey(req, res, next){
	if(req.get("Auth-Key") != undefined){
		var uid = findById(authData, req.params.id);
		if(uid != -1){
			if(req.get("Auth-Key") == authData[uid].key){
				next();
			} else{
				res.sendStatus(401);
			} } else{
			res.sendStatus(404);
		} } else{
		res.sendStatus(400);
	}
	res.end();
}

function checkToken(req, res, next){
	if(req.get("Auth-Key") != undefined){
		var uid = findById(authData, req.params.id);
		if(uid != -1){
			if(authData[uid].tokens.indexOf(req.get("Auth-Key")) > -1){
				next();
			} else{
				res.sendStatus(401);
			} } else{
			res.sendStatus(404);
		} } else{
		res.sendStatus(400);
	}
	res.end();
}

app.route('/devices')
	.post(function(req, res, next){
		if(req.body.hasOwnProperty('name') && req.body.hasOwnProperty('inputs')){
			deviceData[deviceData.length] = createDevice({}, req.body.name, req.body.inputs);
			var response = {};
			response.id = deviceData[deviceData.length - 1].id;
			response.auth_key = generateToken();
			authData[authData.length] = {};
			authData[authData.length - 1].id = response.id;
			authData[authData.length - 1].key = response.auth_key;
			authData[authData.length - 1].tokens = [];
			fs.writeFileSync('devices.json', JSON.stringify(deviceData));
			fs.writeFileSync('auth.json', JSON.stringify(authData));
			res.status(201).json(response);
			res.end();
		}
		else{
			next();
		}
	})
	.all(function(req, res){
		res.sendStatus(400);
		res.end();
	})

app.route('/devices/:id')
	.all(checkKey)
	.delete(function(req, res, next){
		var uid = findById(authData, req.params.id);
		authData.splice(uid, 1);
		deviceData.splice(uid, 1);
		fs.writeFileSync('devices.json', JSON.stringify(deviceData));
		fs.writeFileSync('auth.json', JSON.stringify(authData));
		res.status(204).send('Deleted');
		res.end();
	})
	.put(function(req, res, next){
		var uid = findById(authData, req.params.id);
		deviceData[uid]["name"] = req.body.name;
		fs.writeFileSync('devices.json', JSON.stringify(deviceData));
		res.status(202).send('Updated');
		res.end();
	})
	.all(function(req, res){
		res.sendStatus(400);
		res.end();
	})

app.route('/devices/:id/token')
	.all(checkKey)
	.get(function(req, res, next){
		var uid = findById(authData, req.params.id);
		authData[uid].tokens[authData[uid].tokens.length] = generateToken();
		fs.writeFileSync('auth.json', JSON.stringify(authData));
		var response = {};
		response.token = authData[uid].tokens[authData[uid].tokens.length - 1];
		res.status(200).json(response);
		res.end()
	})
	.all(function(req, res){
		res.sendStatus(400);
		res.end();
	})

app.route('/devices/:id/input')
	.all(function(req, res, next){
		if(req.get("Auth-Key") != undefined){
			var uid = findById(authData, req.params.id);
			if(uid != -1){
				if(req.get("Auth-Key") == authData[uid].key){
					next();
				} else{
					next('route');
				} } else{
				res.sendStatus(404);
			} } else{
			res.sendStatus(400);
		}
		res.end();
	})
	.put(function(req, res, next){
		var uid = findById(authData, req.params.id);
		if(req.body.hasOwnProperty('inputs')){
			deviceData[uid]["inputs"] = req.body.inputs;
			fs.writeFileSync('devices.json', JSON.stringify(deviceData));
			res.status(202).send('Updated');
			res.end();
		}
		else{
			next()
		}
	})
	.get(function(req, res, next){
		var uid = findById(authData, req.params.id);
		res.status(200).json(deviceData[uid].inputs);
	})
	.all(function(req, res){
		res.sendStatus(400);
		res.end();
	})

app.route('/devices/:id/input')
	.all(checkToken)
	.get(function(req, res, next){
		var uid = findById(authData, req.params.id);
		res.status(200).json(deviceData[uid].inputs);
	})
	.all(function(req, res){
		if(req.get("Auth-Key") != undefined){
			res.sendStatus(401);
		} else{res.sendStatus(400)};
		res.end();
	})

app.route('/devices/:id/outputs')
	.all(function(req, res, next){
		if(req.get("Auth-Key") != undefined){
			var uid = findById(authData, req.params.id);
			if(uid != -1){
				if(req.get("Auth-Key") == authData[uid].key){
					next();
				} else{
					next('route');
				} } else{
				res.sendStatus(404);
			} } else{
			res.sendStatus(400);
		}
		res.end();
	})
	.get(function(req, res, next){
		res.send(deviceData.outputs);
	})

app.route('/devices/:id/outputs')
	.all(checkToken)
	.post(function(req, res, next){
		
	})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));