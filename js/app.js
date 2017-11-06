'use strict';

let map;

function initMap() {
	// Constructor creates a new map - only center and zoom are required.
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: 41.087094, lng: -39.486305},
	  zoom: 3
	});
}

let City = function(data) {
	
}

let ViewModel = function() {
	
}

ko.applyBindings(new ViewModel());