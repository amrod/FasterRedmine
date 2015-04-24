function FasterRemine() {}

FasterRemine.prototype.setApiKey(key) {
    this.key = key;
}

FasterRedmine.prototype.setPropagateFlag = function(value) {
    this.propagate = value;
}

FasterRedmine.prototype.setRedmineUrl = function(url) {
    this.redmineUrl = url;
}

FasterRedmine.prototype.setAtomUrl = function(url) {
    this.atomUrl = url;
}

FasterRedmine.prototype.loadConfig = function(config) {
    this.setApiKey(config.key);
    this.setPropagateFLag(config.propagate);
    this.setRedmineUrl(config.redmineUrl);
    this.setAtomUrl(config.atomUrl);
}

FasterRedmine.prototype.reauthBtnClick = function() {
    getContentVariables(function (vars){
        requestPermission(vars.redmineUrl, function() {});
    });

    chrome.notifications.clear("fasterredminelostpermission");
}

FasterRedmine.prototype.getContentVariables = function(callback) {
    
    chrome.storage.local.get({
        key: ""
        }, function(items) {
            var key = items.key;

            chrome.storage.sync.get({
                propagate: true,
                redmineUrl: "",
                atom_feed: ""
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

FasterRedmine.prototype.refreshBrowserActionIconAllTabs = function() {
    chrome.tabs.query({}, function(arrayOfTabs) {
        for (var i = 0; i < arrayOfTabs.length; i++) {
            if (arrayOfTabs[i].status == "complete") {
                refreshBrowserActionIcon(arrayOfTabs[i]);
            }
        }
    });
}

FasterRedmine.prototype.refreshBrowserActionIcon = function(tab) {

    var url = tab.url.split('#')[0]; // Exclude URL fragments

    hasPermission(url, function(granted){

        chrome.storage.sync.get({
            redmineUrl: "^$"
        }, function(items){
            re = RegExp(items.redmineUrl);
            
            if (!(re.test(url) && url !== "chrome://extensions")) {
                var paths = {"38": "icons/fast-redmine-bw-38.png"};

                chrome.browserAction.setIcon({tabId: tab.id, path: paths}, runtimeLastErrorCallback);

            }else if (granted) {
                var paths = {"38": "icons/fast-redmine-38.png"};

                chrome.browserAction.setIcon({tabId: tab.id, path: paths}, runtimeLastErrorCallback);
                injectScripts(tab.id);

            } else {
                var paths = {"19": "icons/fast-redmine-bw-blocked-19.png", "38": "icons/fast-redmine-bw-blocked-38.png"};

                chrome.browserAction.setIcon({tabId: tab.id, path: paths, runtimeLastErrorCallback});
           }

           //chrome.browserAction.show(tab.id);

        });
    });
}

FasterRedmine.prototype.runtimeLastErrorCallback = function() {
    if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
    } else {
        // Tab exists
    }
}

FasterRedmine.prototype.reloadTab = function(tabId){
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        chrome.tabs.reload(tabId);
    }); 
}

FasterRedmine.prototype.requestPermission = function(urls, callback) {
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

FasterRedmine.prototype.removePermission = function(urls, callback) {
    
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

FasterRedmine.prototype.hasPermission = function(url, callback){

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

FasterRedmine.prototype.injectScripts = function(tabId) {

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

FasterRedmine.prototype.getAtomFeed = function(url, callback) {

    var feed;
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'xml', // format of the response
        success: function(data, textStatus, jqXHR) {
            //console.log("Succes: " + textStatus);
            //feed = data;
            //console.log(data);
            callback(data);
        },
        complete: function(jqXHR, textStatus) {
            //console.log("Complete: " + textStatus);
        }
    });
}

FasterRedmine.prototype.updateBadge = function(tabId) {
    
}
