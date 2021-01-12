// Initialize variables
var search_results = document.getElementById("search_results"); // Search results div
var input_search = document.getElementById("search_input"); // Search input
var nominations_div = document.getElementById("nominations"); // Nominations div
var apiKey = "4db33529"; // My personal API key
var url_omdb = "https://www.omdbapi.com/?apikey=" + apiKey + "&type=movie&s="; // URL for search request
var nominations_dict = {} // dictionary of user nominations
var shareable_link = document.getElementById("shareable_link"); // Shareable link input 
var url = "https://www.omdbapi.com/?apikey=4db33529&i=";
const urlParams = new URLSearchParams(window.location.search);
const nominationsParameter = urlParams.get("nominations")


// Functions
/// Perform search
function searchOMDb() {

    var searchQuery = input_search.value; // Get user search query

    // Clear previous search results and add label to search results
    search_results.innerHTML = "";
    var resultsLabel = document.getElementById("results_header");
    resultsLabel.innerHTML = "Results for <b>" + searchQuery + "</b>";

    // Make request
    /// Create a request variable
    var request = new XMLHttpRequest()

    /// Open a new connection, using the GET method and the user search query
    request.open('GET', url_omdb + searchQuery)

    /// Function to run once request transaction completes successfully
    request.onload = function() {
        // If search results in an error, display error under search results
        if (JSON.parse(request.response).Error) {
            // Create error element and set it to response error, then append to search results
            var resultError = document.createElement("p");
            resultError.innerHTML = JSON.parse(request.response).Error;
            search_results.appendChild(resultError);
        }

        // If search does not raise an error, get search results and display them under search results
        else {
            var results_data = JSON.parse(this.response).Search; // Search results

            // For each movie in the results object
            results_data.forEach((movie) => {
                var resultItem = document.createElement("li"); // Create list item for movie
                resultItem.innerHTML = movie.Title + " (" + movie.Year + ")"; // Set result item text to include movie title and year
                resultItem.id = movie.imdbID; // Set result element id to its imdbID for later references
                // Add button to nominate film          
                var nomination_button = document.createElement("button");
                nomination_button.innerHTML = "Nominate"
                nomination_button.style.float = "right"
                nomination_button.setAttribute('onclick', 'nominate("' + movie.Title + '","' + movie.Year + '","' + movie.imdbID + '")')
                // If movie has been nominated, disable nominate button
                if (movie.imdbID in nominations_dict) {
                    nomination_button.disabled = true;
                }

                resultItem.appendChild(nomination_button);

                search_results.appendChild(resultItem);
            })


        }
    }

    // Send request
    request.send()
}


// Function to nominate a movie
function nominate(title, year, id) {
    var number_of_nominations = Object.keys(nominations_dict).length; // Number of nominations
    // If number is 5, prevent user from adding more
    if (number_of_nominations == 5) {
        window.alert("You have already nominated 5 movies!")
    }
    // Otherwise, add movie to nominations and reload list of nominations
    else {
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
    if (number_of_nominations < 5) {
        document.getElementById("max_nominations").hidden = true;
    } else {
        document.getElementById("max_nominations").hidden = false;
    }
    // Clear list of nominations so they can be loaded
    nominations_div.innerHTML = "";
    // For each movie in the list of nominations, display movie in nominations container
    for (var imdbID in nominations_dict) {
        var nominationItem = document.createElement("li");

        nominationItem.innerHTML = nominations_dict[imdbID].Title + " (" + nominations_dict[imdbID].Year + ")"; // Add text to nomination item

        // Add button to remove nomination
        var nominationRemoveButton = document.createElement("button");
        nominationRemoveButton.innerHTML = "Remove";
        nominationRemoveButton.style.float = "right";
        nominationRemoveButton.setAttribute('onclick', 'remove("' + imdbID + '")');

        nominationItem.appendChild(nominationRemoveButton);
        nominations_div.appendChild(nominationItem);

    }

    shareable_link.hidden = true;

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
    shareable_link.value = "file:///Users/ericamatulis/Documents/Personal Development/GitHub/the-shoppies-movie-awards-for-entrepreneurs/index.html?nominations=" + Object.keys(nominations_dict)

    // Copy link
    shareable_link.hidden = false;
    var copyLinkText = document.getElementById("shareable_link");
    copyLinkText.select();
    copyLinkText.setSelectionRange(0, 99999); /* For mobile devices */
    document.execCommand("copy");
    shareable_link.hidden = true;
}

// Clear nominations
function clear_nominations() {
    for (var key in nominations_dict) {
        remove(key)
    }
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




// Load shareable link parameters
if (nominationsParameter) {
    var nominationsLoadIDs = nominationsParameter.split(",")

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

}