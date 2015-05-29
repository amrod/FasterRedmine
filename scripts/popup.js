function display() {
    
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        
        chrome.runtime.sendMessage({hasPermission: true, origin: arrayOfTabs[0].url}, function(granted) {
            var msgdiv = document.getElementById("message");

            //console.log("hasPermission response = " + granted);

            if (granted) {
                msgdiv.textContent = "Enabled on this site.";
            } else {
                msgdiv.textContent = "Permissions NOT granted for this site. Go to options to grant access.";
            }      
        });
    });

    chrome.runtime.sendMessage({updateBadge: true}, function(entries) {
        var cardsSection = document.getElementById("allcards");
        var len = entries.length;
        var html = "";
        var url;
        for (var i = 0; i < len; i++) {
            url = "<a href=\"" + entries[i].url + "\">" + entries[i].url + "</a>";
            html += createCard(entries[i].title, url);           
        }
        console.log(entries[0].title);
        console.log(entries[0].url);
        cardsSection.innerHTML = html;
    }); 

}

function createCard(title, subtitle){
    var html = "<section class=\"card\"> \
                <h1>%%title%%</h1> \
                <h2>%%subtitle%%</h2> \
                </section>\n";

    return html.replace("%%title%%", title).replace("%%subtitle%%", subtitle)
}

function openOptions() {
    chrome.tabs.create({ url: "chrome://extensions/?options=" + chrome.runtime.id });
}


document.addEventListener('DOMContentLoaded', display);
document.getElementById('button').addEventListener('click', openOptions);
