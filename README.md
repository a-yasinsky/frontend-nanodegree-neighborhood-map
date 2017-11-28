# Neighborhood Map
Map with US cities, where you can want to work as web developer. You can find salary data for each city, and cost of living indecies.

## Instalation
1. Download the GitHub zip file or clone the repository onto your local workstation: 
	* [zip file](https://github.com/a-yasinsky/frontend-nanodegree-neighborhood-map/archive/master.zip)
	* [git clone](https://github.com/a-yasinsky/frontend-nanodegree-neighborhood-map.git)
2. Open a browser window and navigate to the index.html file

## APIs:
* [Glassdoor](https://www.glassdoor.com/developer/index.htm)
* [Numbeo](https://www.numbeo.com/api/doc.jsp)

### Glassdoor
Because the Glassdoor's API does not provide salary data devided by cities, data parse form [salary page](https://www.glassdoor.com/Salaries/company-salaries.htm) with POST parametrs. And the cityId could be found from [autocomplete method](https://www.glassdoor.com/findPopularLocationAjax.htm) on the main page.
Sometime it works with trouble, but it is good for Error Handling.

### Numbeo
Use method GET /api/indices
Description: Returns Numbeo's indices for a city. Location can be specified with a query containing name or latitude,longitude (with comma separator).

## Dependencies

* [HTML5 shiv](https://github.com/aFarkas/html5shiv) 
* [Respond](https://github.com/scottjehl/Respond/) 
* [Promise Polyfill](https://github.com/taylorhakes/promise-polyfill)
* [Fetch polyfill](https://github.com/github/fetch)
* [jQuery](https://jquery.com/)
* [Bootstrap](http://getbootstrap.com/)
* [Knockout](http://knockoutjs.com/)
* [Google Maps API](https://developers.google.com/maps/documentation/javascript/)
