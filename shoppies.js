// Initialize variables
var search_results = document.getElementById("search_results"); // Search results div
var input_search = document.getElementById("search_input"); // Search input
var nominations_div = document.getElementById("nominations"); // Nominations div
var apiKey = "4db33529"; // My personal API key
var url_omdb = "https://www.omdbapi.com/?apikey=" + apiKey + "&type=movie&s="; // URL for search request
var nominations_dict = {} // dictionary of user nominations
var shareable_link = document.getElementById("shareable_link"); // Shareable link input 
var url = "https://www.omdbapi.com/?apikey=4db33529&i="; // URL for parameter/cookie load
const urlParams = new URLSearchParams(window.location.search);
const nominationsParameter = urlParams.get("nominations") // Nominations in URL parameters
var pg = 1; // Current search results page
var nominations_cookie = getCookie("nominations_cookie"); // Get nominations cookie
var nominationsLoadIDs // Nominations to load
var nominations_dict_previous // Previous nominations for Undo
var number_of_pages; // Number of pages in results
var number_of_results // Number of movies in results
var clearModal = document.getElementById("clearModal"); // Clear modal element


// Functions
/// Perform search
function searchOMDb(page) {

    var searchQuery = input_search.value; // Get user search query
    if (searchQuery) {
        // Clear previous search results and add label to search results
        search_results.innerHTML = "";

        // Make request
        /// Create a request variable
        var request = new XMLHttpRequest()

        /// Open a new connection, using the GET method and the user search query
        request.open('GET', url_omdb + searchQuery + "&page=" + page)

        /// Function to run once request transaction completes successfully
        request.onload = function() {
            // If search results in an error, display error under search results
            if (JSON.parse(this.response).Error) {
                // Create error element and set it to response error, then append to search results
                var resultError = document.createElement("p");
                resultError.innerHTML = JSON.parse(this.response).Error;
                search_results.appendChild(resultError);
            }

            // If search does not raise an error, get search results and display them under search results
            else {
                var results_data = JSON.parse(this.response).Search; // Search results
                number_of_results = JSON.parse(this.response).totalResults
                number_of_pages = Math.ceil(number_of_results / 10);

                // For each movie in the results object
                results_data.forEach((movie) => {
                    var resultItem = document.createElement("li"); // Create list item for movie
                    var resultText = document.createElement("div")
                    //resultText.classList.add("list-name");
                    resultText.innerHTML = movie.Title + " (" + movie.Year + ")"; // Set result item text to include movie title and year
                    resultItem.id = movie.imdbID; // Set result element id to its imdbID for later references
                    // Add button to nominate film          
                    var nomination_button = document.createElement("button");
                    nomination_button.innerHTML = "Nominate"
                    nomination_button.classList.add("list-button");
                    nomination_button.setAttribute('onclick', 'nominate("' + movie.Title + '","' + movie.Year + '","' + movie.imdbID + '")')
                    // If movie has been nominated, disable nominate button
                    if (movie.imdbID in nominations_dict) {
                        nomination_button.disabled = true;
                    }

                    resultItem.appendChild(resultText);
                    resultItem.appendChild(nomination_button);
                    search_results.appendChild(resultItem);
                })

                // If in the first page, hide previous button and show next button
                if (page == 1) {
                    document.getElementById("previous").hidden = true;
                }

                if (page < number_of_pages) {
                    document.getElementById("next").hidden = false;

                }

                pg = page;

                document.getElementById("page").innerHTML = "Page " + pg + " of " + number_of_pages;

                var resultsLabel = document.getElementById("results_header");
                resultsLabel.innerHTML = "Results for <b>" + searchQuery + "</b>"
                var number_of_results_div = document.getElementById("number_of_results")
                number_of_results_div.innerHTML = "(showing " + (1 + (page - 1) * 10) + "-" + Math.min(number_of_results, page * 10) + " of " + number_of_results + ")";
            }
        }

        // Send request
        request.send()

        document.getElementById("search_placeholder").hidden = true; // Hide nominations container placeholder text

    }

}


// Function to nominate a movie
function nominate(title, year, id) {
    var number_of_nominations = Object.keys(nominations_dict).length; // Number of nominations
    document.getElementById("clear_nominations").hidden = false;
    // If number is 5, prevent user from adding more
    if (number_of_nominations == 5) {
        window.alert("You have already nominated 5 movies!")
    }
    // Otherwise, add movie to nominations and reload list of nominations
    else {
        nominations_dict_previous = JSON.parse(JSON.stringify(nominations_dict));
        nominations_dict[id] = {
            "Title": title,
            "Year": year
        };

        load_nominations()

        // Disable nominate button on the list of movies
        var nominationSearchItem = document.getElementById(id);
        nominationSearchItem.getElementsByTagName("button")[0].disabled = true;
    }

}


