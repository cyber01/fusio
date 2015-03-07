'use strict';

angular.module('fusioApp.routes', ['ngRoute', 'ui.bootstrap'])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/routes', {
		templateUrl: 'app/routes/index.html',
		controller: 'RoutesCtrl'
	});
}])

.controller('RoutesCtrl', ['$scope', '$http', '$modal', function($scope, $http, $modal){

	$scope.response = null;
	$scope.search = '';

	$scope.load = function(){
		var search = encodeURIComponent($scope.search);

		$http.get(fusio_url + 'backend/routes?search=' + search).success(function(data){
			$scope.totalItems = data.totalItems;
			$scope.startIndex = 0;
			$scope.routes = data.entry;
		});
	};

	$scope.pageChanged = function(){
		var startIndex = ($scope.startIndex - 1) * 16;
		var search = encodeURIComponent($scope.search);

		$http.get(fusio_url + 'backend/routes?startIndex=' + startIndex + '&search=' + search).success(function(data){
			$scope.totalItems = data.totalItems;
			$scope.routes = data.entry;
		});
	};

	$scope.doSearch = function(search){
		var search = encodeURIComponent(search);
		$http.get(fusio_url + 'backend/routes?search=' + search).success(function(data){
			$scope.totalItems = data.totalItems;
			$scope.startIndex = 0;
			$scope.routes = data.entry;
		});
	};

	$scope.openCreateDialog = function(){
		var modalInstance = $modal.open({
			size: 'lg',
			templateUrl: 'app/routes/create.html',
			controller: 'RoutesCreateCtrl'
		});

		modalInstance.result.then(function(response){
			$scope.response = response;
			$scope.load();
		}, function(){
		});
	};

	$scope.openUpdateDialog = function(route){
		var modalInstance = $modal.open({
			size: 'lg',
			templateUrl: 'app/routes/update.html',
			controller: 'RoutesUpdateCtrl',
			resolve: {
				route: function(){
					return route;
				}
			}
		});

		modalInstance.result.then(function(response){
			$scope.response = response;
			$scope.load();
		}, function(){
		});
	};

	$scope.openDeleteDialog = function(route){
		var modalInstance = $modal.open({
			size: 'lg',
			templateUrl: 'app/routes/delete.html',
			controller: 'RoutesDeleteCtrl',
			resolve: {
				route: function(){
					return route;
				}
			}
		});

		modalInstance.result.then(function(response){
			$scope.response = response;
			$scope.load();
		}, function(){
		});
	};

	$scope.closeResponse = function(){
		$scope.response = null;
	};

	$scope.load();

}])

.controller('RoutesCreateCtrl', ['$scope', '$http', '$modalInstance', function($scope, $http, $modalInstance){

	$scope.route = {
		methods: '',
		path: '',
		controller: 'Fusio-Controller-SchemaApiController',
		config: []
	};
	$scope.controllers = [{
		id: 'Fusio-Controller-SchemaApiController',
		name: 'Schema API'
	}];

	$scope.methods = ['GET', 'POST', 'PUT', 'DELETE'];
	$scope.schemas = [];
	$scope.actions = [];

	$scope.create = function(route){
		var methods = '';
		for (var i = 0; i < $scope.route.config.length; i++) {
			methods+= $scope.route.config[i].method;
			if (i < $scope.route.config.length - 1) {
				methods+= '|';
			}
		}

		route.methods = methods;

		$http.post(fusio_url + 'backend/routes', route)
			.success(function(data){
				$scope.response = data;
				if (data.success === true) {
					$modalInstance.close(data);
				}
			})
			.error(function(data){
				$scope.response = data;
			});
	};

	$http.get(fusio_url + 'backend/action')
		.success(function(data){
			$scope.actions = data.entry;
		});

	$http.get(fusio_url + 'backend/schema')
		.success(function(data){
			$scope.schemas = data.entry;
		});

	$scope.close = function(){
		$modalInstance.dismiss('cancel');
	};

	$scope.closeResponse = function(){
		$scope.response = null;
	};

	$scope.addOptionRow = function(){
		$scope.route.config.push({
			method: 'GET',
			request: 0,
			response: 1,
			action: 1
		});
	};

	$scope.removeOptionRow = function(row){
		var newOptions = [];
		for (var i = 0; i < $scope.route.config.length; i++) {
			var option = $scope.route.config[i];
			if (option['$$hashKey'] != row['$$hashKey']) {
				newOptions.push($scope.route.config[i]);
			}
		}
		$scope.route.config = newOptions;
	};

	$scope.addOptionRow();

}])

.controller('RoutesUpdateCtrl', ['$scope', '$http', '$modalInstance', 'route', function($scope, $http, $modalInstance, route){

	$scope.route = route;

	$scope.methods = ['GET', 'POST', 'PUT', 'DELETE'];
	$scope.schemas = [];
	$scope.actions = [];

	$scope.update = function(route){
		var methods = '';
		for (var i = 0; i < $scope.route.config.length; i++) {
			methods+= $scope.route.config[i].method;
			if (i < $scope.route.config.length - 1) {
				methods+= '|';
			}
		}

		route.methods = methods;

		$http.put(fusio_url + 'backend/routes/' + route.id, route)
			.success(function(data){
				$scope.response = data;
				if (data.success === true) {
					$modalInstance.close(data);
				}
			})
			.error(function(data){
				$scope.response = data;
			});
	};

	$http.get(fusio_url + 'backend/routes/' + route.id)
		.success(function(data){
			// replace backslash with dash
			data.controller = data.controller.replace(/\\/g, '-');

			$scope.route = data;
		});

	$http.get(fusio_url + 'backend/action')
		.success(function(data){
			$scope.actions = data.entry;
		});

	$http.get(fusio_url + 'backend/schema')
		.success(function(data){
			$scope.schemas = data.entry;
		});

	$scope.close = function(){
		$modalInstance.dismiss('cancel');
	};

	$scope.closeResponse = function(){
		$scope.response = null;
	};

	$scope.addOptionRow = function(){
		if (!$scope.route.config) {
			$scope.route.config = [];
		}

		$scope.route.config.push({
			method: 'GET',
			request: 0,
			response: 1,
			action: 1
		});
	};

	$scope.removeOptionRow = function(row){
		var newOptions = [];
		for (var i = 0; i < $scope.route.config.length; i++) {
			var option = $scope.route.config[i];
			if (option['$$hashKey'] != row['$$hashKey']) {
				newOptions.push($scope.route.config[i]);
			}
		}
		$scope.route.config = newOptions;
	};

}])

.controller('RoutesDeleteCtrl', ['$scope', '$http', '$modalInstance', 'route', function($scope, $http, $modalInstance, route){

	$scope.route = route;

	$scope.delete = function(route){
		$http.delete(fusio_url + 'backend/routes/' + route.id)
			.success(function(data){
				$scope.response = data;
				if (data.success === true) {
					$modalInstance.close(data);
				}
			})
			.error(function(data){
				$scope.response = data;
			});
	};

	$scope.close = function(){
		$modalInstance.dismiss('cancel');
	};

	$scope.closeResponse = function(){
		$scope.response = null;
	};

}]);
