const express = require("express");
const expressHandlebars = require("express-handlebars");

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

// ------------------------------ Queries ------------------------------

const ParsingClient = require("sparql-http-client/ParsingClient");

const endpointUrl = "https://dbpedia.org/sparql";


// ------------------------------ DBPEDIA ------------------------------
// Purposely using random to get different results each time

for (const profile of profiles) {
	const query = `
		SELECT DISTINCT ?film ?filmLabel ?abstract ?releaseDate
		WHERE {
				?film dbo:wikiPageWikiLink dbr:${profile.interest} .
				?film foaf:name ?filmLabel .
				?film dbo:abstract ?abstract .
				FILTER (langMatches(lang(?abstract),"en"))
				?film dbo:releaseDate ?releaseDate .
		} ORDER BY RAND() LIMIT 10
	`;
	const client = new ParsingClient({
		endpointUrl,
		headers: { Accept: "application/json" },
	});

	client.query.select(query).then((bindings) => {
		let suggestions = [];
		bindings.forEach((row) => {
			let suggestion = {};
			Object.entries(row).forEach(([key, value]) => {
				suggestion[key] = value.value;
			});
			suggestions.push(suggestion);
		});
		profile.suggestions = { ...profile.suggestions, ...suggestions };
	});
}

// ------------------------------ WIKIDATA ------------------------------

const SparqlClient = require("sparql-http-client");
const endpointUrlWIKIDATA = "https://query.wikidata.org/sparql";

for (const profile of profiles) {
	const query = `
	PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
	PREFIX wdt:  <http://www.wikidata.org/prop/direct/>
	PREFIX schema: <http://schema.org/>

	SELECT distinct ?film ?filmLabel ?releaseDate ?abstract
	WHERE { 
		?film wdt:P136/rdfs:label "${profile.interest.toLowerCase().replace("_", " ")}"@en .
		?film schema:description ?abstract .
		FILTER (langMatches(lang(?abstract),"en"))
		?film wdt:P577 ?releaseDate
		SERVICE wikibase:label { bd:serviceParam wikibase:language  "en" }
	} LIMIT 10
	`;
	const client = new SparqlClient({ endpointUrl: endpointUrlWIKIDATA });
	client.query.select(query).then((stream) => {
		let suggestions = [];
		stream
			.on("data", (row) => {
				let suggestion = {};
				Object.entries(row).forEach(([key, value]) => {
					suggestion[key] = value.value;
				});
				suggestions.push(suggestion);
			})
			.on("end", () => {
				profile.suggestionsBis = { ...profile.suggestionsBis, ...suggestions };
			});
	});
}

// ------------------------------ Queries END ------------------------------

// Our Express app.

const app = express();

app.engine(
	"hbs",
	expressHandlebars.engine({
		defaultLayout: "main.hbs",
	})
);

// GET /profile/:id

app.get("/profile/:id", function (request, response) {
	const id = request.params.id;
	const profile = profiles.find((profile) => {
		if (profile.id.toString() == parseInt(id)) {
			return profile;
		}
	});

	const model = {
		moviesSuggestion: profile.suggestions,
		moviesSuggestionBis: profile.suggestionsBis,
		genre: profile.interest,
	};
	response.render("profile.hbs", model);
});

// GET /profiles
app.get("/profiles", function (request, response) {
	const model = {
		profiles: profiles,
	};
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

app.listen(8080); //Server PORT

const Handlebars = require("handlebars");

Handlebars.registerHelper('replace', function( find, replace, options) {
    var string = options.fn(this);
    return string.replace( find, replace );
});

Handlebars.registerHelper('formatDate', function(datetime) {
	// take the first 10 characters of the date
	return datetime.substring(0, 10);
});