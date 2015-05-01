// Saves options to chrome.storage.sync.
function saveOptions() {

    var key = document.getElementById('key').value;
    var redmineUrl = document.getElementById('redmineUrl').value;
    var atom_feed = document.getElementById('atom_feed').value;
    var propagate = document.getElementById('propagate').checked;
    var reload = document.getElementById('reload').checked;

    if ( redmineUrl.slice(-1) !== "/" ) {
        redmineUrl = redmineUrl + "/";
    }
    
    if (!isValidURL(redmineUrl)) {
        notifyUser('Invalid Redmine URL. Please enter the root domain only. e.g. https://redmine.mycompany.com/');
        return;
    }
    
    if  (atom_feed.trim().length > 0 && !isValidURL(atom_feed)) {
        notifyUser('Invalid Atom feed URL. Please enter a URL of the form: https://rm.myco.com/projects/1/issues.atom?key=123ABC&query_id=123');
        return;
    }
    /** Remove permissions to any current Redmine URL */
    chrome.runtime.sendMessage({getContentVariables: true}, function(contentVars) {
        if (isValidURL(contentVars.redmineURL))
        {
            chrome.runtime.sendMessage({removePermission: true, origins: contentVars.redmineURL}, function(response) {});
        }
    }); 

    chrome.storage.sync.set({     
        propagate: propagate,
        redmineUrl: redmineUrl,
        reload: reload,
        atom_feed: atom_feed
    }, function() {
        // Store key locally
        chrome.storage.local.set({key: key}, notifyUser);
    });
  
    chrome.runtime.sendMessage({requestPermission: true, origins: [redmineUrl]}, function(response) {
        console.log("options.js::saveOptions::sendMessage: requestPermission; response.granted = " + response.granted);
        if (response.granted) {
            notifyUser('Access to ' + redmineUrl + ' granted.');
            refreshBrowserActionIconAllTabs();
        } else {
            notifyUser('Permission not granted. Extension WILL NOT function on these domains.');
        }
    });
}

function isValidURL(url) {
    var re = /^https?:\/\/((www\.)?[-a-zA-Z0-9:%._\+~#=]{2,256}\.[a-z]{2,4}\b(\/)$|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\,\d{1,3})/gi;
    
    if (!re.test(url))
        return false;
    else
        return true;
 
}

function refreshBrowserActionIconAllTabs() {
    chrome.runtime.sendMessage({requestRefreshBrowserActionAllTabs: true}, function(response) {
      // Do nothing else
    });
}

function notifyUser(msg) {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    
    status.textContent = 'Options saved.';
    console.log("Options saved. | " + msg);
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
    redmineUrl: '',
    atom_feed: ''
  }, function(items) {
    document.getElementById('propagate').checked = items.propagate;
    document.getElementById('reload').checked = items.reload;
    document.getElementById('redmineUrl').value = items.redmineUrl;
    document.getElementById('atom_feed').value = items.atom_feed;
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
