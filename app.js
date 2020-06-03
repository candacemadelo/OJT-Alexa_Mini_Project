var methodOverride  = require("method-override"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    express         = require("express"),
    app				= express();


//Database Connection
mongoose.connect("mongodb://localhost/alexa_project", { useNewUrlParser: true, useUnifiedTopology:true, useFindAndModify: false });

//Models Configuration
var	User  = require("./models/registration");

// App Configuration
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended:true}));

//sets up the middleware for parsing the bodies and cookies off the requests
app.use(bodyParser.json());
app.use(cookieParse());

// //function to check if the email address is valid
// var isEmail = (email) => {
// 	var emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

// 	if(typeof email != "string") {
// 		return false;
// 	}

// 	return emailRegex.test(email);

// };

// home page
app.get('/', function(req, res) {
	res.render("");
});

//Login Page
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    //find user in database
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error();
    }

    //using bcrypt to compare passwords
    const passwordValidated = await bcrypt.compare(password, user.password);
    if (!passwordValidated) {
      throw new Error();
    }

    res.render("");
  } catch (err) {
  	console.log(err);
  }
});


// Registration page
app.post("/register", function(req, res) {
	User.create({
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		password: req.body.password
	}, function(err, user) {
		if(err) {
			console.log(err)
		} else {
			res.redirect("/login");
		}
	});
});

//localhost
app.listen(3000, process.env.IP, function() {
   console.log("***** Server has started on port 3000. *****");
});