function addRepoPageItems(){

	if( $( "h1 svg.octicon-repo ~ strong[itemprop='name'] + a.cci, h1 svg.octicon-lock ~ strong[itemprop='name'] + a.cci" ).length == 0 ){
	
		// Start with a grey status indicator until we determine the project's build status
		$("h1 svg.octicon-repo ~ strong[itemprop='name'], h1 svg.octicon-lock ~ strong[itemprop='name']").after('<a class="cci status-dot" href="" title="This project is not built on CircleCI"><span class="default-build-status"></span></a>');
	}

	if( $( ".cci.btn" ).length == 0 ){

		// start with a follow button until we determine if we're actually following this project
		$("ul.pagehead-actions").prepend(genPageAction);
		$( ".cci.btn" ).click(function( e ){
		
			if( apiToken.length == 0 ){
				alert( "Your CircleCI API token must be set in Pointless' Options page to use this feature." );
				return
			}

			const followConfirm = "Are you sure you want to follow this project on CircleCI?";
			const unFollowConfirm = "Are you sure you want to stop following this project? If you are the last person following, the project will stop building. Continue?";
			const firstFollowConfirm = "This will start building this project on CircleCI with you following the project. Are you sure?";
			const cantFollowAlert = "You do not have the proper permissions to follow this project.";

			if( project.following ){
		
				if( confirm( unFollowConfirm ) == true ){
					$.post( apiURL + "project/github/" + project.org + "/" + project.repo + "/unfollow?circle-token=" + apiToken, function( data ){

						$( ".cci.btn span" ).text( "Follow" );
						$( ".cci.btn" ).attr( "title", "Follow this project on CircleCI." );
						alert( "You have successfully unfollowed " + project.org + "/" + project.repo + "." );
					});
				}
			} else{
				if( project.writable ){

					if( confirm( followConfirm ) == true ){
						$.post( apiURL + "project/github/" + project.org + "/" + project.repo + "/follow?circle-token=" + apiToken, function( data ){

							$( ".cci.btn span" ).text( "Unfollow" );
							$( ".cci.btn" ).attr( "title", "Unfollow this project on CircleCI." );
							alert( "You have successfully followed " + project.org + "/" + project.repo + "." );
						});
					}
				} else{
					alert( cantFollowAlert );
				}
			}

			e.preventDefault();
		});
	}
}

function genPageAction(){

	return `
	<li>
		<a class="cci btn btn-sm" href="#follow-ci" title="Follow this project on CircleCI">
			<img class="circleci-icon" src="${ chrome.runtime.getURL("circleci-icon.svg")}" /> <span>Follow</span>
		</a>
	</li>`;
}

function getAPIToken(){

	port = chrome.runtime.connect( {name: "github"} );
	port.postMessage( {request: "api-token"} );
	port.onMessage.addListener( function( msg ){
		if( msg.request == "api-token"){
			apiToken = msg.response;

			initGitHub();
		}
	});
}

function initGitHub(){

	addRepoPageItems();
	
	$.getJSON( apiURL + "project/github/" + project.org + "/" + project.repo + "/settings?circle-token=" + apiToken, function( data, httpStatus ){
		
		project.defaultBranch = data.default_branch;
		project.following = data.following;
		// The below line is broken. Temp removing it.
		//project.writable = data.scopes.includes("write-settings");
		project.building = data.has_usable_key;
		project.foss = data.oss;

		// Get build status if project is building on CircleCI
		if( project.building ){

			// Choose branch based on contex
			var curBranch = "";
			// if we're on the main page, viewing a non-default branch
			if( window.location.pathname.split("/")[3] == "tree" ){
				curBranch = window.location.pathname.split("/")[4];
			// base branch detection for PRs is causing problems with GitHub's new UI. For now, we'll disable and just use the default.
			//}else if( window.location.pathname.split("/")[3] == "pull" ){
			//	curBranch = $( "div.TableObject-item--primary a.author + span.commit-ref span.css-truncate-target" ).text();
			}else{
				curBranch = project.defaultBranch;
			}
			
			$.getJSON( apiURL + "project/github/" + project.org + "/" + project.repo + "/tree/" + curBranch + "?circle-token=" + apiToken, function( data ){
				lastBuild = data[0].status;
	
				// check build status of last build that completed
				var classStatus;

				switch( lastBuild ){
					case "success":
					case "fixed":
						classStatus = "passed";
						break;

					case "failed":
					case "timedout":
						classStatus = "failed";
						break;

					case "running":
						classStatus = "running";
						break;

					default:
						classStatus = "error";
				}
			
				$( "h1 svg.octicon-repo ~ a.cci span, h1 svg.octicon-lock ~ a.cci span" ).addClass( classStatus );
				$( "h1 svg.octicon-repo ~ a.cci, h1 svg.octicon-lock ~ a.cci" ).attr({
					"href": "https://app.circleci.com/pipelines/github/" + project.org  + "/" + project.repo + "?branch=" + curBranch,
					"title": curBranch + " branch build status: " + classStatus + ". Click to visit project on CircleCI."
				});
			});
		}

		// update CircleCI pagehead-action with following status if needed
		if( project.following ){
			$( ".cci.btn span" ).text( "Unfollow" );
			$( ".cci.btn" ).attr( "title", "Unfollow this project on CircleCI." );
		}else if( !project.writable  && !project.foss ){
			$( ".cci.btn" ).attr( "title", "You do not have permission to follow this project on CircleCI." );
		}else{
			$( ".cci.btn" ).attr( "title", "Follow this project on CircleCI." );
		}
	})
}

	apiURL = "https://circleci.com/api/v1.1/";

	project = {
		org: window.location.pathname.split("/")[1],
		repo: window.location.pathname.split("/")[2],
		defaultBranch: "master", // asume master until told otherwise
		following: false,
		writable: false, // whether the user has write permission to the repo
		building: true, // whether the project is building on CircleCI
		foss: false
	};


var port;
var apiToken;

$(document).ready(function(){


	getAPIToken();

	$(document).on('pjax:end', function (t) {
		initGitHub();
	});

});
