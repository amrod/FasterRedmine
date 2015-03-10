
var key = "";
var rootUrl = "";
// var propagate = true;

var issueId = $("title").text();
issueId = issueId.substring(issueId.indexOf("#") + 1, issueId.indexOf(":"));


chrome.storage.local.get({
    key: ""
    }, function(items) {
        key = items.key;

        chrome.storage.sync.get({
            propagate: true,
            redmineUrl: ""
            }, function(items) {
               var propagate = items.propagate;
               rootUrl = items.redmineUrl;
               if ( rootUrl.slice(-1) !== "/" ) {
                   rootUrl = rootUrl + "/";
                }

                injectStatusDropdown(issueId, propagate);
        });

});


function injectStatusDropdown(issueId, propagate){
    var new_status_option = $("<select></select>").attr("id", "fast_issue_status_id");
    var real_status_option = $("#issue_status_id option");
    
    if (real_status_option.length == 1) {return;}

    real_status_option.each(function( index ) {
        new_status_option.append($(this).clone());    
    });

    $( ".attributes" ).find(".status").each(function( index ) {
        if( $(this).is("td") ) {
            $(this).text("");
            $(this).append(new_status_option);
        }
    }); 

    new_status_option.change(function() {

        var status_id = $("#fast_issue_status_id option:selected")[0].value
        var jsonData = createIssueUpdateHash(status_id);
        updateIssue(issueId, jsonData, reloadPageFunc);
        if (propagate) {
            getIssue(issueId, function(data){
                if (data.issue.parent.id) {
                    updateIssue(data.issue.parent.id, jsonData, reloadPageFunc);
                }
            });
        }
    });

}


function createIssueUpdateHash(statusId) {
    var jsonData = {
      "issue": {
        "status_id": statusId
        //"notes": "Automatically updated by FasterRedmine." 
      }
    }
    return JSON.stringify(jsonData);
}

function updateIssue(issueId, jsonData, callback) {
    var resturl = constructRedmineIssueRestURL(issueId);

    $.ajax({
        type: "PUT",
        url: resturl,
        data: jsonData,
        contentType: 'application/json', // format of request payload
        //dataType: 'json', // format of the response
        complete: function(jqXHR, textStatus) {callback()}
    })
}

function reloadPageFunc() {
    chrome.runtime.sendMessage({reload: true}, function(response) {
        //console.log(response.farewell);
    });
}

// chrome.runtime.onMessage.addListener(
// function(request, sender, sendResponse) {
// });

function constructRedmineIssueRestURL(issueId) {
    return rootUrl + "issues/" + issueId + ".json" + "?key=" + key;
}

function getIssue(issueId, callback){
    var resturl = constructRedmineIssueRestURL(issueId);

    $.ajax({
        type: "GET",
        url: resturl,
        //dataType: 'json', // format of the response
        success: function(data, textStatus, jqXHR) {
            //console.log("Succes: " + textStatus);
            //console.log(data);
            callback(data);
        },
        complete: function(jqXHR, textStatus) {
            //console.log("Complete: " + textStatus);
        }
    })

}
