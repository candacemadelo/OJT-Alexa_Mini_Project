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

// home page
app.get('/', function(req, res) {
	res.render("");
});

//Login Page
app.post("/login", function(req, res) {
	if(err) {
		console.log(err);
	} else {
		res.render("");
	}
});

// Registration page
app.post("/register", function(req, res) {
	User.create({
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		username: req.body.username,
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