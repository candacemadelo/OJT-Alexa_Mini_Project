var methodOverride  = require("method-override"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    express         = require("express"),
    bcrypt          = require("bcryptjs");
    cookieParser    = require('cookie-parser'),
    uniqid			= require('uniqid'),
    app				= express();


//Database Connection
mongoose.connect("mongodb://localhost/alexa_project", { useNewUrlParser: true, useUnifiedTopology:true, useFindAndModify: false, useCreateIndex :true });

//Models Configuration
var	User    = require("./models/registration"),
    Devices = require("./models/registration");
    Session = require("./models/sessionToken");

// App Configuration
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/views"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended:true}));

//sets up the middleware for parsing the bodies and cookies off the requests
app.use(bodyParser.json());
app.use(cookieParser());

//function to check if the email address is valid
const isEmail = (email) => {
  if (typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  return emailRegex.test(email);
};

//initializing a new session and save data to db
const initializeSession = async (userInfo) => {
	const token = await Session.generateToken();
	const session = new Session({token, userInfo});
	await session.save();
	return session;
};


// login page
app.get('/', function(req, res) {
	res.render("login");
});

// ROUTE registration page
app.get('/registerpage', function(req, res) {
	res.render("registration");
});


//Login Page
app.post('/login', async (req, res) => {
  try {
    const {email, password } = req.body;
    if (!isEmail(email)) {
      return res.status(400).json({
        errors: [
          {
            message: 'Invalid.',
            detail: 'Email must be a valid email address.',
          },
        ],
      });
    }
    if (typeof password !== 'string') {
      return res.status(400).json({
        errors: [
          {
            message: 'Invalid.',
            detail: 'Password must be a string.',
          },
        ],
      });
    }
    //queries database to find a user with the received email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error();
      // res.render("home");
    }
    //using bcrypt to compare passwords
    const passwordValidated = await bcrypt.compare(password, user.password);
    if (!passwordValidated) {
      throw new Error();
    }

    const userInfo = user._id;
    const session = await initializeSession(userInfo);

    res.cookie('token', session.token, {
    	httpOnly: true,
        sameSite: true,
        maxAge:  2 * 60 * 60 * 1000, // 2 hours,
        secure: process.env.NODE_ENV === 'production',

    }).status(201);

	const detailsToken = await Session.find({}).populate('userInfo').exec();
	
	 res.json({
	 	message: 'Authentication Successful!',
	 	detail: 'Successfully authenticated user',
	 	detailsToken,
	 }) 

    } catch (err) {
    res.status(400).json({
	      errors: [
	        {
	          message: 'Login Error',
	          detail: 'Something went wrong during login process.',
	          errorMessage: err.message,
	        },
	      ],
	    });
	}
});


// Registration page
app.post("/register", async (req, res) => {
	try {
	    const {firstName, lastName, email, password } = req.body;
	    if (!isEmail(email)) {
	      throw new Error('Email must be a valid email address.');
	    }
	    if (typeof password !== 'string') {
	      throw new Error('Password must be a string.');
	    }

	    const user = new User({firstName, lastName, email, password });
	    const saveUser = await user.save();
	    const userInfo = saveUser._id;
	    const session = await initializeSession(userInfo);

	    res.cookie('token', session.token, {
	    	httpOnly: true,
	        sameSite: true,
	        maxAge:  2 * 60 * 60 * 1000, // 2 hours
	        secure: process.env.NODE_ENV === 'production',
	    }).status(201).json({
	    	message: 'User Registration Successful!',
	    	detail: 'You have sucessfully registered a new user.'
	    });


	    //res.render("login");

    } catch (err) {
    res.status(400).json({
      errors: [
        {
          message: 'Registration Error',
          detail: 'Something went wrong during registration process.',
          errorMessage: err.message,
        },
      ],
    });
  }
});



//Add a Device List page
app.post("/addDevice", async (req, res) => {

	try{
		const endpointId = uniqid();
		const {userId, power_status, temperature, setpoints,
		       mode, description, manufacturerName,
		       friendlyName} = req.body;

		 const deviceList = new Devices({userId, power_status, temperature, setpoints,
		                                 mode, endpointId, description, manufacturerName,
		                                 friendlyName});
		 const saveDeviceList = await deviceList.save();
		 const addDeviceList = await Devices.find({}).exec();

		 res.json({
		 	message: 'Add Device Successful!',
		 	detail: "You have Successfully added a new device",
		 	addDeviceList,
		 })



	} catch(err) {
		res.status(400).json ({
			errors: [
				{
					title: "Invalid",
					detail: "Something went wrong during adding a device.",
					errorMessage: err.message,
				},
			],
		});
	}
});

//localhost
app.listen(3000, process.env.IP, function() {
   console.log("***** Server has started on port 3000. *****");
});