function addRepoPageItems(){

	// Start with a grey status indicator until we determine the project's build status
	$("div.repohead-details-container h1").append('<a class="cci" href="" title="This project is not built on CircleCI"><span class="default-build-status"></span></a>');

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

function genPageAction(){

	return `
	<li>
		<a class="cci btn btn-sm" href="#follow-ci" title="Follow this project on CircleCI">
			<img class="circleci-icon" src="${ chrome.runtime.getURL("circleci-icon.svg")}" /> <span>Follow</span>
		</a>
	</li>`;
}

function init(){

	addRepoPageItems();
	
	$.getJSON( apiURL + "project/github/" + project.org + "/" + project.repo + "/settings", function( data, httpStatus ){
		
		project.defaultBranch = data.default_branch;
		project.following = data.following;
		project.writable = data.scopes.includes("write-settings");
		project.building = data.has_usable_key;
		project.foss = data.oss;

		// Get build status if project is building on CircleCI
		if( project.building ){
			
			$.getJSON( apiURL + "project/github/" + project.org + "/" + project.repo + "/tree/" + project.defaultBranch, function( data ){
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
			
				$( "div.repohead-details-container h1 a.cci span" ).addClass( classStatus );
				$( "div.repohead-details-container h1 a.cci" ).attr({
					"href": "https://circleci.com/gh/" + project.org  + "/" + project.repo + "/tree/" + project.defaultBranch,
					"title": project.defaultBranch + " branch build status: " + classStatus + ". Click to visit project on CircleCI."
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
	apiToken = "";

	chrome.storage.sync.get({
		apiToken: ""
	}, function(items){
		apiToken = items.apiToken;
	});

	project = {
		org: window.location.pathname.split("/")[1],
		repo: window.location.pathname.split("/")[2],
		defaultBranch: "master", // asume master until told otherwise
		following: false,
		writable: false, // whether the user has write permission to the repo
		building: true, // whether the project is building on CircleCI
		foss: false
	};

$(document).ready(function(){

	init();

	$(document).on('pjax:end', function (t) {
		init();
	});

});
