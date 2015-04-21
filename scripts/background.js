
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    var options = "chrome-extension://" + chrome.runtime.id + "/options.html";
    var popup = "chrome-extension://" + chrome.runtime.id + "/popup.html";

    if (sender.tab || sender.url == options || sender.url == popup){ 

        if (request.reload) {
            chrome.storage.sync.get({
                reload: true
            }, function(items) {
                if (items.reload) {
                    reloadTab(sender.tab.id);
                }
            });

        } else if (request.requestPermission && request.origins) {
            requestPermission(request.origins, sendResponse);

        } else if (request.removePermission && request.origins) {
            removePermission(request.origins, sendResponse);
        
        } else if (request.hasPermission && request.origin) {
            hasPermission(request.origin, sendResponse );

        } else if (request.requestRefreshBrowserActionAllTabs) {
            refreshBrowserActionIconAllTabs();

        } else if (request.getContentVariables) {
            getContentVariables(sendResponse);
        }
    }

    // Must return true to send multiple responses, else only first response will be sent.
    return true;
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    
    if (changeInfo.status === 'complete') {
        refreshBrowserActionIcon(tab);
    }
});

chrome.permissions.onRemoved.addListener(function(permissions) {

    var currentdate = new Date();
    var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
    var opt = {
        type: "basic",
        title: "FasterRedmine",
        message: "The extension lost permission to access your Redmine app.\nTime: " + datetime,
        iconUrl: "icons/fast-redmine-128.png",
        buttons: [{title: "Reauthorize"}]
    };

    chrome.notifications.create("fasterredminelostpermission", opt, function(id) {});

});

chrome.notifications.onButtonClicked.addListener(reauthBtnClick);

function reauthBtnClick() {
    getContentVariables(function (vars){
        requestPermission(vars.redmineUrl, function() {});
    });

    chrome.notifications.clear("fasterredminelostpermission");
}

function getContentVariables(callback) {
    
    chrome.storage.local.get({
        key: ""
        }, function(items) {
            var key = items.key;

            chrome.storage.sync.get({
                propagate: true,
                redmineUrl: ""
                }, function(items) {
                   var propagate = items.propagate;
                   var redmineUrl = items.redmineUrl;
                   if ( redmineUrl.slice(-1) !== "/" ) {
                       redmineUrl = redmineUrl + "/";
                    }

                    callback({key: key, propagate: propagate, redmineUrl: redmineUrl});
                    
            });

    });
}

function refreshBrowserActionIconAllTabs() {
    chrome.tabs.query({}, function(arrayOfTabs) {
        for (var i = 0; i < arrayOfTabs.length; i++) {
            if (arrayOfTabs[i].status == "complete") {
                refreshBrowserActionIcon(arrayOfTabs[i]);
            }
        }
    });
}

function refreshBrowserActionIcon (tab) {

    var url = tab.url.split('#')[0]; // Exclude URL fragments

    hasPermission(url, function(granted){

        chrome.storage.sync.get({
            redmineUrl: "^$"
        }, function(items){
            re = RegExp(items.redmineUrl);
            
            if (!(re.test(url) && url !== "chrome://extensions")) {
                var paths = {"38": "icons/fast-redmine-bw-38.png"};

                chrome.browserAction.setIcon({tabId: tab.id, path: paths});

            }else if (granted) {
                var paths = {"38": "icons/fast-redmine-38.png"};

                chrome.browserAction.setIcon({tabId: tab.id, path: paths});
                injectScripts(tab.id);

            } else {
                var paths = {"19": "icons/fast-redmine-bw-blocked-19.png", "38": "icons/fast-redmine-bw-blocked-38.png"};

                chrome.browserAction.setIcon({tabId: tab.id, path: paths});
           }

           //chrome.browserAction.show(tab.id);

        });
    });
}

chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        chrome.tabs.create({ url: "chrome://extensions/?options=" + chrome.runtime.id });
    }else if(details.reason == "update"){
        //var thisVersion = chrome.runtime.getManifest().version;
        //console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
    }
});

function reloadTab(tabId){
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        chrome.tabs.reload(tabId);
    }); 
}

function requestPermission(urls, callback) {
    // Permissions must be requested from inside a user gesture, like a button's
    // click handler.

    //console.log("Requesting permissions for " + urls);

    if (urls.constructor !== Array) {
        urls = [urls]
    }

    chrome.permissions.request({
        permissions: [],
        origins: urls
    }, function(granted) {
        // The callback argument will be true if the user granted the permissions.
        if (granted) {
            callback({granted: true});
        } else {
            callback({granted: false});
        }
    });
}

function removePermission(urls, callback) {
    
    if (urls.constructor !== Array) {
        urls = [urls]
    }

    chrome.permissions.remove({
        permissions: [],
        origins: urls
    }, function(removed) {
        if (removed) {
            callback({removed: true});
        } else {
            callback({removed: false});
        }
    });

}

function hasPermission(url, callback){

    chrome.permissions.contains({
        permissions: ['contentSettings'],
        origins: [url]
      }, function(result) {
        if (result) {
            callback(true);
        } else {
            callback(false);
        }
    });
}

function injectScripts(tabId) {

    chrome.tabs.executeScript(tabId, {
        file: "scripts/jquery-1.11.2.min.js",
        runAt: "document_end"
    }, function(){
        chrome.tabs.executeScript(tabId, {
            file: "scripts/inject.js",
            runAt: "document_end"
        });
    });
}
