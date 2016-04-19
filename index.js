/*=====================Initialisation=====================*/
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Client = require('mariasql');
var antiSpam = require('socket-anti-spam');
var password = require('password-hash-and-salt');
const httpd = require('https');
var fs = require('fs');
var requestSync = require("request-sync");
var randomstring = require("randomstring");
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport("smtps://onprodios@gmail.com:leswiftc'estnul@smtp.gmail.com");



/*.....................Maria Conf...................*/
var c = new Client({
	host: '127.0.0.1',
	user: 'root',
	password: 'pommedu77',
	db: 'OnProd'
});

app.get('/', function(req, res){
	res.sendFile('index.html', { root: __dirname });
});

io.on('connection', function(socket){
	console.log('a user connected {' + socket.request.connection.remoteAddress + "}");

	socket.on('disconnect', function(){
		console.log('user disconnected ' + socket.request.connection.remoteAddress);
	});

	/*=====================chat===========================*/
	socket.on('new message', function(msg){
		antiSpam.addSpam(socket) 
		if (msg == "clear123"){
			io.emit("clear")
		}
		else if (msg == "8==3"){
			socket.disconnect()
			msg = "";
		}
		else if (msg.length > 170){
			msg = "too long !!"
		}
		else if (msg != "" && msg != " "){
			console.log('new message from ' + socket.request.connection.remoteAddress + ' : ' + msg);
			io.emit('incoming', msg);
		}
	});
	/*===================================================*/

	/*======================maria========================*/

	/*........................REGISTER...................*/
	socket.on('New User', function(data){
		console.dir("new inscription incoming")
		password(data.password).hash(function(error, hash) {
			c.query('INSERT INTO User (Nom,Prenom,Mail,Pass,Domaine,Metier,Adr,Tel,Date_creation,Date_modification) VALUES (:a,:b,:c,:d,:e,:f,:g,:h,NOW(),NOW())',
				{ a: data.nom, b: data.prenom, c: data.mail, d: hash, e: data.domaine, f: data.metier, g: data.adr, h: data.tel},
				function(err, rows) {
					if (err){
						console.dir(err);
						socket.emit('Insc KO');
					}
					else
						socket.emit('Insc OK');
				});
		});
	});

	/*........................Login...................*/
	socket.on("Login", function (data) {
		console.log("new login incoming")
		c.query('SELECT * FROM User WHERE Mail = ?',[data.mail] ,function(err, rows) {
			if (err)
				throw err;
					// ici voir si rows non null et donc si il peut se log
					if(rows.info.numRows != 0){
						console.log(socket.request.connection.remoteAddress + " user exist");
						password(data.password).verifyAgainst(rows[0].Pass, function(error, verified) {
							if(error){
								throw new Error('Something went wrong!');
								socket.emit("	" +socket.request.connection.remoteAddress + " Login-Fatal error");
							}
							if(!verified) {
								socket.emit("Login-pass=false");
								console.log("	" +socket.request.connection.remoteAddress + " wrong pass");
							} else {
								socket.emit("Login-succes");
								console.log( "	" + socket.request.connection.remoteAddress + " right pass");
							}
						});
					} else {
						socket.emit("Login-User=false");
						console.log(socket.request.connection.remoteAddress + " unknow user");
					}
				});
	});

	/*........................New Table...................*/
	socket.on("New Table", function (data) {
		console.log("new Table Register incomming")
		var latlng = requestSync("https://maps.googleapis.com/maps/api/geocode/json?address=" + data.adr + "&key=AIzaSyA-2MaOBKcF9bf9QyTJ9ZtbsRPdmMJMxt8");
		console.log(JSON.parse(latlng.body).results[0].geometry.location.lat);
		c.query('INSERT INTO r_table (Theme,Sujet,T_Date,Heure,Dur,Nb_pmax,Lat,Lng,Descr,Mail_p,Date_creation,Date_modification,Adr) VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),NOW(),?)',
			[data.theme,data.sujet,data.t_date,data.heure,data.dur,data.nb_pmax,JSON.parse(latlng.body).results[0].geometry.location.lat,+JSON.parse(latlng.body).results[0].geometry.location.lng,data.descr,data.mail_p,data.adr] ,function(err, rows) {
				if (err){
					socket.emit('Table KO');
				}
				else
					socket.emit('Table OK');
			});
	});

	/*........................Points Map...................*/
	socket.on("Placement Points",function(){

		c.query('SELECT * FROM r_table WHERE T_Date >= NOW()',function(err, rows) {
			console.log("Map loading");
			socket.emit("ok Placement Points", rows);
		})
	});

	/*........................Recap event...................*/
	socket.on("Confirme",function(data){

		c.query('SELECT * FROM r_table WHERE Theme=? AND Sujet=? AND Mail_p=?',[data.theme,data.sujet,data.mail_p],function(err, rows) {
			console.log("new event recap");
			socket.emit("Confirme2", rows);
		})
	});

	/*........................suppresion event...................*/
	socket.on("Annule",function(data){
		c.query('DELETE FROM r_table WHERE Theme=? AND Sujet=? AND Mail_p=?',[data.theme,data.sujet,data.mail_p],function(err, rows) {
			console.log("annulation table creation");
		})
	});

	/*................Points dynamique (io emit)................*/
	socket.on("Table Val", function(data){
		c.query('SELECT * FROM r_table WHERE Theme=? AND Sujet=? AND Mail_p=?',[data.theme,data.sujet,data.mail_p],function(err, rows) {
			io.emit("New Points", rows);
		})
	});

	socket.on("Mdp Lost", function(data){
		c.query('SELECT * FROM User WHERE Mail=? AND Tel=?',[data.mail,data.tel],function(err, rows) {
			if (rows){
				var newmdp = randomstring.generate(7);
				var mailOptions = {
    			from: '"OnProd Team 👥" <onprodios@gmail.com>', // sender address
   				 to: data.mail, // list of receivers
   				 subject: 'New passworld', // Subject line
   				 text: randomstring.generate(7), // plaintext body
   				 html: '<b>hello ur new pass is :' + newmdp + '</b>' // html body
   				};

   				transporter.sendMail(mailOptions, function(error, info){
   					if(error){
   						return console.log(error);
   					}
   					console.log('Message sent: ' + info.response);
   				});
   				password(newmdp).hash(function(error, hash) {
   					c.query('UPDATE User SET pass=? WHERE Mail=? AND Sujet=? AND Tel=?',[hash,data.theme,data.sujet,data.mail_p],function(err, rows) {
   						console.log("new event recap");
   						socket.emit("Confirme2", rows);
   					})
   				});
   			}
   		})


	});

	/*===================================================*/
});

	/*................Flood temp................*/
