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
}

function openOptions() {
    chrome.tabs.create({ url: "chrome://extensions/?options=" + chrome.runtime.id });
}


document.addEventListener('DOMContentLoaded', display);
document.getElementById('button').addEventListener('click', openOptions);
