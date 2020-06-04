var methodOverride  = require("method-override"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    express         = require("express"),
    bcrypt          = require("bcryptjs");
    cookieParser    = require('cookie-parser'),
    app				= express();


//Database Connection
mongoose.connect("mongodb://localhost/alexa_project", { useNewUrlParser: true, useUnifiedTopology:true, useFindAndModify: false, useCreateIndex :true });

//Models Configuration
var	User  = require("./models/registration");

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

// home page
app.get('/', function(req, res) {
	res.render("login");
});

//Login Page
app.post('/login', async (req, res) => {
  try {
    const {email, password } = req.body;
    if (!isEmail(email)) {
      return res.status(400).json({
        errors: [
          {
            title: 'Invalid.',
            detail: 'Email must be a valid email address.',
          },
        ],
      });
    }
    if (typeof password !== 'string') {
      return res.status(400).json({
        errors: [
          {
            title: 'Invalid.',
            detail: 'Password must be a string.',
          },
        ],
      });
    }
    //queries database to find a user with the received email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error();
    }
    //using bcrypt to compare passwords
    const passwordValidated = await bcrypt.compare(password, user.password);
    if (!passwordValidated) {
      throw new Error();
    }

    res.json({
      title: 'Login Successful',
      detail: 'Successfully validated user credentials',
    });

  } catch (err) {
  	console.log(err);
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

	    res.status(201).json({
	      title: 'User Registration Successful',
	      detail: 'Successfully registered new user',
	    });

    } catch (err) {
    res.status(400).json({
      errors: [
        {
          title: 'Registration Error',
          detail: 'Something went wrong during registration process.',
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