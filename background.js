function init(){

	console.log( "DEBUG: Background.js's init() started." );

	chrome.storage.sync.get({
		apiToken: ""
	}, function(items){
		apiToken = items.apiToken;
	
		if( apiToken.length == 0 ){
			chrome.browserAction.setBadgeText( {text:"!"} );
			chrome.browserAction.setBadgeBackgroundColor( {color:[179,58,58,255]} );
		}else{
			chrome.browserAction.setBadgeText( {text:""} );
		}
	});

	setInterval( pullProjects, 60000 );
}

function navigate( url ){

	chrome.tabs.query( {active: true, currentWindow: true }, function( tabs ){
		chrome.tabs.update( tabs[0].id, { url: url } );
	});
}

function pullProjects(){

	$.getJSON( apiURL + "projects?circle-token=" + apiToken, function( data, httpStatus ){
		console.log( "DEBUG: token=" + apiToken );
		console.log( "DEBUG: " + data.length );
	});
}

// handle searching specifically for CircleCI Docs (all, 1.0, 2.0, CCIE, or API)
function searchDocs( searchType, text, suggest){

	var suggestions = [];

	chrome.omnibox.setDefaultSuggestion( { description: docSections[ searchType ].defaultSuggestion } );

	if( searchType != "d" ){

		index.search( text, {
			filters: "version:" + docSections[ searchType ].filter,
			highlightPreTag:	"<match>",
			highlightPostTag:	"</match>",
			hitsPerPage:		5
		}, function searchDone( err, content ){

			if( err ){
			
				console.error( err );
				return;
			}

			for( var h in content.hits ){

				// DEBUG
				//console.log( content.hits[h] );

				if( content.hits[h]._highlightResult.hierarchy.lvl2 ){
					suggestions.push( { content: content.hits[h].url, description: "<dim>" + content.hits[h].hierarchy.lvl0 + " Docs - </dim>" + content.hits[h]._highlightResult.hierarchy.lvl1.value + ": " + content.hits[h]._highlightResult.hierarchy.lvl2.value } );
				}else{
					suggestions.push( { content: content.hits[h].url, description: "<dim>" + content.hits[h].hierarchy.lvl0 + " Docs - </dim>" + content.hits[h]._highlightResult.hierarchy.lvl1.value } );
				}
				suggest( suggestions );
			}
		});
	}else{

		index.search( text, {
			highlightPreTag:	"<match>",
			highlightPostTag:	"</match>",
			hitsPerPage:		5
		}, function searchDone( err, content ){

			if( err ){
			
				console.error( err );
				return;
			}

			for( var h in content.hits ){

				// DEBUG
				//console.log( content.hits[h] );

				// The following variable declaration and if block is needed due to this bug: https://github.com/circleci/circleci-docs/issues/1479
				var badAnchorCheck = content.hits[h].url.indexOf( "#nav-button" );
				if( badAnchorCheck != -1 ){
					content.hits[h].url = content.hits[h].url.substr( 0, badAnchorCheck );
				}

				if( content.hits[h]._highlightResult.hierarchy.lvl2 ){
					suggestions.push( { content: content.hits[h].url, description: "<dim>" + content.hits[h].hierarchy.lvl0 + " Docs - </dim>" + content.hits[h]._highlightResult.hierarchy.lvl1.value + ": " + content.hits[h]._highlightResult.hierarchy.lvl2.value } );
				}else{
					suggestions.push( { content: content.hits[h].url, description: "<dim>" + content.hits[h].hierarchy.lvl0 + " Docs - </dim>" + content.hits[h]._highlightResult.hierarchy.lvl1.value } );
				}

				suggest( suggestions );
			}
		});
	}

}



/*-----------------------------------------------------------------------------
 * Main
 *---------------------------------------------------------------------------*/

var apiToken = ""; // CircleCI API token - should be a user/personal token
var apiURL = "https://circleci.com/api/v1.1/";
var projects = []; // array of "project" objects containing projects the user follows on CircleCI

init();

// docSections
var docSections = {
	"d": {
		"filter": null,
		"defaultSuggestion": "Click Here to Open CircleCI Docs Homepage",
		"indexPage": "https://circleci.com/docs/"
	},
	"d1": {
		"filter": "1.0",
		"defaultSuggestion": "Click Here to Open CircleCI 1.0 Docs",
		"indexPage": "https://circleci.com/docs/1.0/"
	},
	"d2": {
		"filter": "2.0",
		"defaultSuggestion": "Click Here to Open CircleCI 2.0 Docs",
		"indexPage": "https://circleci.com/docs/2.0/"
	},
	"de": {
		"filter": "enterprise",
		"defaultSuggestion": "Click Here to Open CircleCI Enterprise Docs",
		"indexPage": "https://circleci.com/docs/enterprise/"
	},
	"da": {
		"filter": "api",
		"defaultSuggestion": "Click Here to Open CircleCI API Docs",
		"indexPage": "https://circleci.com/docs/api/v1-reference/"
	}
};

// Prepare the Algolia API client to search CircleCI Docs
var client = algoliasearch( "BH4D9OD16A", "851a2eaa13614d164b36370fba830a78" );
var index = client.initIndex( "circleci" );

// Omnibox Search - currently just searches CircleCI Docs
chrome.omnibox.onInputChanged.addListener( function( text, suggest ){

	var searchType = text.split(" ")[0];
	text = text.substring( searchType.length );

	switch( searchType ){
		case "d":
		case "d1":
		case "d2":
		case "de":
		case "da":
			searchDocs( searchType, text, suggest );
			break;
		default:
			chrome.omnibox.setDefaultSuggestion( { description: "Search type not recognized." } );
	}
});


// Omnibox Search - visit the URL of the slected suggestion
chrome.omnibox.onInputEntered.addListener( function( text, disposition ){

	var searchType = text.split(" ")[0];

	switch( searchType ){
		case "d":
		case "d1":
		case "d2":
		case "de":
		case "da":
			navigate( docSections[ searchType ].indexPage );
			break;
		default:
			navigate( text );
	}
});

chrome.runtime.onConnect.addListener(function(port){
	console.assert(port.name == "github");
	port.onMessage.addListener(function(msg){

		if(msg.request == "api-token"){
			port.postMessage({request: "api-token", response: apiToken});
		}
	});
});
