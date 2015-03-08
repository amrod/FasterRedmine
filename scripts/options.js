// Saves options to chrome.storage.sync.
function saveOptions() {

  var key = document.getElementById('key').value;
  var redmineUrl = document.getElementById('redmineUrl').value;
  var propagate = document.getElementById('propagate').checked;
  var reload = document.getElementById('reload').checked;

  if ( redmineUrl.slice(-1) !== "/" ) {
      redmineUrl = redmineUrl + "/";
  }

  var re = /^https?:\/\/(www\.)?[-a-zA-Z0-9:%._\+~#=]{2,256}\.[a-z]{2,4}\b(\/)$/g;
  
  if (!re.test(redmineUrl)) {
    notifyUser('Invalid URL. Please enter the root domain only. e.g. https://regmine.mycompany.com/');
    return;
  }

  chrome.storage.sync.set({
    propagate: propagate,
    redmineUrl: redmineUrl,
    reload: reload
  }, function() {
    // Store key locally
    chrome.storage.local.set({
      key: key
    }, notifyUser);
  });

  chrome.runtime.sendMessage({requestPermission: true, origins: [redmineUrl]}, function(response) {
      if (response.granted) {
          notifyUser('Access to ' + redmineUrl + ' granted.');
          refreshPageActionIconAllTabs();
      } else {
          notifyUser('Permission not granted. Extension WILL NOT function on these domains.');
      }
  });
}

function refreshPageActionIconAllTabs() {
    chrome.runtime.sendMessage({requestRefreshPageActionAllTabs: true}, function(response) {
      // Do nothing else
    });
}

function hasPermission(url){
    chrome.permissions.contains({
        permissions: ['contentSettings'],
        origins: [url]
      }, function(result) {
        if (result) {
            //console.log("hasPermission(" + url +"): true");
        } else {
            //console.log("hasPermission(" + url +"): false");
        }
    });
}

function notifyUser(msg) {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    
    status.textContent = 'Options saved.';
    setTimeout(function() {

      if (msg) {
        status.textContent = msg;
        setTimeout(function() {
          status.textContent = '';
          status.innerHTML = '<br>';
        }, 5000);
      } else {
        status.textContent = '';
        status.innerHTML = '<br>';
      }
      
    }, 750);
} 

// Restores state using the preferences stored in chrome.storage.sync and .local
function restoreOptions() {
  chrome.storage.sync.get({
    propagate: true,
    reload: true,
    redmineUrl: ''
  }, function(items) {
    document.getElementById('propagate').checked = items.propagate;
    document.getElementById('reload').checked = items.reload;
    document.getElementById('redmineUrl').value = items.redmineUrl;
  });

  chrome.storage.local.get({
    key: ''
  }, function(items) {
    document.getElementById('key').value = items.key;
  });
}

function clearPermissions() {

  //console.log("Clearing permissions");

  chrome.storage.sync.get({
    redmineUrl: ""
  }, function(items) {
    
    document.getElementById('redmineUrl').value = items.redmineUrl;
    
    if (items.redmineUrl !== "") {
    
      chrome.runtime.sendMessage({removePermission: true, origins: [items.redmineUrl]}, function(response) {
        //console.log("Response returned by background.js: " + response);

        if (response.removed) {
            chrome.storage.sync.set({
              redmineUrl: ""
            });

            document.getElementById('redmineUrl').value = "";
            notifyUser('Access to ' + items.redmineUrl + ' REMOVED.');

        } else {
            notifyUser('There was a problem, access to ' + items.redmineUrl + ' could NOT be removed.');
        }
      });  
     } 
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('clear').addEventListener('click', clearPermissions);