var methodOverride  = require("method-override"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    express         = require("express"),
    bcrypt          = require("bcryptjs");
    cookieParser    = require('cookie-parser'),
    uniqid			= require('uniqid'),
    jwt				= require('jsonwebtoken'),
    app				= express();

//-----------------------------------------------------------------------------------------------------------------------------------------------------------
//Database Connection
mongoose.connect("mongodb+srv://dre123:6TyT6wxrwqjMv3iP@cluster0-ztdrl.mongodb.net/projectdb?retryWrites=true&w=majority", 
	             { useNewUrlParser: true, useUnifiedTopology:true, useFindAndModify: false, useCreateIndex :true });

//Models Configuration
var	User    = require("./models/registration"),
    Devices = require("./models/devices"),
const { collection, count } = require("./models/registration"),
    Session = require("./models/sessionToken"),
    AccessToken = require("./models/oauth"),
    Commands = require("./models/commandDevices");

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
const initializeSession = async (userInfo) => {
	const token = await Session.generateToken();
	const session = new Session({token, userInfo});
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
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User does not exist.");
      // res.render("home");
    }
    //using bcrypt to compare passwords
    const passwordValidated = await bcrypt.compare(password, user.password);
    if (!passwordValidated) {
      throw new Error("Password does not match.");
    }

    const userInfo = user._id;
    const session = await initializeSession(userInfo);
    //const session = new Session({status, token, userInfo});
    const saveSession = await session.save();
    const sessionId = saveSession._id;

    res.cookie('token', session.token, {
    	httpOnly: true,
        sameSite: true,
        maxAge:  2 * 60 * 60 * 1000, // 2 hours,
        secure: process.env.NODE_ENV === 'production',

    }).status(201);

	const data = await Session.find({_id:sessionId}).populate("userInfo").exec();
	
	res.json({
	 	"success": true,
	 	"message": 'User logged in successfully.',
	 	data
	 });

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
	          errorMessage: err.message,
	        },
	      ],
	    });
	}
});


// Registration page
app.post("/api/v1/user/register", async (req, res) => {
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
				res.status(201).json({
					"success" : true,
					"message": 'Successfully Registered!',
					"details": 'User has been saved successfully.',
					"data": {
						"registerUser": user
					}
				});
			}
		});

    } catch (err) {
    res.status(400).json({
      errors: [
        {
          "success": false,
          "message": 'Registration Failed',
          "Error_code": 1308,
          "data": {
          	"registerUser": [
          		req.body
          	]
          },
          errorMessage: err.message,
        },
      ],
    });
  }
});



//Add a Device List page
app.post("/api/v1/device/addDevice/:token", async (req, res) => {
	var getToken = req.params.token;

	const deviceToken = await AccessToken.find({accessToken:getToken}, {"user": 1, "_id":0}).exec();
	//const deviceToken = await AccessToken.findOne({}, {"accessToken": 1, "_id":0}).sort({'_id':-1}).limit(1);
	const infoUser = "" + deviceToken.user;
	try{

		const uniq = uniqid();
		const {description, manufacturerName,
		       friendlyName} = req.body;

		const deviceList = new Devices({userId: infoUser, tokenId: getToken, endpointId:uniq, description, manufacturerName,
		       friendlyName});

		const saveDeviceList = await deviceList.save();
		const deviceId = saveDeviceList._id;
		const data = await Devices.find({_id: deviceId}).exec();

		 res.json({
		 	"success": true,
		 	"message": 'Add Device Successful!',
		 	data,
		 })

	} catch(err) {
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
app.get("/api/v1/device/getDevice/:token", async (req, res) => {

	try{
		var getToken = req.params.token;

		const deviceToken = await AccessToken.find({accessToken:getToken}, {"user": 1, "_id":0}).exec();
		console.log(deviceToken);
		//const deviceToken = await AccessToken.findOne({}, {"accessToken": 1, "_id":0}).sort({'_id':-1}).limit(1);
		//const deviceToken = await AccessToken.findOne({}, {"user": 1, "_id":0}).sort({'_id':-1}).limit(1);
		const infoUser = "" + deviceToken.user;
		console.log(infoToken);
		const data = await Devices.find({"userId": infoUser}, {"_id":0, "tokenId": 0,"endpointId": 1, "description": 1, "manufacturerName":1, "friendlyName":1}).exec();
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
			"success": true,
	     	"message": "Found data",
			endpoints
		});

	} catch(err) {
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

//Get device status
app.get("/api/v1/device/deviceState/:id", async (req, res) => {
		var deviceID = req.params.id;
	try{
		const deviceStatus = await Devices.findById(deviceID, {}).exec();
		res.json({
			message: 'Device found!',
			detail: "You have Successfully added a new device",
			deviceStatus
		});
		console.log(deviceStatus);

	} catch(err) {
		res.status(400).json ({
			errors: [
				{
					"success": true,
					"message": "Failed retrieving data.",
					errorMessage: err.message
				}
			]
		});

		console.log(err);
	}
});


//Command Control API
app.post("/api/v1/device/commandControl/:token", async (req, res) => {
	var devToken = req.params.token;

	try {
		const getEndpointId = await Devices.find({tokenId:devToken}, {"_id":0, "tokenId" : 0, "userId" : 0, 
			                                      "endpointId": 1, "manufacturerName" : 0, "description": 0, "friendlyName": 0}).exec();
		console.log(getEndpointId);
		const {power_status, temperature, mode} = req.body;
		const newCommand = new Commands({token: deviceToken, power_status, temperature, mode, endpointId:getEndpointId});
		const saveCommands = await newCommand.save();
		const commandId = saveCommands._id;
		const device = await Commands.find({_id: commandId}).exec();

		res.status(201).json({
			"success" : true,
			"message" : "Success!";
			device
		});


	} catch(err) {
		res.status(400).json ({
			"success" : false,
			"message" : "Command Failed."
		});
	}
});



//localhost
//-----------------------------------------------------------------------------------------------------------------------------------------------------------
app.listen(3000, process.env.IP, function() {
   console.log("***** Server has started on port 3000. *****");
});