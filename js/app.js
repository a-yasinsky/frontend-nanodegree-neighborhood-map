(function () {
	'use strict';
	//Promise polyfill
	if (!window.Promise) {
	  window.Promise = Promise;
	}
	//general variable for Map object
	let map;
	//Map class, contains google map, geocoder, infowondows objects
	let Map = function(elementID, coords) {
		this.map = new google.maps.Map(document.getElementById(elementID), {
		  center: coords,
		  zoom: 3
		});
		this.geocoder = new google.maps.Geocoder();

		this.init();
	};
	// sets options to infoWindow
	Map.prototype.init = function(){
		const iwOptions = {
			maxWidth: 400
		};
		this.infoWindow = new google.maps.InfoWindow(iwOptions);
	};
	//find place from the searchbox, returns a Promise to the ViewModel
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
	// make marker bounce on click, or click in list
	Map.prototype.bounceMarker = function(marker) {
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){
			marker.setAnimation(null);
		}, 700);
	};
	// app init function, set in gMaps callback
	if (!window.nmAppInit) {
		window.nmAppInit = function() {
			// Constructor creates a new map - only center and zoom are required.
			map = new Map('map', {lat: 37.567038, lng: -96.480547});

			ko.applyBindings(new ViewModel());
		};
	}
	// Error callback for GMap API request
	if (!window.gmapError) {
		window.gmapError = function() {
			alert('Can not load Google Maps. Check your internet connection and reload the page.');
		};
	}
	// class to manage requests from both apis
	let RequestManager = function() {
		this.url = 'http://api.yasinsky.pro/';
		this.action = '';
	};
	// send request to server, return Promise
	RequestManager.prototype.sendRequest = function(city) {
		return fetch(`${this.url}?action=${this.action}&city=${city}`,{
		method: 'GET',
		mode: 'cors'
		})
		.then(function(response){
			if(response.ok){
				return response.json();
			}
			throw new Error('API is unavailable now.');
		});
	};
	// class to get data form Glassdoor API
	let Glassdoor = function() {
		RequestManager.call(this);
		this.action = 'glassdoor';
		this.poweredText = `<a href='https://www.glassdoor.com/index.htm'>powered by <img src='https://www.glassdoor.com/static/img/api/glassdoor_logo_80.png' title='Job Search' /></a>`;
	};

	Glassdoor.prototype = Object.create(RequestManager.prototype);
	Glassdoor.prototype.constructor = Glassdoor;
	Glassdoor.prototype.getInfoText = function(responseData){
		return responseData + this.poweredText;
	};
	// class to get data form Numbeo API
	let Numbeo = function() {
		RequestManager.call(this);
		this.action = 'numbeo';
		this.poweredText = `More about indices: <a href='https://www.numbeo.com/cost-of-living/cpi_explained.jsp'>Numbeo</a>`;
	};

	Numbeo.prototype = Object.create(RequestManager.prototype);
	Numbeo.prototype.constructor = Numbeo;
	Numbeo.prototype.getInfoText = function(responseData){
		let content = '<ul>';
		for(let index in responseData)
			if(responseData.hasOwnProperty(index)){
				content += `<li>${responseData[index].index}: ${responseData[index].value}</li>`;
			  }
		return content + "</ul>" + '<br>' + this.poweredText;
	};
	// general class to work with both apis
	let ApiManager = function() {
		this.glassdoor = new Glassdoor();
		this.numbeo = new Numbeo();
	};
	// sends requests to both apis
	ApiManager.prototype.getApisData = function(cityTitle) {
		let that = this;
		return [that.glassdoor, that.numbeo].map(function(api){
			return api.sendRequest(cityTitle)
					.then(function(response){
						return {[api.action]: api.getInfoText(response.response)};
					});
		});
	};
	// basic City class, contains marker for each city
	let City = function(data) {
		let _self = this;
		this.title = data.title;
		this.location = data.location;
		this.show = ko.observable(true);
		this.marker = new google.maps.Marker({
				position: _self.location,
				title: _self.title,
				map: map.map,
				visible: false,
				animation: google.maps.Animation.DROP
			  });
	};

	let ViewModel = function() {
		let that = this;

		this.searchValue = ko.observable("");
		// all cities from data.js with eventListeners
		this.cities = ko.observableArray(cities.map(function(city){
			let cityObj = new City(city);

			cityObj.marker.addListener('click', function() {
				that.openInfoWindow(this);
			  });

			return cityObj;
		}));
		// filtered cities, depends on "show" value, wich is observable
		this.filteredCities = ko.computed(function() {
			let bounds = new google.maps.LatLngBounds();
			let filteredCities = this.cities().filter(function(city) {
				if(city.show()) {
					city.marker.setVisible(true);
					bounds.extend(city.marker.position);
				}else {
					city.marker.setVisible(false);
				}
				return city.show();
			});
			map.map.fitBounds(bounds);
			map.map.setZoom(5);
			return filteredCities;
		}.bind(this));
		// returns filled content for infoWindow
		function returnContentForIW(texts){
			return `${texts.glassdoor} <br> <br>
				   ${texts.numbeo}`;
		}
		//opens infoWindow on marker or list click
		this.openInfoWindow = function(marker){
			const infoWindow = map.infoWindow;
			map.bounceMarker(marker);
			if(infoWindow.marker != marker){
				let texts = {glassdoor: 'Loading salary data...',
							numbeo: 'Loading cost of living indices...'};
				//sets content before loading
				infoWindow.setContent(returnContentForIW(texts));
				infoWindow.marker = marker;
				infoWindow.addListener('closeclick', function() {
					infoWindow.marker = null;
				});
				infoWindow.open(map.map, marker);
				//send requests to both apis. Puts content to each sections
				let apiManager = new ApiManager();
				apiManager.getApisData(marker.title).forEach(function(val){
					val.then(function(response){
						let key = Object.keys(response)[0];
						texts[key] = response[key];
						infoWindow.setContent(returnContentForIW(texts));
					})
					.catch(function(error){
						console.log(error);
						infoWindow.setContent(`Please try again later. API is unavailable now (${error.message}).`);
					});
				});
			}
		};
		// on list click
		this.clickCityList = function(){
			that.openInfoWindow(this.marker);
		};
		//on searchBox change. Filters cities.
		this.findArea = function() {
			var filter = that.searchValue().toLowerCase();
			if (filter) {
				ko.utils.arrayFilter(that.cities(), function(city) {
					if(city.title.toLowerCase().indexOf(filter) >= 0){
						city.show(true);
					}else{
						city.show(false);
					}
					return true;
				});
			}
		}.bind(this);
		this.searchValue.subscribe(function(newValue){
			if(newValue == "")
				that.filterClear();
			else
				that.findArea();
		});
		// clears cities filter
		this.filterClear = function() {
			this.searchValue("");
			for(const city of that.cities()){
				city.show(true);
			}
			map.map.setZoom(4);
		};
	};
}());