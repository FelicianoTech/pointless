function init(){

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

}

function navigate( url ){

	chrome.tabs.query( {active: true, currentWindow: true }, function( tabs ){
		chrome.tabs.update( tabs[0].id, { url: url } );
	});
}

// Handle search logic specific to CircleCI Docs
function searchDocs( searchType, text, suggest){

	var suggestions = [];

	chrome.omnibox.setDefaultSuggestion({ description: "CircleCI Docs results:" });

	docsIndex.search( text, {
		hitsPerPage:			7,
		attributesToRetrieve:	[ 'title', 'url' ],
		filters: "collection:cci2",
	}).then(({ hits }) => {
		hits.forEach(function( hit ){
			suggestions.push({ content: "https://circleci.com/docs" + hit.url, description: "<dim>" + hit.title + "</dim>" });
		});

		suggest( suggestions );
	});
}

// Handle search logic specific to CircleCI Orbs
function searchOrbs( searchType, text, suggest){

	var suggestions = [];

	chrome.omnibox.setDefaultSuggestion({ description: "CircleCI Orb Registry results:" });

		orbIndex.search( text, {
			hitsPerPage:		7,
			attributesToRetrieve: [ 'objectID', 'url' ],
		}).then(({ hits }) => {

			hits.forEach(function( hit ){
				suggestions.push( { content: hit.url, description: "<dim>" + hit.objectID + "</dim>" } );
			});

			suggest( suggestions );
		});
}



/*-----------------------------------------------------------------------------
 * Main
 *---------------------------------------------------------------------------*/

var apiToken = "";

init();

// Setup Algolia v4 JavaScript client
//import algoliasearch from 'algoliasearch/lite';
const client = algoliasearch( "U0RXNGRK45", "7fb53cd578f887582b8e3085221a4f65" );
const docsIndex = client.initIndex( "documentation" );
const orbIndex = client.initIndex( "orbs-prod" );

// Omnibox Search - currently searches CircleCI Docs and Orbs
chrome.omnibox.onInputChanged.addListener( function( text, suggest ){

	var searchType = text.split(" ")[0];
	text = text.substring( searchType.length );

	switch( searchType ){
		case "d":
		// the old docs options below are kept for backwards compatibility
		// remove sometime after June 2020 
		case "d1":
		case "d2":
		case "de":
		case "da":
			searchDocs( searchType, text, suggest );
			break;
		case "o":
			searchOrbs( searchType, text, suggest );
			break;
		default:
			chrome.omnibox.setDefaultSuggestion( { description: "Search type not recognized." } );
	}
});


// Omnibox Search - visit the URL of the slected suggestion
chrome.omnibox.onInputEntered.addListener( function( text, disposition ){
	navigate( text );
});

chrome.runtime.onConnect.addListener(function(port){
	console.assert(port.name == "github");
	port.onMessage.addListener(function(msg){

		if(msg.request == "api-token"){
			port.postMessage({request: "api-token", response: apiToken});
		}
	});
});
