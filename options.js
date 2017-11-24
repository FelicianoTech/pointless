// Saves options to chrome.storage.sync.
function save_options() {
  var token = document.getElementById('token').value;
  chrome.storage.sync.set({
    apiToken: token
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });

	var bgJS = chrome.extension.getBackgroundPage();
	bgJS.init();
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
	  apiToken: ""
  }, function(items) {
    document.getElementById('token').value = items.apiToken;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
