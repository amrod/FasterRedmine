var key = "";
var rootUrl = "";
var propagate = true;

chrome.storage.local.get({
    key: ""
    }, function(items) {
       key = items.key;
});

chrome.storage.sync.get({
    propagate: true,
    redmineUrl: ""
    }, function(items) {
       propagate = items.propagate;
       rootUrl = items.redmineUrl;
       if ( rootUrl.slice(-1) !== "/" ) {
           rootUrl = rootUrl + "/";
        }
});

var issueId = $("title").text();
issueId = issueId.substring(issueId.indexOf("#") + 1, issueId.indexOf(":"));

var status_option = $("<select></select>").attr("id", "fast_issue_status_id");

status_option.change(function() {

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

$("#issue_status_id option").each(function( index ) {
    status_option.append($(this).clone());    
});

$( ".attributes" ).find(".status").each(function( index ) {
    if( $(this).is("td") ) {
        $(this).text("");
        $(this).append(status_option);
    }
});

function createIssueUpdateHash(statusId) {
    var jsonData = {
      "issue": {
        "status_id": statusId
        //"notes": "Automatically updated by FastRedmine." 
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