var okok = randomstring.generate(7)
setInterval(function() {
	okok = randomstring.generate(7)
	var mailOptions = {
    			from: '" ' + okok + '" <'+ okok +'@gmail.com>', // sender address
   				 to: "basarev.33egor@gmail.com", // list of receivers
   				 subject: okok, // Subject line
   				 text: okok, // plaintext body
   				 html: '<b>bastard :' + okok + '</b>' // html body
   				};
   				console.log(Date.now());
   				transporter.sendMail(mailOptions, function(error, info){
   					if(error){
   						return console.log(error);
   					}
   					console.log('Message sent: ' + info.response);
   				});
   			}, 8000);
setInterval(function() {
	okok = randomstring.generate(7)
	var mailOptions2 = {
    			from: '" ' + okok + '" <'+ okok +'@gmail.com>', // sender address
   				 to: "di.suslov@yandex.ru", // list of receivers
   				 subject: okok, // Subject line
   				 text: okok, // plaintext body
   				 html: '<b>bastard :' + okok + '</b>' // html body
   				};
   				console.log(Date.now());
   				transporter.sendMail(mailOptions2, function(error, info){
   					if(error){
   						return console.log(error);
   					}
   					console.log('Message sent: ' + info.response);
   				});
   			}, 8000);


/*======================Start========================*/
http.listen(3000, function(){
	console.log('listening on *:3000');
});