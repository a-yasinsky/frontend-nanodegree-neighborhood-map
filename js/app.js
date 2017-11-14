'use strict';

let map;

let Map = function(elementID, coords) {
	this.map = new google.maps.Map(document.getElementById(elementID), {
	  center: coords,
	  zoom: 3
	});
	this.geocoder = new google.maps.Geocoder();

	this.init();
};

Map.prototype.init = function(){
	const options = {
		types: ["geocode"]
	};
	this.autocomplete = new google.maps.places.Autocomplete(
            document.getElementById('search-form'), options);
			
	const iwOptions = {
		maxWidth: 400
	};
	this.infoWindow = new google.maps.InfoWindow(iwOptions);
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
	map = new Map('map', {lat: 37.567038, lng: -96.480547});
	
	ko.applyBindings(new ViewModel());
}

let ApiManager = function() {
	this.url = 'http://127.0.0.1/edsa-nmap/';
	this.action = '';
}

ApiManager.prototype.sendRequest = function(city) {
	return fetch(`${this.url}?action=${this.action}&city=${city}`,{
    method: 'GET',
	mode: 'cors'
	});
}

let Glassdoor = function() {
	ApiManager.call(this);
	this.action = 'glassdoor';
	this.poweredText = `<a href='https://www.glassdoor.com/index.htm'>powered by <img src='https://www.glassdoor.com/static/img/api/glassdoor_logo_80.png' title='Job Search' /></a>`;
}

Glassdoor.prototype = Object.create(ApiManager.prototype);
Glassdoor.prototype.constructor = Glassdoor;

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
		let cityObj = new City(city);
		
		cityObj.marker.addListener('click', function() {
            that.openInfoWindow(this, map.infoWindow);
          });
		
		return cityObj;
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
	
	this.openInfoWindow = function(marker, infoWindow){
		if(infoWindow.marker != marker){
			infoWindow.setContent('Loading...');
			infoWindow.marker = marker;
			// Make sure the marker property is cleared if the infowindow is closed.
			infoWindow.addListener('closeclick', function() {
				infoWindow.marker = null;
			});
			infoWindow.open(map.map, marker);
			let glassdoor = new Glassdoor();
			glassdoor.sendRequest(marker.title)
			.then(response => response.json())
			.then(function(data){
				infoWindow.setContent(data.html + '<br>' + glassdoor.poweredText);
			})
			.catch(function(error){
				window.alert(error);
			});
		}
	};
	
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
			window.alert(error);  
		  });
	}.bind(this);
	
	this.filterClear = function() {
		$('.search-form').val("");
		for(const city of that.cities()){
			city.show(true);
		}
		map.map.setZoom(4); 
	}
}