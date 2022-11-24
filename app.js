const express = require("express");
const expressHandlebars = require("express-handlebars");
/*
// This is what our game objects looked like from the
// beginning, but now we read the data from the turtle
// file instead.

const games = [{
	id: "super_mario_bros",
	name: "Super Mario Bros.",
	description: "A good game."
}, {
	id: "the_legend_of_zelda",
	name: "The Legend Of Zelda",
	description: "A cool game."
}]
*/

// Create the game objects from the info in the turtle file.
// const fs = require('fs')
// const $rdf = require('rdflib')

// const turtleString = fs.readFileSync('game-resources.ttl').toString()

// const store = $rdf.graph()

// $rdf.parse(
// 	turtleString,
// 	store,
// 	"http://gameverse.com/owl/games",
// 	"text/turtle"
// )

// const stringQuery = `
// 	SELECT
// 		?id
// 		?name
// 		?description
// 	WHERE {
// 		?game a <http://gameverse.com/owl/games#Game> .
// 		?game <http://gameverse.com/owl/games#id> ?id .
// 		?game <http://gameverse.com/owl/games#name> ?name .
// 		?game <http://gameverse.com/owl/games#description> ?description .
// 	}
// `

// const query = $rdf.SPARQLToQuery(stringQuery, false, store)

// // To see what we get back as result:
// // console.log(store.querySync(query))

// const games = store.querySync(query).map(
// 	gameResult => {
// 		return {
// 			id: gameResult['?id'].value,
// 			name: gameResult['?name'].value,
// 			description: gameResult['?description'].value
// 		}
// 	}
// )

// // Try to find more information about each game from
// // linked data.
// const ParsingClient = require('sparql-http-client/ParsingClient')

// const client = new ParsingClient({
// 	endpointUrl: 'https://dbpedia.org/sparql'
// })

// for(const game of games){

// const query = `
// 	SELECT
// 		?releaseDate
// 	WHERE {
// 		?game dbp:title "${game.name}"@en .
// 		?game dbo:releaseDate ?releaseDate .
// 	}
// `

// 	client.query.select(query).then(rows => {

// 		// Too see what we get back as result:
// 		// console.log(rows)

// 		game.releaseDate = 'Unknown' // Default value in case we don't find any.
// 		rows.forEach(row => {
// 			game.releaseDate = row.releaseDate.value
// 		})

// 	}).catch(error => {
// 		console.log(error)
// 	})

// }

// Our Express app.

// ------------------------------ Retrieve Profiles ------------------------------
const $rdf = require("rdflib");
const fs = require("fs");

//load the file into a string
var data = fs.readFileSync("profiles.ttl").toString();

var store = $rdf.graph();
var contentType = "text/turtle";
var baseURI = "http://example.com/demo";

//set up the namespace prefixes
var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");

// store interests from profiles.tts of each user
var profiles = [];

// list all user URIs
var usersURI = ["#SZ", "#RB", "#MK"];

try {
	$rdf.parse(data, store, baseURI, contentType);
	usersURI.map((item) => {
		var user = store.any($rdf.sym(baseURI + item), FOAF("name"));
		var interest = store.any($rdf.sym(baseURI + item), FOAF("interest"));
		var userInterest = {
			name: user.value,
			interest: interest.value,
		};
		profiles.push(userInterest);
	});
	console.log(profiles);
} catch (err) {
	console.log(err);
}

// ------------------------------ Retrieve Profiles END ------------------------------

// ------------------------------ Query ------------------------------

const genres = [
	"Horror_film",
	"Action_film",
	"Comedy_film",
	"Romance_film",
	"Thriller_film",
	"Science_fiction_film",
	"Fantasy_film",
	"Crime_film",
	"Adventure_film",
];

const ParsingClient = require("sparql-http-client/ParsingClient");

const endpointUrl = "https://dbpedia.org/sparql";
profiles.forEach((profile) => {
	const query = `
		SELECT DISTINCT ?film
		WHERE {
				?film dbo:wikiPageWikiLink dbr:${profile.interest} .
		} ORDER BY RAND() LIMIT 10
	`;
	const client = new ParsingClient({
		endpointUrl,
		headers: { Accept: "application/json" },
	});

	var test = [];

	//SPARQL Query Results JSON format
	//Please check this webpage https://www.w3.org/TR/sparql11-results-json/
	client.query.select(query).then((bindings) => {
		bindings.forEach((row) => {
			Object.entries(row).forEach(([key, value]) => {
				test.push({ [key]: value.value });
			});
		});
		console.log(test);
	});
});

// ------------------------------ Query END ------------------------------

const app = express();

app.engine(
	"hbs",
	expressHandlebars.engine({
		defaultLayout: "main.hbs",
	})
);

// GET /games/super_mario_bros
app.get("/games/:id", function (request, response) {
	const id = request.params.id; // "super_mario_bros"

	const game = games.find((g) => g.id == id);

	const model = {
		game: game,
	};

	response.render("game.hbs", model);
});

// GET /games
app.get("/games", function (request, response) {
	// const model = {
	// 	games: games
	// }
	// response.render("games.hbs", model)
});

// GET /layout.css
app.get("/layout.css", function (request, response) {
	response.sendFile("layout.css", { root: "." });
});

// GET /
app.get("/", function (request, response) {
	response.render("start.hbs");
});

// GET /about
app.get("/about", function (request, response) {
	response.render("about.hbs");
});

app.listen(8080);
