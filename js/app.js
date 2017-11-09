'use strict';

let map;

let Map = function(elementID, coords) {
	this.map = new google.maps.Map(document.getElementById(elementID), {
	  center: coords,
	  zoom: 3
	});
	this.geocoder = new google.maps.Geocoder();
};

Map.prototype.geocode = function(searchValue){
	let that = this;
	let bounds = new google.maps.LatLngBounds();
	bounds.extend({lat: -90, lng: -180});
	bounds.extend({lat: 90, lng: 180});
	let promise = new Promise(function(resolve,reject){
		that.geocoder.geocode(
            { address: searchValue,
			  bounds: bounds }, 
			function(results, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                resolve(results[0]);
              } else {
                reject('We could not find that location');
              }
            });
	});
	return promise;
};

function init() {
	// Constructor creates a new map - only center and zoom are required.
	map = new Map('map', {lat: 41.087094, lng: -39.486305});
	
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
	let that = this;
	
	this.cities = ko.observableArray(cities.map(function(city){
		return new City(city);
	}));
	
	this.filteredCities = ko.computed(function() {
		let bounds = new google.maps.LatLngBounds();
		let filteredCities = this.cities().filter(function(city) {
			if(city.show()) {
				city.marker.setMap(map.map);
				bounds.extend(city.marker.position);
			}else {
				city.marker.setMap(null);
			}
			return city.show();
		});
		map.map.fitBounds(bounds);
		map.map.setZoom(5);
		return filteredCities;
	}.bind(this));
	
	this.clickCityList = function(){
		this.bounceMarker();
	};
	
	this.findArea = function() {
		map.geocode($('.search-form').val())
		  .then(function(results){
			let resultBounds = results.geometry.viewport;
			map.map.setCenter(results.geometry.location);
			for(const city of that.cities()){
				if(resultBounds.contains(city.marker.position)){
					city.show(true);
				}else{
					city.show(false);
				}
			}
			//map.map.fitBounds(resultBounds);
		  })
		  .catch(function(error){
			console.log(error);  
		  });
	}.bind(this);
	
	this.filterClear = function() {
		$('.search-form').val("");
		for(const city of that.cities()){
			city.show(true);
		}
		map.map.setZoom(2);
	}
}