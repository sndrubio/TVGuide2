(function(as4,$,undefined){

//Additional functions to check step by step the DB
as4.writeError = function (error) {
    var div = document.createElement("div");
    $(div).text(error);
    $("#error").append(div);
}
as4.writeLog = function (log) {
    var div = document.createElement("div");
    $(div).text(log);
    $("#info").append(div);
}


//Creating the indexedDB
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	if(!window.indexedDB){
	console.log("Your Browser does not support IndexedDB");
}

/**
* 1. First we must connect to the database
* We can have many databases each with a unique name
*/

var request = window.indexedDB.open("TVGuideDB",22);

var db;//database will be stored in this variable	

request.onerror = function(event){
	console.log("Error opening DB", event);
}


request.onupgradeneeded = function(event) {
	//as4.writeLog("HISTORY: database about to update");
	// 1a. we have a temporary connection we can use to upgrade
	var tempDb = event.target.result;
	// 1b. in this case we are removing the shows datastore
	// if it already existed (this will erase all data)
	
	
	
	if (tempDb.objectStoreNames.contains("shows")) {
	    tempDb.deleteObjectStore("shows");
	} 
		
	var showsObjectStore = tempDb.createObjectStore("shows", { keyPath: "id", autoIncrement: true});
	 
	// Create an index to search shows by title
	// These are not unique to a show, so we cannot use unique
	showsObjectStore.createIndex("title", "title", { unique: true });
	  
	// Create an index to search shows by first aired
	// Names are unique so use a unique index.
	showsObjectStore.createIndex("overview", "overview", { unique: false });
	  
	if (tempDb.objectStoreNames.contains("episodes")){
	    tempDb.deleteObjectStore("episodes");
	}
	  
	var episodesObjectStore = tempDb.createObjectStore("episodes", { keyPath:"id" , autoIncrement: true});
	 
	// Create an index to search shows by title
	// These are not unique to a show, so we cannot use unique
	episodesObjectStore.createIndex("title", "title", { unique: false });
	 				  
	// Create an index to search shows by overview
	// These are not unique to a show, so we cannot use unique
	episodesObjectStore.createIndex("overview", "overview", { unique: false });
	  
	// Create an index to search shows by url
	// These are unique to a show, so use a unique index.
	episodesObjectStore.createIndex("url", "url", { unique: true});
	  
	//as4.writeLog("HISTORY: database updated");
};
	
request.onsuccess  = function(event){
    console.log("Success opening DB");
    db = this.result;
	addData();
	queryDatabase();
}

		
//2. Set DB.Loading data from .json files
addData= function () {
	if (!db) //cant without it!
		return;
		
	$.ajax( {type: "GET", url:"../shows2.json", contentType: "application/json; charset=utf-8"}).done(
		function(showsData){
		
			var showsJson = showsData;
			
			var transaction = db.transaction("shows", "readwrite");
			var showsObjectStore = transaction.objectStore("shows");
			for (var i in showsJson) {
			  showsObjectStore.add(showsJson[i]);
			}
	});//close ajax and function
		
		
	$.ajax( {type: "GET", url:"../episodes2.json", contentType: "application/json; charset=utf-8"}).done(
		function(episodesData){
		
			var episodesJson = episodesData;
			
			//var transaction1 = db.transaction("shows", "readwrite");
			//var episodesShowsObjectStore = transaction1.objectStore("shows");
			//var transaction2 = db.transaction("episodes", "readwrite");
			//var episodesEpiObjectStore = transaction2.objectStore("episodes");
			for (var i in episodesJson) {
				var transaction1 = db.transaction("shows", "readwrite");
				var episodesShowsObjectStore = transaction1.objectStore("shows");
				var transaction2 = db.transaction("episodes", "readwrite");
				var episodesEpiObjectStore = transaction2.objectStore("episodes");
				episodesShowsObjectStore.add(episodesJson[i].show);
				episodesEpiObjectStore.add(episodesJson[i].episode);
			}
	});//close ajax and function
		
}//close addData();



//3. After a db is setup, we can query it
queryDatabase=function () {

	if (!db) //cant query without it!
		return;
		
	$("#button").on("click", function(event){
	
			document.getElementById("searchResults").innerHTML="";
			document.getElementById("notfound").innerHTML="";
			as4.getFormResult = $("#searchid").val();
			as4.getNumber = $("#numberOfResults").val();
			console.log(as4.getNumber);
			console.log(as4.getFormResult);
			
			if(((as4.getFormResult) !== '')&&((as4.getNumber) !== '')&&(((as4.getNumber)%1)== 0)){
				//SHOWS
				db.transaction("shows").objectStore("shows").openCursor().onsuccess = function (event) {
					var cursor = event.target.result;
					if(cursor && as4.getNumber>0){ 
						var checkTitle = (cursor.value.title).indexOf(as4.getFormResult);
						//console.log(checkTitle);
						var checkOverview = (cursor.value.overview).indexOf(as4.getFormResult);
						//console.log(checkOverview);
						if (((checkTitle)!==(-1)) || ((checkOverview)!==(-1))) { 
								
							as4.writeLog("Show Title: " + cursor.value.title);		
							//as4.writeLog("Show Overview: " + cursor.value.overview);
							
							// Printing the results.
							var div = $("<div id = 'result'></div>");	

							var title = $("<h2 class='title' > Show: "+cursor.value.title+"</h2>");
							$(title).addClass(title);
							$(div).append(title);
							
							var overview = $('<h3 class="overview">' + cursor.value.overview + "</h3>");
							$(overview).addClass(overview);
							$(div).append(overview);
							
							$('#searchResults').append(div);
							
							// Decrement the number of results that were chosen to be shown
							as4.getNumber --;
											
						}	
						cursor.continue ();
					} else {
						console.log("No entries");
					}
				};
			
			
				//EPISODES
			
				db.transaction("episodes").objectStore("episodes").openCursor().onsuccess = function (event) {
					var cursor = event.target.result;
					if(cursor && as4.getNumber>0){
						var checkTitle = (cursor.value.title).indexOf(as4.getFormResult);
						//console.log(checkTitle);
						var checkOverview = (cursor.value.overview).indexOf(as4.getFormResult);
						//console.log(checkOverview);
						if (((checkTitle)!==(-1)) || ((checkOverview)!==(-1))) { 

							//as4.writeLog("Episode Title: " + cursor.value.title);
							//as4.writeLog("Episode Overview: " + cursor.value.overview);
							
							var div = $("<div id = 'result'></div>");					 

							var title = $("<h2 class='title'> Episode: "+cursor.value.title+"</h2>");
							$(title).addClass(title);
							$(div).append(title);
							
							var overview = $('<h3 class="overview">' + cursor.value.overview + "</h3>");
							$(overview).addClass(overview);
							$(div).append(overview);
							
							$('#searchResults').append(div);
						
							// Decrement the number of results that were chosen to be shown
							as4.getNumber --;
									
						}	
						cursor.continue ();
					} else {
						console.log("No entries");
					}
				};//close transaction

				
			}else{ //if the form is empty, we show a message asking for information.
				var div = $("<div id = 'nosearch'></div>");
				
				var nosearch = $('<h3> Please, fill in the blanks to resolve your search  </h3>');
				$(nosearch).addClass(nosearch);
				$(div).append(nosearch);
							
				$("#notfound").append(div);
				
			}//close "else"
			
		//Using localStorage to keep the values inserted in the form
		localStorage.setItem("Last search", as4.getFormResult);
		localStorage.setItem("Last number of items searched", as4.getNumber);
		
	});//close button
}//close queryDatabase


// Initialize function	
as4.initialize = function(){	

		//Using localStorage to retrieve storaged data in them and fill in the text areas.
		
	if (localStorage['Last search']) {
		$('#searchid').val(localStorage['Last search']);
	}
	if (localStorage['Last number of items searched']) {
		$('#numberOfResults').val(localStorage['Last number of items searched']);
	}
}

$(document).ready(as4.initialize);

})(window.as4 = window.as4 || {},jQuery)