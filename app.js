var methodOverride  = require("method-override"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    express         = require("express"),
    bcrypt          = require("bcryptjs");
    cookieParser    = require('cookie-parser'),
    uniqid			= require('uniqid'),
    app				= express();

//-----------------------------------------------------------------------------------------------------------------------------------------------------------
//Database Connection
mongoose.connect("mongodb+srv://dre123:6TyT6wxrwqjMv3iP@cluster0-ztdrl.mongodb.net/projectdb?retryWrites=true&w=majority", 
	             { useNewUrlParser: true, useUnifiedTopology:true, useFindAndModify: false, useCreateIndex :true });

//Models Configuration
var	User    	= require("./models/registration"),
    Devices 	= require("./models/devices"),
    Session 	= require("./models/sessionToken"),
    AccessToken = require("./models/oauth");

// App Configuration
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/views"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended:true}));

//sets up the middleware for parsing the bodies and cookies off the requests
app.use(bodyParser.json());
app.use(cookieParser());

//functions
//-----------------------------------------------------------------------------------------------------------------------------------------------------------
//if valid email address
const isEmail = (email) => {
  if (typeof email !== 'string') {
    return false;
  }
  const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

  return emailRegex.test(email);
};


//initializing a new session and save data to db
const initializeToken = async (user) => {
	const token = await AccessToken.generateToken();
	const session = new AccessToken({user, client: "5ee1d521971c658529d2514a", accessToken:token, scope: "read"});
	await session.save();
	return session;
};


//routes
//-----------------------------------------------------------------------------------------------------------------------------------------------------------
// login page
app.get('/', function(req, res) {
	res.render("login");
});

app.get('/api/v1/user/home', function(req, res) {
	res.render("home");
});

app.get('/api/v1/device/addDevice', function(req, res) {
	res.render("addDevice");
});

// ROUTE registration page
app.get('/registerpage', function(req, res) {
	res.render("registration");
});


//Login Page
app.post('/api/v1/user/login', async (req, res) => {

  console.log(req);
  try {
    const {email, password } = req.body;

    if (!isEmail(email)) {
      return res.status(400).json({
        errors: [
          {
            message: 'Bad Request',
            detail: 'Email must be a valid email address',
          },
        ],
      });
    }else if (typeof email !== 'string') {
    	return res.status(400).json({
        errors: [
          {
            message: 'Bad Request',
            detail: 'Email must be a string',
          },
        ],
      });
    }

    if (typeof password !== 'string') {
      return res.status(400).json({
        errors: [
          {
            message: 'Bad Request',
            detail: 'Password must be a string',
          },
        ],
      });
    }

    //queries database to find a user with the received email
    const findUser = await User.findOne({ email });
    if (!findUser) {
      throw new Error("User does not exist.");
      // res.render("home");
    }
    //using bcrypt to compare passwords
    const passwordValidated = await bcrypt.compare(password, findUser.password);
    if (!passwordValidated) {
      throw new Error("Password does not match.");
    }

    const user = findUser._id;
    const session = await initializeToken(user);
    const saveSession = await session.save();
    const sessionId = saveSession._id;

    res.cookie('token', session.token, {
    	httpOnly: true,
        sameSite: true,
        maxAge:  2 * 60 * 60 * 1000, // 2 hours,
        secure: process.env.NODE_ENV === 'production',

	}).status(201);
	
	const getToken = await AccessToken.find({_id:sessionId}, {"_id": 0, "accessToken":1, "user":1}).populate("user").exec();

	for(var i = 0; i < getToken.length; i++) {
		var devUser = getToken[i].user;
	}

	const getUserToken = "" + devUser._id;
	const data = await Devices.find({"userId": getUserToken}, {"_id":0, "endpointId": 1, "description": 1, "manufacturerName":1, "friendlyName":1, "temperature":1,
									"power_status":1, "mode":1}).exec();

	res.json({
		"success": true,
		"message": 'User logged in successfully.',
		getToken
	});

	res.render('home', {datas: data, getToken: getToken});

    } catch (err) {

    res.status(400).json({
	      errors: [
	        {
	          "success" : false, 
	          "message": 'Invalid email or password.',
	          "data" :{
	          		"details": [
	          			req.body
	          		]
	          	},
	          "errorMessage": err.message,
	        },
	      ],
	    });
	}
});


// Registration page
app.post("/api/v1/user/register", async (req, res) => {

	console.log(req);

	try {
	    const {firstName, lastName, email, password } = req.body;

	    const user = new User({firstName, lastName, email, password });
	    // const saveUser = await user.save();
	    // const userInfo = saveUser._id;
	    // //const session = await initializeSession(userInfo);
	    // const currentUser = await User.find({_id: userInfo}).exec();

	    // // res.cookie('token', session.token, {
	    // // 	httpOnly: true,
	    // //     sameSite: true,
	    // //     maxAge:  2 * 60 * 60 * 1000, // 2 hours
	    // //     secure: process.env.NODE_ENV === 'production',
	    // // })

	   const registerUser = new User(user);
	    await registerUser.save((error) =>{
			if(error){
				console.log(error);
			} else {
				res.render("login");
			}
		});

    } catch (err) {	
    res.status(400).json({
      errors: [
        {
          "success": false,
          "message": 'Registration Failed',
          "Error_code"	: 1308,
          "data": {
          	"registerUser": [
          		req.body
          	]
          },
          "errorMessage": err.message,
        },
      ],
    });
  }
});



//Add a Device List page
app.post("/api/v1/device/addDevice", async (req, res) => {
	console.log(req);

	var getToken = req.query.token;

	const deviceToken = await AccessToken.find({"accessToken":getToken}, {"user": 1, "_id":0}).exec();
	console.log(deviceToken);

	for(var i = 0; i < deviceToken.length; i++) {
		var devUser = deviceToken[i].user;
	}

	var infoUser = "" + devUser;
	console.log(infoUser);

	try{

		const uniq = uniqid();
		const {description, manufacturerName,
		       friendlyName} = req.body;

		const deviceList = new Devices({userId: infoUser, tokenId: getToken, power_status: 0 , temperature : 0, 
										mode: "undefined", endpointId:uniq, description, manufacturerName,
		       							friendlyName});

		const saveDeviceList = await deviceList.save();
		const deviceId = saveDeviceList._id;
		const data = await Devices.find({"_id": deviceId}).exec();

		 res.json({
		 	"success": true,
		 	"message": 'Add Device Successful!',
		 	data,
		 })

	} catch(err) {

		console.log(err);

		res.status(400).json ({
			errors: [
				{
					"success": false,
					"message": "Adding a new device failed.",
					"data" : {
						"data": [req.body]
					},
					errorMessage: err.message,
				},
			],
		});

		console.log(err);
	}
});


//Get a Device List page
app.get("/api/v1/device/getDevice", async (req, res) => {

	console.log(req);

	try{
		var getToken = req.query.token;
		console.log(getToken);

		const deviceToken = await AccessToken.find({"accessToken":getToken}, {"user": 1, "_id":0}).exec();
		console.log(deviceToken);

		for(var i = 0; i < deviceToken.length; i++) {
			var devUser = deviceToken[i].user;
		}

		const infoUser = "" + devUser;
		console.log(infoUser);

		const data = await Devices.find({"userId": infoUser}, {"_id":0, "endpointId": 1, "description": 1, "manufacturerName":1, "friendlyName":1}).exec();
		console.log(data);
	
		var endpoints = [];
		for(i = 0; i < data.length; i++) {
			var endId = data[i].endpointId;
			var mname = data[i].manufacturerName;
			var fname = data[i].friendlyName;
			var desc = data[i].description;

			endpoints.push({
                "endpointId": endId,
                "manufacturerName": mname,
                "friendlyName": fname,
                "description": desc,
                "displayCategories": ["THERMOSTAT", "TEMPERATURE_SENSOR"],
                "capabilities":
                [
                    {
                        "type": "AlexaInterface",
                        "interface": "Alexa.ThermostatController",
                        "version": "3",
                        "properties": {
                        "supported": [
                            {
                                "name": "targetSetpoint"
                            },
                            {
                                "name": "thermostatMode"
                            }
                        ],
                        "proactivelyReported": true,
                        "retrievable": true
                      },
                      "configuration": {
                            "supportedModes": ["OFF", "COOL", "HEAT"],
                            "supportsScheduling": false
                      }
                    },
                    {
                      "type": "AlexaInterface",
                      "interface": "Alexa.PowerController",
                      "version": "3",
                      "properties": {
                        "supported": [
                          {
                            "name": "powerState"
                          }
                        ],
                        "proactivelyReported": true,
                        "retrievable": true
                      }
                    },
                    {
                      "type": "AlexaInterface",
                      "interface": "Alexa",
                      "version": "3"
                    }
                ]
            
				
			});
		}	

		res.status(201).json({
			endpoints
		});

	} catch(err) {
		console.log(err);

		res.status(400).json ({
			errors: [
				{
					"success": false,
					"message": "No data found.",
					"data" : {
						"token": [req.body]
					},
					errorMessage: err.message,
				},
			],
		});

		console.log(err);
	}
});

//Command Control API
app.post("/api/v1/device/commandControl", async (req, res) => {

	// console.log(req);

	var devToken = req.query.token;

	try {
		const getDevToken = req.body.tokenId;
		const devPowStat  = req.body.power_status;
		const getTemp 	  = req.body.temperature;
		const getMode     = req.body.mode;
		const getEndpoint = req.body.endpointId;

		const commandDevice = await AccessToken.find({"accessToken": getDevToken}, {"_id": 0, "user": 1}).exec();
		console.log(commandDevice);

		for(var i = 0; i < commandDevice.length; i++) {
			var userDev = commandDevice[i].user;
		}

		const getUser = "" + userDev;
		console.log(getUser);

		const getUserDevice = await Devices.findOneAndUpdate({"userId" : getUser, "endpointId": getEndpoint}, {$set: {"power_status": devPowStat, 
			                                           "temperature": getTemp, "mode": getMode}}, { returnNewDocument: true }).exec();
		console.log(getUserDevice);
		const getdevice = "" + getUserDevice._id;
		const device = await Devices.find({"_id": getdevice}).exec();

		res.status(201).json({
			"success" : true,
			"message" : "Command Success!",
			device
		});


	} catch(err) {
		console.log(err);
		res.status(400).json ({
	 		"success" : false,
			"message" : "Command Failed."
		});
	}
});

//Get device status
app.get("/api/v1/device/getStates", async (req, res) => {
	console.log(req);
	try{
		var getToken    = req.query.token;
		var getEndpoint = req.query.endpointId;

		const deviceToken = await AccessToken.find({"accessToken":getToken}, {"_id":0, "user": 1}).exec();
		console.log(deviceToken);

		for(var i = 0; i < deviceToken.length; i++) {
			var devUser = deviceToken[i].user;
		}

		const infoUser = "" + devUser;
		console.log(infoUser);

		const data = await Devices.find({"userId": infoUser, "endpointId": getEndpoint}, {"_id":0, "power_status": 1, "temperature": 1, "mode":1}).exec();
		console.log(data);
		
		var timeNow = new Date().toISOString();
		var context = [];
		for(i = 0; i < data.length; i++) {
			var thermostatMode = data[i].mode;
			var temperature = data[i].temperature;
			var powerState = data[i].power_status;

			properties.push({	
				[
					{
						"namespace": "Alexa.ThermostatController",
						"name": "thermostatMode",
						"value": thermostatMode,
						"timeOfSample": timeNow,
						"uncertaintyInMilliseconds": 500
					},
					{
						"namespace": "Alexa.ThermostatController",
						"name": "targetSetpoint",
						"value": {
							"value": temperature,
							"scale": "CELSIUS"
						},
						"timeOfSample": timeNow,
						"uncertaintyInMilliseconds": 500
					},
					{
						"namespace": "Alexa.PowerController",
						"name": "powerState",
						"value": powerState,
						"timeOfSample": timeNow,
						"uncertaintyInMilliseconds": 500
					}
				]
			});
		}
		
		res.status(201).json({
			properties
		});

	} catch(err) {

		console.log(err);

		res.status(400).json ({
			errors: [
				{
					"success": false,
					"message": "Failed retrieving data.",
					"data" : {
						"token": [req.body]
					},
					"errorMessage": err.message
				}
			]
		});

		console.log(err);
	}
});


//Delete Device API
app.post("/api/v1/device/deleteDevice", async(req, res) => {
	console.log(req);

	var deleteDevTok    = req.query.token,
	    deleteEndpoint  = req.query.endpoint;

	try {
		const delDevice = await Devices.find({"tokenId": deleteDevTok, "endpointId": deleteEndpoint}, {"_id":1}).exec();
		console.log(delDevice);

		for(var i = 0; i < delDevice.length; i++) {
			var device =  delDevice[i]._id;
		}

		const getdevice = "" + device;
		console.log(device);
		const deleteDevice = await Devices.findByIdAndRemove({"_id": device}).exec();

		res.status(201).json({
			"success" : true,
			"message": "You have successfully deleted a device.",
			deleteDevice
		});

	} catch (err) {
		console.log(err);
		res.status(400).json({
			"success" : "false",
			"messaage": "Device was not successfully deleted."
		});
	}

});


//localhost
//-----------------------------------------------------------------------------------------------------------------------------------------------------------
app.listen(3000, process.env.IP, function() {
	console.log("***** Server has started on port 3000. *****");
});