// Function to load and display nominations in the nominations div, based on user nominations
function load_nominations() {
    var number_of_nominations = Object.keys(nominations_dict).length; // Number of nominations
    document.getElementById("nominations_placeholder").hidden = true; // Hide nominations container placeholder text

    // Show/Hide nominations banner and placeholder depending on number of nominations
    if (number_of_nominations < 5) {

        // If number of nominations is less than 5, do not show max nominations banner 
        document.getElementById("max_nominations").hidden = true;
        document.getElementById("undo_clear").hidden = true;
        document.getElementById("share_nominations").hidden = true;

        // If number of nominations = 0, show placeholder text for nominations
        if (number_of_nominations == 0) {
            document.getElementById("nominations_placeholder").hidden = false;
            document.getElementById("clear_nominations").hidden = true;
        }
    } else {
        // If user has nominated 5 movies, show maximum nominations banner
        document.getElementById("max_nominations").hidden = false;
        document.getElementById("share_nominations").hidden = false;

    }

    // Clear list of nominations so they can be loaded
    nominations_div.innerHTML = "";
    // For each movie in the list of nominations, display movie in nominations container
    for (var imdbID in nominations_dict) {
        var nominationItem = document.createElement("li");
        var nominationText = document.createElement("div")
        //nominationText.classList.add("list-name");

        nominationText.innerHTML = nominations_dict[imdbID].Title + " (" + nominations_dict[imdbID].Year + ")"; // Add text to nomination item

        // Add button to remove nomination
        var nominationRemoveButton = document.createElement("button");
        nominationRemoveButton.innerHTML = "Remove";
        nominationRemoveButton.classList.add("list-button");
        nominationRemoveButton.setAttribute('onclick', 'remove("' + imdbID + '")');

        nominationItem.appendChild(nominationText);
        nominationItem.appendChild(nominationRemoveButton);
        nominations_div.appendChild(nominationItem);

    }

    shareable_link.hidden = true;

    // Create shareable link    
    //document.getElementById("complete_link").href = "shoppies.html?nominations=" + Object.keys(nominations_dict)


    // Update nominations bars (1-5)
    fill_color = "#008060" // Nominations fill color
    if (number_of_nominations == 5) {
        fill_color = "#02b588" // If 5 nominations have been made, color is lighter
    }
    for (i = 0; i < number_of_nominations; i++) {
        document.getElementById("bar" + (i + 1)).style.backgroundColor = fill_color;
    } // Color number of bars that have been nominated

    for (i = 5; i > number_of_nominations; i--) {
        document.getElementById("bar" + (i)).style.backgroundColor = "#EEE";
    } // Color number of bars that have not been nominated in grey

    // Set nominations in cookies
    document.cookie = "nominations_cookie=" + Object.keys(nominations_dict)
}

// Function to remove a nomination
function remove(id) {
    var nominationSearchItem = document.getElementById(id);
    if (nominationSearchItem) {
        nominationSearchItem.getElementsByTagName("button")[0].disabled = false;
    }
    // Delete nomination from nomination objects and reload nominations
    delete nominations_dict[id];
    load_nominations();
}

// Function to copy shareable link
function copyShareableLink() {
    // Create link    
    shareable_link.value = "https://ericamatulis.github.io/shoppies.html?nominations=" + Object.keys(nominations_dict)

    // Copy link
    shareable_link.hidden = false;
    var copyLinkText = document.getElementById("shareable_link");
    copyLinkText.select();
    copyLinkText.setSelectionRange(0, 99999); /* For mobile devices */
    document.execCommand("copy");
    shareable_link.hidden = true;

    // Pop up success message
    var shareable_popup = document.getElementById("shareablelink_popup");
    shareable_popup.classList.toggle("show");
    document.getElementById("max_nominations").classList.toggle("disabled");
    setTimeout(function() {
        shareable_popup.classList.toggle("show");
        document.getElementById("max_nominations").classList.toggle("disabled");
    }, 1000);

}

// Clear nominations
function clear_nominations() {
    nominations_dict_previous = JSON.parse(JSON.stringify(nominations_dict));
    load_nominations()
    for (var key in nominations_dict) {
        remove(key)
    }
    document.getElementById("undo_clear").hidden = false;
    document.getElementById("clear_nominations").hidden = true;
}

// Undo Clear
function undo_clear() {
    nominations_dict = JSON.parse(JSON.stringify(nominations_dict_previous));
    load_nominations()
    document.getElementById("undo_clear").hidden = true;
    document.getElementById("clear_nominations").hidden = false;
}

// Go to next results page
function nextPage() {
    pg = pg + 1
    searchOMDb(pg)
    document.getElementById("previous").hidden = false;
    if (pg >= number_of_pages) {
        document.getElementById("next").hidden = true;
    }
    document.getElementById("page").innerHTML = "Page " + pg;

}

// Go to previous results page
function previousPage() {
    pg = pg - 1
    searchOMDb(pg)
    document.getElementById("next").hidden = false;
    if (pg <= 1) {
        document.getElementById("previous").hidden = true;
    }
    document.getElementById("page").innerHTML = "Page " + pg;

}

// Get cookie by cookie name
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}



// Event listeners
/// Search results upon enter
input_search.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("search_button").click();
    }
});

/// When the user clicks anywhere outside of the clear modal, close it
window.onclick = function(event) {
    if (event.target == clearModal) {
        clearModal.style.display = "none";
    }
}





// Load shareable link parameters
if (nominationsParameter || nominations_cookie != "") {
    if (nominationsParameter) {
        nominationsLoadIDs = nominationsParameter.split(",")
    } else {
        nominationsLoadIDs = nominations_cookie.split(",")
    }

    for (var i = 0; i < nominationsLoadIDs.length; i++) {
        nominationsLoadIDs[i] = url + nominationsLoadIDs[i];
    }
    requests = nominationsLoadIDs.map(url => fetch(url));

    Promise.all(requests)
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(movies => movies.forEach(movies => nominations_dict[movies.imdbID] = {
            "Title": movies.Title,
            "Year": movies.Year
        }))
        .then(nominations => load_nominations());

    document.getElementById("clear_nominations").hidden = false;


}





