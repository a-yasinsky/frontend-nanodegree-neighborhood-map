'use strict';

let map;

function init() {
	// Constructor creates a new map - only center and zoom are required.
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: 41.087094, lng: -39.486305},
	  zoom: 3
	});
	
	ko.applyBindings(new ViewModel());
}

let City = function(data) {
	let _self = this;
	this.title = data.title;
	this.location = data.location;
	this.show = ko.observable(true);
	this.marker = new google.maps.Marker({
            position: _self.location,
            title: _self.title,
            animation: google.maps.Animation.DROP
          });
}

City.prototype.bounceMarker = function() {
	let that = this;
	this.marker.setAnimation(google.maps.Animation.BOUNCE);
	setTimeout(function(){
		that.marker.setAnimation(null);
	}, 700);
};

let ViewModel = function() {
	this.cities = ko.observableArray(cities.map(function(city){
		return new City(city);
	}));
	
	this.filteredCities = ko.computed(function() {
		let bounds = new google.maps.LatLngBounds();
		let filteredCities = this.cities().filter(function(city) {
			if(city.show()) {
				city.marker.setMap(map);
				bounds.extend(city.marker.position);
			}else {
				city.marker.setMap(null);
			}
			return city.show();
		});
		map.fitBounds(bounds);
		return filteredCities;
	}.bind(this));
	
	this.filteredCities.subscribe(function(vaal){
		console.log(vaal);
	}, null, "change");
	
	this.clickCityList = function(){
		this.bounceMarker();
	};
}