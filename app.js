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
    Devices = require("./models/devices");
    Session = require("./models/sessionToken");

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
    const sessionId = session._id;

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
	    const saveUser = await user.save();
	    const userInfo = saveUser._id;
	    //const session = await initializeSession(userInfo);
	    const currentUser = await User.find({_id: userInfo}).exec();

	    // res.cookie('token', session.token, {
	    // 	httpOnly: true,
	    //     sameSite: true,
	    //     maxAge:  2 * 60 * 60 * 1000, // 2 hours
	    //     secure: process.env.NODE_ENV === 'production',
	    // })

	    res.status(201).json({
	    	"success" : true,
	    	"message": 'Successfully Registered!',
	    	"details": 'User has been saved successfully.',
	    	"data": {
	    		"registerUser": currentUser
	    	}
	    });


	    //res.render("login");

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
app.post("/api/v1/device/addDevice/token", async (req, res) => {

	try{

		const uniq = uniqid();
		const {power_status, temperature, setpoints,
		       mode, description, manufacturerName,
		       friendlyName} = req.body;

		const deviceList = new Devices({power_status, temperature, setpoints,
		       mode, endpointId:uniq, description, manufacturerName,
		       friendlyName});

		const saveDeviceList = await deviceList.save();
		const deviceId = saveDeviceList._id;
		const data = await Devices.find({_id:deviceId}).exec();

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
app.post("/api/v1/device/getDevice", async (req, res) => {

	try{
		const token = req.body;
		const device = await Devices.find({}).exec();

		res.json({
			"success" : true,
			"message" : "Found data.",
			"data":[
				device
			]
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
//-----------------------------------------------------------------------------------------------------------------------------------------------------------


//localhost
//-----------------------------------------------------------------------------------------------------------------------------------------------------------
app.listen(3000, process.env.IP, function() {
   console.log("***** Server has started on port 3000. *****");
});