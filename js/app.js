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
	this.title = data.title;
	this.location = data.location;
}

let ViewModel = function() {
	this.cities = ko.observableArray(cities.map(function(city){
		return new City(city);
	}));
}

ko.applyBindings(new ViewModel());