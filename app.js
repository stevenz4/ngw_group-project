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
	usersURI.map((item, index) => {
		var user = store.any($rdf.sym(baseURI + item), FOAF("name"));
		var interest = store.any($rdf.sym(baseURI + item), FOAF("interest"));
		var userInterest = {
			id: index,
			name: user.value,
			interest: interest.value,
		};
		profiles.push(userInterest);
	});
} catch (err) {
	console.log(err);
}

// ------------------------------ Retrieve Profiles END ------------------------------

// ------------------------------ Query ------------------------------

const ParsingClient = require("sparql-http-client/ParsingClient");

const endpointUrl = "https://dbpedia.org/sparql";

for (const profile of profiles) {
	const query = `
		SELECT DISTINCT ?film ?name ?abstract ?releaseDate
		WHERE {
				?film dbo:wikiPageWikiLink dbr:${profile.interest} .
				?film foaf:name ?name .
				?film dbo:abstract ?abstract .
				FILTER (langMatches(lang(?abstract),"en"))
				?film dbo:releaseDate ?releaseDate .
		} ORDER BY RAND() LIMIT 10
	`;
	const client = new ParsingClient({
		endpointUrl,
		headers: { Accept: "application/json" },
	});

	//SPARQL Query Results JSON format
	//Please check this webpage https://www.w3.org/TR/sparql11-results-json/
	client.query.select(query).then((bindings) => {
		let suggestions = [];
		bindings.forEach((row) => {
			let suggestion = {};
			Object.entries(row).forEach(([key, value]) => {
				suggestion[key] = value.value;
			});
			suggestions.push(suggestion);
		});
		profile.suggestions = suggestions;
	});
}

// ------------------------------ Query END ------------------------------

const app = express();

app.engine(
	"hbs",
	expressHandlebars.engine({
		defaultLayout: "main.hbs",
	})
);

// GET /games/super_mario_bros
app.get("/profile/:id", function (request, response) {
	const id = request.params.id; // "super_mario_bros"
	const profile = profiles.find((profile) => {
		if (profile.id.toString() == parseInt(id)) {
			return profile
		}
		
	});

	const model = {
		moviesSuggestion: profile.suggestions,
	};

	// console.log(model);

	response.render("profile.hbs", model);
});

// GET /games
app.get("/profiles", function (request, response) {
	const model = {
		profiles: profiles,
	};
	console.log(model);
	response.render("profiles.hbs", model);
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
