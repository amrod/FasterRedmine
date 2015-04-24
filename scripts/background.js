var apiKey;
var propagate;
var redmineUrl;
var atomUrl;

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
    
    if (changeInfo.status === 'loading') {
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

chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        chrome.tabs.create({ url: "chrome://extensions/?options=" + chrome.runtime.id });
    }else if(details.reason == "update"){
        //var thisVersion = chrome.runtime.getManifest().version;
        //console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
    }
});


