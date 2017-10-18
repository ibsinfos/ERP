/**
Copyright 2017 ToManage

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

@author    ToManage SAS <contact@tomanage.fr>
@copyright 2014-2017 ToManage SAS
@license   http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
International Registered Trademark & Property of ToManage SAS
*/



/***
 Metronic AngularJS App Main Script
 ***/

/* Metronic App */
var MetronicApp = angular.module("MetronicApp", [
    "ui.bootstrap",
    "ui.router",
    "ngSanitize",
    "ngResource",
    "xeditable",
    'dialogs.main',
    //  "ngAnimate", // conflict with datatable !!!
    "toastr",
    //'ngFileUpload',
    "oc.lazyLoad",
    'angularFileUpload',
    //'ngGrid', //'ui.chart',
    "ngTagsInput",
    //"ui.bootstrap.datetimepicker",
    'checklist-model',
    //'jsonFormatter'
    'schemaForm',
    'notification',
    'ngHandsontable',
    'summernote',
    'ui.tree',
    'angular.filter'
]);
/* Configure ocLazyLoader(refer: https://github.com/ocombe/ocLazyLoad) */
MetronicApp.config(['$ocLazyLoadProvider', function($ocLazyLoadProvider) {
    $ocLazyLoadProvider.config({
        // global configs go here
    });
}]);

/********************************************
 BEGIN: BREAKING CHANGE in AngularJS v1.3.x:
 *********************************************/
/**
 `$controller` will no longer look for controllers on `window`.
 The old behavior of looking on `window` for controllers was originally intended
 for use in examples, demos, and toy apps. We found that allowing global controller
 functions encouraged poor practices, so we resolved to disable this behavior by
 default.
 
 To migrate, register your controllers with modules rather than exposing them
 as globals:
 
 Before:
 
 ```javascript
 function MyController() {
 // ...
 }
 ```
 
 After:
 
 ```javascript
 angular.module('myApp', []).controller('MyController', [function() {
 // ...
 }]);
 
 Although it's not recommended, you can re-enable the old behavior like this:
 
 ```javascript
 angular.module('myModule').config(['$controllerProvider', function($controllerProvider) {
 // this option might be handy for migrating old apps, but please don't use it
 // in new ones!
 $controllerProvider.allowGlobals();
 }]);
 **/

//AngularJS v1.3.x workaround for old style controller declarition in HTML
MetronicApp.config(['$controllerProvider', function($controllerProvider) {
    // this option might be handy for migrating old apps, but please don't use it
    // in new ones!
    $controllerProvider.allowGlobals();
}]);

/********************************************
 END: BREAKING CHANGE in AngularJS v1.3.x:
 *********************************************/


//Setting HTML5 Location Mode
MetronicApp.config(['$locationProvider',
    function($locationProvider) {
        $locationProvider.hashPrefix("!");
    }
]);
// Add Body for DELETE request
MetronicApp.config(['$httpProvider',
    function($httpProvider) {
        $httpProvider.defaults.headers.delete = {
            "Content-Type": "application/json;charset=utf-8"
        };
    }
]);

MetronicApp.config(['$httpProvider',
    function($httpProvider) {
        $httpProvider.interceptors.push(function($q) {
            return {
                'response': function(response) {
                    //Will only be called for HTTP up to 300
                    //console.log(response);
                    return response;
                },
                'responseError': function(rejection) {
                    switch (rejection.status) {
                        case 401:
                            //location.replace("/login");
                            window.location.reload();
                            break;
                        case 403:
                            window.location = '/erp/#!/error/' + rejection.status;
                            //console.log($routeProvider);
                            break;
                    }
                    return $q.reject(rejection);
                }
            };
        });
    }
]);

MetronicApp.factory('notifyToastr', ['$q', 'toastr', function($q, toastr) {
    var notifyToastr = {
        /*request: function (config) {
         config.requestTimestamp = new Date().getTime();
         return config;
         },*/
        response: function(response) {
            if (response.data && response.data.errorNotify) {
                // Draw Notify
                toastr.error(response.data.errorNotify.message, response.data.errorNotify.title || 'Error', {
                    timeOut: 10000,
                    progressBar: true
                });
                return $q.reject(response); // Reject response
            }

            if (response.data && response.data.successNotify) {
                // Draw Notify information
                toastr.success(response.data.successNotify.message, response.data.successNotify.title || 'Error', {
                    timeOut: 5000,
                    progressBar: true
                });
            }
            return response;
        }
    };
    return notifyToastr;
}]);
MetronicApp.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('notifyToastr');
}]);

/* Setup global settings */
MetronicApp.factory('settings', ['$rootScope', function($rootScope) {
    // supported languages
    var settings = {
        layout: {
            pageSidebarClosed: false, // sidebar menu state
            pageBodySolid: false, // solid body color state
            pageAutoScrollOnLoad: 0 // auto scroll to top on page load
        },
        layoutImgPath: Metronic.getAssetsPath() + 'admin/layout/img/',
        layoutCssPath: Metronic.getAssetsPath() + 'admin/layout/css/'
    };
    $rootScope.settings = settings;
    return settings;
}]);
/* Setup App Main Controller */
MetronicApp.controller('AppController', ['$scope', '$rootScope', '$http', '$location', 'dialogs', 'websocketService', '$notification',
    function($scope, $rootScope, $http, $location, dialogs, websocketService, $notification) {
        $rootScope.noteStatus = [{
                id: "note-info",
                name: "Info"
            },
            {
                id: "note-warning",
                name: "Warning"
            },
            {
                id: "note-danger",
                name: "Danger"
            },
            {
                id: "note-success",
                name: "Success"
            }
        ];

        // accept notification
        $notification.requestPermission()
            .then(function(permission) {
                //console.log(permission); // default, granted, denied
            });

        var login = function(userId) {
            //console.log(userId);
            if ($location.$$protocol === "http")
                websocketService.login('ws://' + $location.host() + ':' + $location.port() + '/erp/websocket/', userId);
            else
                websocketService.login('wss://' + $location.host() + ':' + $location.port() + '/erp/websocket/', userId);
            $rootScope.isLogged = true;
        };

        // Get User profile
        $http({
            method: 'POST',
            url: '/session'
        }).success(function(data, status) {
            //console.log(data);
            $rootScope.login = data.user; // User Profile
            $rootScope.entity = data.user.entity; // Entity profile
            $rootScope.$emit('login'); // Notify login

            login(data.user._id); // websocket

            if (data.user.url && data.user.url.module)
                $rootScope.$state.go(data.user.url.module, data.user.url.params);

        });

        $rootScope.setEntity = function(entity) {
            $rootScope.entity = entity;
        };

        // Get Entity list
        $http({
            method: 'GET',
            url: '/erp/api/entity/select'
        }).success(function(data, status) {
            //console.log(data);
            $rootScope.entityList = data;
            $rootScope.entityListAll = data.slice(); // Copy array
            $rootScope.entityListAll.push({
                id: "ALL",
                name: "ALL"
            });
        });

        // Get Entity list
        $http({
            method: 'GET',
            url: '/erp/api/languages'
        }).success(function(data, status) {
            //console.log(data);
            $rootScope.languages = data.data;
        });

        $rootScope._language = 0;
        $rootScope.setLanguage = function(idx) {
            $rootScope._language = idx;
        };

        // Return url Image
        $rootScope.getImage = function(model, data) {
            if (data)
                return "/erp/api/file/" + model + "/" + data;
            else
                return "/assets/admin/layout/img/nophoto.jpg";
        };

        // toggle selection for a given soncas by value
        $rootScope.toggleSelection = function toggleSelection(tab, value) {
            var idx;
            idx = tab.indexOf(value);

            // is currently selected
            if (idx > -1)
                tab.splice(idx, 1);

            // is newly selected
            else
                tab.push(value);
        };

        // Calcul la somme d'une liste
        $rootScope.getTotal = function(data, key) {
            var total = 0;

            if (data)
                for (var i = 0; i < data.length; i++) {
                    total += data[i][key];
                }
            return total;
        };

        //index(obj,'a.b.etc')

        var index = function(obj, is, value) {
            if (typeof is == 'string')
                return index(obj, is.split('.'), value);
            else if (is.length == 1 && value !== undefined)
                return obj[is[0]] = value;
            else if (is.length == 0)
                return obj;
            else
                return index(obj[is[0]], is.slice(1), value);
        };

        $rootScope.index = index;

        function encodeUriQuery(val, pctEncodeSpaces) {
            return encodeURIComponent(val).
            replace(/%40/gi, '@').
            replace(/%3A/gi, ':').
            replace(/%24/g, '$').
            replace(/%2C/gi, ',').
            replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
        }

        $rootScope.buildUrl = function(url, params) {
            if (!params)
                return url;
            var parts = [];
            angular.forEach(params, function(value, key) {
                if (value === null || angular.isUndefined(value))
                    return;
                if (!angular.isArray(value))
                    value = [value];

                angular.forEach(value, function(v) {
                    if (angular.isObject(v)) {
                        v = angular.toJson(v);
                    }
                    parts.push(encodeUriQuery(key) + '=' + encodeUriQuery(v));
                });
            });
            return url + ((url.indexOf('?') === -1) ? '?' : '&') + parts.join('&');
        };

        $rootScope.loadUsers = function() {
            return $http.get('/erp/api/employees/getForDd').then(function(res) {
                //console.log(res.data);
                $rootScope.userList = res.data;
                //return res.data;
            });
        };


        $scope.$on('$viewContentLoaded', function() {
            Metronic.initComponents(); // init core components
            //Layout.init(); //  Init entire layout(header, footer, sidebar, etc) on page load if the partials included in server side instead of loading with ng-include directive 
        });

        // Global function to do autocomplete
        $rootScope.AutoComplete = function(val, url, entity) {
            return $http.post(url, {
                take: 50, // limit
                entity: entity,
                filter: {
                    logic: 'and',
                    filters: [{
                        value: val
                    }]
                }
            }).then(function(res) {
                console.log(res.data);
                return res.data;
            });
        };

        // DatePicker parameters
        $rootScope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };
    }
]);

/** Send Emailing */
MetronicApp.controller('sendEmailCtrl', ['$scope', '$modalInstance', 'data', function($scope, $modalInstance, data) {
    //-- Variables --//

    $scope.email = data.email;

    //-- Methods --//

    $scope.cancel = function() {
        $modalInstance.dismiss('Canceled');
    }; // end cancel

    $scope.send = function() {
        $modalInstance.close($scope.email);
    }; // end save

}]); // end controller(customDialogCtrl)


/***
 Layout Partials.
 By default the partials are loaded through AngularJS ng-include directive. In case they loaded in server side(e.g: PHP include function) then below partial 
 initialization can be disabled and Layout.init() should be called on page load complete as explained above.
 ***/
/* Setup Layout Part - Header */
MetronicApp.controller('HeaderController', ['$scope', '$rootScope', '$http', '$notification', /*'socket',*/
    function($scope, $rootScope, $http, $notification) {
        $scope.ticketCpt = 0;
        $scope.tasksCpt = 0;
        $scope.$on('$includeContentLoaded', function() {
            Layout.initHeader(); // init header
        });

        /*$rootScope.$on('login', function () { // On notify start websocket
         socket.emit('user', $rootScope.login._id);
         socket.on('reboot', function (data) {
         socket.emit('user', $rootScope.login._id);
         });
         socket.on('notify', function (data) {
         notify(data.title, data.message, data.options);
         });
         socket.on('refreshTicket', function (data) {
         $scope.ticketCounter();
         });
         socket.on('refreshTask', function (data) {
         $scope.taskCounter();
         });
        });*/

        $scope.ticketCounter = function() {
            $http({
                method: 'GET',
                url: '/api/ticket?count=1'
            }).
            success(function(data, status) {
                $scope.ticketCpt = data.cpt;
            });
        };

        $rootScope.$on('login', function() {
            $http({
                method: 'GET',
                url: '/erp/api/task/count',
                params: {
                    query: "MYTASK",
                    user: $rootScope.login._id
                }
            }).success(function(data, status) {
                $scope.tasksCpt = data.count;
            });
            $scope.online = true;
        });

        // refresh task counter
        $scope.$on('websocket', function(e, type, data) {
            //console.log(data);
            //console.log(type);

            if (!data)
                return;

            if (type === 'notify') {
                var notification = $notification(data.title, data.message);

                if (data.url)
                    var deregister = notification.$on('click', function() {
                        $rootScope.$state.go(data.url.module, data.url.params);
                    });

                return;
            }

            if (type === 'task')
                return $http({
                    method: 'GET',
                    url: '/erp/api/task/count',
                    params: {
                        query: "MYTASK",
                        user: $rootScope.login._id
                    }
                }).success(function(data, status) {
                    $scope.tasksCpt = data.count;
                });
            if (type === 'symeosnet') {
                //console.log(data);

                if (typeof data.online !== 'undefined') {
                    $scope.online = data.online;
                    delete data.online;
                }

                //NEXT...

                return;
            }

        });
    }
]);
/* Setup Layout Part - Sidebar */
MetronicApp.controller('SidebarController', ['$scope', '$rootScope', '$http',
    function($scope, $rootScope, $http) {
        $scope.menus = {};
        $scope.menuTasks = [];
        $rootScope.showSearchInput = true;

        $scope.$on('$includeContentLoaded', function() {
            Layout.initSidebar(); // init sidebar
            $http({
                method: 'GET',
                url: '/erp/api/menus'
            }).success(function(data, status) {
                $scope.menus = data;
                //console.log(data, status);
            });
        });

        $rootScope.$on('login', function() {
            $http({
                method: 'GET',
                url: '/api/task',
                params: {
                    fields: "societe datep name",
                    query: 'TODAYMYRDV',
                    user: $rootScope.login._id
                }
            }).success(function(data, status) {
                $scope.menuTasks = data;
                //console.log(data);
            });
        });

        $scope.searchQuery = function() {
            if ($scope.searchQueryItem.length) {
                $rootScope.searchQuery = {
                    lastname: $scope.searchQueryItem
                };
                $location.path("/search");
                $rootScope.showSearchInput = false;
                $scope.searchQueryItem = "";
            } else {
                //$location.path(Global.lastPath);
            }
        };
    }
]);
/* Setup Layout Part - Quick Sidebar */
MetronicApp.controller('QuickSidebarController', ['$scope', function($scope) {
    $scope.$on('$includeContentLoaded', function() {
        setTimeout(function() {
            QuickSidebar.init(); // init quick sidebar        
        }, 2000);
    });
}]);

/* Setup Layout Part - Theme Panel */
MetronicApp.controller('ThemePanelController', ['$scope', function($scope) {
    $scope.$on('$includeContentLoaded', function() {
        Demo.init(); // init theme panel
    });
}]);
/* Setup Layout Part - Footer */
MetronicApp.controller('FooterController', ['$scope', function($scope) {
    $scope.$on('$includeContentLoaded', function() {
        Layout.initFooter(); // init footer
    });
}]);
/* Setup Rounting For All Pages */
MetronicApp.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    // Redirect any unmatched url
    $urlRouterProvider.otherwise("/");
    $stateProvider
        // Dashboard
        .state('home', {
            url: "/",
            templateUrl: "/views/home/index.html",
            data: {
                pageTitle: 'Home Page'
            },
            controller: "HomeController",
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
                        files: [
                            '/controllers/HomeController.js'
                        ]
                    });
                }]
            }
        })
        // Dashboard
        .state('dashboard', {
            url: "/dashboard.html",
            templateUrl: "/views/home/dashboard.html",
            data: {
                pageTitle: 'Dashboard'
            },
            controller: "DashboardController",
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
                        files: [
                            '/assets/admin/pages/css/tasks.css',
                            '/assets/global/plugins/jquery.sparkline.min.js',
                            //'/assets/admin/pages/scripts/index3.js',
                            '/assets/admin/pages/scripts/tasks.js',
                            '/controllers/DashboardController.js'
                        ]
                    });
                }]
            }
        })
        // Error
        .state('error', {
            url: "/error",
            abstract: true,
            templateUrl: "/views/error/index.html",
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
                        files: [
                            '/assets/admin/pages/css/error.css'
                        ]
                    });
                }]
            }
        })
        .state('error.show', {
            parent: "error",
            url: "/{id:[0-9]{3}}",
            templateUrl: "/views/error/fiche.html",
            data: {
                pageTitle: 'Erreur'
            }
        })
        // Offer
        .state('offer', {
            url: "/offer",
            abstract: true,
            templateUrl: "/views/orders/index.html"
        })
        .state('offer.list', {
            url: "",
            templateUrl: "/views/orders/listoffer.html",
            data: {
                pageTitle: 'Liste des devis'
            },
            controller: "OfferListController"
        })
        .state('offer.show', {
            parent: 'offer',
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/orders/fiche.html",
            data: {
                pageTitle: 'Devis'
            },
            controller: "OrdersController"
        })
        .state('offer.show.detail', {
            templateUrl: "/views/orders/detail.html",
            data: {
                pageTitle: 'Devis'
            }
        })
        .state('offer.create', {
            parent: "offer",
            url: "/create.html",
            templateUrl: "/views/orders/detail.html",
            data: {
                pageTitle: 'Nouvelle offre'
            },
            controller: "OrdersController"
        })
        // Order
        .state('order', {
            url: "/order",
            abstract: true,
            templateUrl: "/views/orders/index.html"
        })
        .state('order.list', {
            url: "",
            templateUrl: "/views/orders/listorder.html",
            data: {
                pageTitle: 'Liste des commandes'
            },
            controller: "OrderListController"
        })
        .state('order.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/orders/fiche.html",
            data: {
                pageTitle: 'Commande'
            },
            controller: "OrdersController"
        })
        .state('order.show.detail', {
            templateUrl: "/views/orders/detail.html",
            data: {
                pageTitle: 'Commande'
            }
        })
        .state('order.create', {
            parent: "order",
            url: "/create.html",
            templateUrl: "/views/orders/detail.html",
            data: {
                pageTitle: 'Nouvelle commande'
            },
            controller: "OrdersController"
        })
        // Delivery
        .state('delivery', {
            url: "/delivery",
            abstract: true,
            templateUrl: "/views/orders/index.html"
        })
        .state('delivery.list', {
            url: "",
            templateUrl: "/views/orders/listdelivery.html",
            data: {
                pageTitle: 'Liste des bons de livraison'
            },
            controller: "DeliveryListController"
        })
        .state('delivery.show', {
            parent: "delivery",
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/orders/fiche.html",
            data: {
                pageTitle: 'Bon de livraison'
            },
            controller: "OrdersController"
        })
        .state('delivery.show.detail', {
            templateUrl: "/views/orders/detail.html",
            data: {
                pageTitle: 'Bon de livraison'
            }
        })
        .state('delivery.create', {
            parent: "delivery",
            url: "/create.html",
            templateUrl: "/views/orders/detail.html",
            data: {
                pageTitle: 'Nouveau bon de livraion'
            },
            controller: "OrdersController"
        })
        // Bill
        .state('bill', {
            url: "/bill",
            abstract: true,
            templateUrl: "/views/orders/index.html"
        })
        .state('bill.list', {
            url: "?Status",
            templateUrl: "/views/orders/listbill.html",
            data: {
                pageTitle: 'Liste des factures clients'
            },
            controller: "BillListController"
        })
        .state('bill.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/orders/fiche.html",
            data: {
                pageTitle: 'Facture client'
            },
            controller: "OrdersController"
        })
        .state('bill.show.detail', {
            templateUrl: "/views/orders/detail.html",
            data: {
                pageTitle: 'Facture client'
            }
        })
        .state('bill.show.payment', {
            url: "/payment",
            templateUrl: "/views/bank/paymentList.html",
            data: {
                pageTitle: 'Reglement client'
            },
            controller: "PaymentController"
        })
        .state('bill.show.payment.create', {
            //parent: "payment",
            url: "?societe&entity",
            templateUrl: "/views/bank/createPayment.html",
            data: {
                pageTitle: 'Nouveau règlement'
            },
            controller: "PaymentController"
        })
        .state('bill.create', {
            parent: "bill",
            url: "/create.html",
            templateUrl: "/views/orders/detail.html",
            data: {
                pageTitle: 'Nouvelle facture'
            },
            controller: "OrdersController"
        })
        // OrderSupplier
        .state('ordersupplier', {
            url: "/ordersupplier",
            abstract: true,
            templateUrl: "/views/suppliers/index.html"
        })
        .state('ordersupplier.list', {
            url: "",
            templateUrl: "/views/suppliers/listorder.html",
            data: {
                pageTitle: 'Liste des commandes'
            },
            controller: "OrderSupplierListController"
        })
        .state('ordersupplier.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/suppliers/fiche.html",
            data: {
                pageTitle: 'Commande'
            },
            controller: "OrdersController"
        })
        .state('ordersupplier.show.detail', {
            templateUrl: "/views/suppliers/detail.html",
            data: {
                pageTitle: 'Commande'
            }
        })
        .state('ordersupplier.create', {
            parent: "ordersupplier",
            url: "/create.html",
            templateUrl: "/views/suppliers/detail.html",
            data: {
                pageTitle: 'Nouvelle commande'
            },
            controller: "OrdersController"
        })
        // BillSupplier
        .state('billsupplier', {
            url: "/billsupplier",
            abstract: true,
            templateUrl: "/views/suppliers/index.html"
        })
        .state('billsupplier.list', {
            url: "",
            templateUrl: "/views/suppliers/listbill.html",
            data: {
                pageTitle: 'Liste des factures'
            },
            controller: "BillSupplierListController"
        })
        .state('billsupplier.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/suppliers/fiche.html",
            data: {
                pageTitle: 'Facture'
            },
            controller: "OrdersController"
        })
        .state('billsupplier.show.detail', {
            templateUrl: "/views/suppliers/detail.html",
            data: {
                pageTitle: 'Facture'
            }
        })
        .state('billsupplier.show.payment', {
            url: "/payment",
            templateUrl: "/views/bank/paymentList.html",
            data: {
                pageTitle: 'Reglement client'
            },
            controller: "PaymentController"
        })
        .state('billsupplier.show.payment.create', {
            //parent: "payment",
            url: "?societe&entity",
            templateUrl: "/views/bank/createPayment.html",
            data: {
                pageTitle: 'Nouveau règlement'
            },
            controller: "PaymentController"
        })
        .state('billsupplier.create', {
            parent: "billsupplier",
            url: "/create.html",
            templateUrl: "/views/suppliers/detail.html",
            data: {
                pageTitle: 'Nouvelle Facture'
            },
            controller: "OrdersController"
        })
        // OfferSupplier
        .state('offersupplier', {
            url: "/offersupplier",
            abstract: true,
            templateUrl: "/views/suppliers/index.html"
        })
        .state('offersupplier.list', {
            url: "",
            templateUrl: "/views/suppliers/listoffer.html",
            data: {
                pageTitle: 'Liste des devis'
            },
            controller: "OfferSupplierListController"
        })
        .state('offersupplier.show', {
            parent: 'offersupplier',
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/suppliers/fiche.html",
            data: {
                pageTitle: 'Devis'
            },
            controller: "OrdersController"
        })
        .state('offersupplier.show.detail', {
            templateUrl: "/views/suppliers/detail.html",
            data: {
                pageTitle: 'Devis'
            }
        })
        .state('offersupplier.create', {
            parent: "offersupplier",
            url: "/create.html",
            templateUrl: "/views/suppliers/detail.html",
            data: {
                pageTitle: 'Nouvelle offre'
            },
            controller: "OrdersController"
        })
        // Delivery Supplier
        .state('deliverysupplier', {
            url: "/deliverysupplier",
            abstract: true,
            templateUrl: "/views/suppliers/index.html"
        })
        .state('deliverysupplier.list', {
            url: "",
            templateUrl: "/views/suppliers/listdelivery.html",
            data: {
                pageTitle: 'Liste des bons de livraison'
            },
            controller: "DeliverySupplierListController"
        })
        .state('deliverysupplier.show', {
            parent: "deliverysupplier",
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/suppliers/fiche.html",
            data: {
                pageTitle: 'Bon de livraison'
            },
            controller: "OrdersController"
        })
        .state('deliverysupplier.show.detail', {
            templateUrl: "/views/suppliers/detail.html",
            data: {
                pageTitle: 'Bon de livraison'
            }
        })
        .state('deliverysupplier.create', {
            parent: "deliverysupplier",
            url: "/create.html",
            templateUrl: "/views/suppliers/detail.html",
            data: {
                pageTitle: 'Nouveau bon de livraion'
            },
            controller: "OrdersController"
        })
        // Orders Fab
        .state('ordersfab', {
            url: "/ordersfab",
            abstract: true,
            templateUrl: "/views/ordersfab/index.html"
        })
        .state('ordersfab.list', {
            url: "",
            templateUrl: "/views/ordersfab/listordersfab.html",
            data: {
                pageTitle: 'Liste des Ordres de fabrications'
            },
            controller: "OrdersFabListController"
        })
        .state('ordersfab.show', {
            parent: "ordersfab",
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/ordersfab/fiche.html",
            data: {
                pageTitle: 'Ordre de fabrication'
            },
            controller: "OrdersController"
        })
        .state('ordersfab.show.detail', {
            templateUrl: "/views/ordersfab/detail.html",
            data: {
                pageTitle: 'Ordre de fabrication'
            }
        })
        .state('ordersfab.create', {
            parent: "ordersfab",
            url: "/create.html",
            templateUrl: "/views/ordersfab/detail.html",
            data: {
                pageTitle: 'Nouvel ordre de fabrication'
            },
            controller: "OrdersController"
        })
        // Stock Return
        .state('stockreturn', {
            url: "/stockreturn",
            abstract: true,
            templateUrl: "/views/orders/index.html"
        })
        .state('stockreturn.list', {
            url: "",
            templateUrl: "/views/orders/liststockreturn.html",
            data: {
                pageTitle: 'Liste des retours'
            },
            controller: "StockReturnListController"
        })
        .state('stockreturn.create', {
            parent: "stockreturn",
            url: "/create.html",
            templateUrl: "/views/orders/detail.html",
            data: {
                pageTitle: 'Nouveau retour produit'
            },
            controller: "OrdersController"
        })
        .state('stockreturn.show', {
            parent: 'stockreturn',
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/orders/fiche.html",
            data: {
                pageTitle: 'Retour produit'
            },
            controller: "OrdersController"
        })
        .state('stockreturn.show.detail', {
            templateUrl: "/views/orders/detail.html",
            data: {
                pageTitle: 'Bon de retour'
            },
            controller: "OrdersController"
        })
        // Stock Correction
        .state('product.stockcorrection', {
            parent: "product",
            url: "/stockcorrectionlist",
            abstract: true,
            templateUrl: "/views/product/index.html"
        })
        .state('product.stockcorrection.list', {
            url: "",
            templateUrl: "/views/product/stockcorrectionlist.html",
            data: {
                pageTitle: 'Liste des corrections de stock'
            },
            controller: "ProductStockCorrectionController"
        })
        .state('product.stockcorrection.create', {
            url: "/create.html",
            templateUrl: "/views/product/stockcorrectionlistfiche.html",
            data: {
                pageTitle: 'Créer une correction de stock'
            },
            controller: "ProductStockCorrectionController"
        })
        .state('product.stockcorrection.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/product/stockcorrectionlistfiche.html",
            data: {
                pageTitle: 'Editer une correction de stock'
            },
            controller: "ProductStockCorrectionController"
        })
        // Stock Detail
        .state('product.stockdetail', {
            parent: "product",
            url: "/stockdetail",
            abstract: true,
            templateUrl: "/views/product/index.html"
        })
        .state('product.stockdetail.list', {
            url: "",
            templateUrl: "/views/product/stockdetail.html",
            data: {
                pageTitle: 'Liste des états de stock'
            },
            controller: "ProductStockDetailController"
        })
        // Stock transfert
        .state('product.stocktransfers', {
            parent: "product",
            url: "/stocktransfers",
            abstract: true,
            templateUrl: "/views/product/index.html"
        })
        .state('product.stocktransfers.list', {
            url: "",
            templateUrl: "/views/product/stocktransfers.html",
            data: {
                pageTitle: 'Liste des transferts de stock'
            },
            controller: "ProductStockTransfersController"
        })
        .state('product.stocktransfers.create', {
            parent: "",
            url: "/create.html",
            templateUrl: "/views/product/informations.html",
            data: {
                pageTitle: 'Nouveau produit / service'
            },
            controller: "ProductStockTransfersController"
        })
        // Stock Inventory
        .state('product.inventory', {
            parent: "product",
            url: "/inventory",
            abstract: true,
            templateUrl: "/views/product/index.html"
        })
        .state('product.inventory.list', {
            url: "",
            templateUrl: "/views/product/inventory.html",
            data: {
                pageTitle: 'Gestion des stock'
            },
            controller: "ProductInventoryController"
        })
        // Company
        .state('societe', {
            url: "/societe",
            abstract: true,
            templateUrl: "/views/company/index.html"
        })
        .state('societe.list', {
            url: "?type",
            templateUrl: "/views/company/list.html",
            data: {
                pageTitle: 'Liste des societes'
            },
            controller: "SocieteController"
        })
        .state('societe.list_supplier', {
            url: "/supplier?type",
            templateUrl: "/views/company/list_supplier.html",
            data: {
                pageTitle: 'Liste des fournisseurs'
            },
            controller: "SocieteController"
        })
        .state('societe.show', {
            parent: "societe",
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/company/fiche.html",
            data: {
                pageTitle: 'Fiche societe'
            },
            controller: "SocieteController"
        })
        .state('societe.show.company', {
            templateUrl: "/views/company/company.html",
            data: {
                pageTitle: 'Fiche societe'
            }
        })
        /*.state('societe.show.person', {
            url: "/person",
            templateUrl: "/views/company/company.html", //TODO company > person
            data: {
                pageTitle: 'Fiche societe'
            }
        })*/
        .state('societe.show.commercial', {
            url: "/commercial",
            templateUrl: "/views/company/commercial.html",
            data: {
                pageTitle: 'Fiche societe'
            }
        })
        .state('societe.show.addresses', {
            url: "/addresses",
            templateUrl: "/views/company/addresses.html",
            data: {
                pageTitle: 'Fiche societe'
            }
        })
        .state('societe.show.billing', {
            url: "/billing",
            templateUrl: "/views/company/billing.html",
            data: {
                pageTitle: 'Fiche societe'
            }
        })
        .state('societe.show.task', {
            url: "/task",
            templateUrl: "/views/company/task.html",
            data: {
                pageTitle: 'Fiche societe'
            }
        })
        .state('societe.show.files', {
            url: "/files",
            templateUrl: "/views/company/files.html",
            data: {
                pageTitle: 'Fiche societe'
            }
        })
        .state('societe.show.feeds', {
            url: "/feeds",
            templateUrl: "/views/company/feeds.html",
            data: {
                pageTitle: 'Fiche societe'
            }
        })
        .state('societe.show.stats', {
            url: "/stats",
            templateUrl: "/views/company/stats.html",
            data: {
                pageTitle: 'Fiche societe'
            }
        })
        .state('societe.create', {
            parent: "societe",
            url: "/create.html",
            templateUrl: "/views/company/company.html",
            data: {
                pageTitle: 'Creation clients/fournisseur'
            },
            controller: "SocieteController"
        })
        .state('societe.stats', {
            parent: "societe",
            url: "/stats",
            templateUrl: "/views/company/stats.html",
            data: {
                pageTitle: 'Statistiques client'
            },
            controller: "SocieteStatsController"
        })
        // Contact
        .state('contact', {
            url: "/contact",
            abstract: true,
            templateUrl: "/views/contact/index.html"
        })
        .state('contact.list', {
            url: "",
            templateUrl: "/views/contact/list.html",
            data: {
                pageTitle: 'Liste des contacts'
            },
            controller: "ContactController"
        })
        .state('contact.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/contact/fiche.html",
            data: {
                pageTitle: 'Fiche contact'
            },
            controller: "ContactController"
        })
        .state('contact.create', {
            parent: "contact",
            url: "/create.html?societe",
            templateUrl: "/views/contact/create.html",
            data: {
                pageTitle: 'Creation contact'
            },
            controller: "ContactController"
        })
        // Product / services
        .state('product', {
            url: "/product",
            abstract: true,
            templateUrl: "/views/product/index.html"
        })
        .state('product.list', {
            parent: "product",
            url: "",
            templateUrl: "/views/product/list.html",
            data: {
                pageTitle: 'Liste des produits / services'
            },
            controller: "ProductListController"
        })
        .state('product.show', {
            url: "/{id:[0-9a-z]{24}}",
            //abstract: true,
            templateUrl: "/views/product/fiche.html",
            data: {
                pageTitle: 'Fiche produit / service'
            },
            controller: "ProductController"
        })
        .state('product.show.images', {
            url: "/images",
            templateUrl: "/views/product/productImages.html",
            data: {
                pageTitle: 'Images'
            }
        })
        .state('product.create', {
            parent: "product",
            url: "/create.html",
            templateUrl: "/views/product/informations.html",
            data: {
                pageTitle: 'Nouveau produit / service'
            },
            controller: "ProductController"
        })
        .state('product.pricelist', {
            parent: "product",
            url: "/pricelevel.html?priceListId",
            templateUrl: "/views/product/pricelist.html",
            data: {
                pageTitle: 'Liste de prix'
            },
            controller: "ProductPriceListController"
        })
        .state('product.consumption', {
            parent: "product",
            url: "/consumption.html",
            templateUrl: "/views/product/consumption.html",
            data: {
                pageTitle: 'Statistiques de consommation des produits'
            },
            controller: "ProductStatsController"
        })
        .state('product.images', {
            parent: "product",
            url: "/images.html",
            templateUrl: "/views/product/images.html",
            data: {
                pageTitle: 'Banques d\'images des produits'
            },
            controller: "ProductBankImagesController"
        })
        // Attributes
        .state('product.attributes', {
            parent: "product",
            url: "/attributeslist",
            abstract: true,
            templateUrl: "/views/product/index.html"
        })
        .state('product.attributes.list', {
            url: "",
            templateUrl: "/views/product/attributeslist.html",
            data: {
                pageTitle: 'Liste des Attributs de produits'
            },
            controller: "SettingProductController"
        })
        .state('product.attributes.create', {
            url: "/create.html",
            templateUrl: "/views/product/attributeslistfiche.html",
            data: {
                pageTitle: 'Ajouter un attribut'
            },
            controller: "SettingProductController"
        })
        .state('product.attributes.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/product/attributeslistfiche.html",
            data: {
                pageTitle: 'Editer un attribut'
            },
            controller: "SettingProductController"
        })
        // Categories
        .state('product.categories', {
            parent: "product",
            url: "/productcategories",
            templateUrl: "/views/product/productcategories.html",
            data: {
                pageTitle: 'Configuration des categories'
            },
            controller: "CategoryController"
        })
        // Family configuration
        .state('product.family', {
            parent: "product",
            url: "/familyproductlist",
            abstract: true,
            templateUrl: "/views/product/index.html"
        })
        .state('product.family.list', {
            url: "",
            templateUrl: "/views/product/familyproductlist.html",
            data: {
                pageTitle: 'Liste des familles de produits'
            },
            controller: "SettingProductController"
        })
        .state('product.family.create', {
            url: "/create.html",
            templateUrl: "/views/product/familyproductlistfiche.html",
            data: {
                pageTitle: 'Créer une famille de produit'
            },
            controller: "SettingProductController"
        })
        .state('product.family.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/product/familyproductlistfiche.html",
            data: {
                pageTitle: 'Editer une famille de produit'
            },
            controller: "SettingProductController"
        })
        // ---- //
        .state('product.visual', {
            parent: "product",
            url: "/visual/{id:[0-9a-z]{24}}",
            templateUrl: "/views/product/productvisual.html",
            data: {
                pageTitle: 'Fiche produit print'
            },
            controller: "ProductController"
        })
        // marketing
        .state("product.show.marketing", {
            url: "/marketing",
            templateUrl: "/views/product/marketing.html",
            data: {
                pageTitle: 'Marketing - Product'
            }
        })
        // attributes
        .state("product.show.attributes", {
            url: "/attributes",
            templateUrl: "/views/product/attributes.html",
            data: {
                pageTitle: 'Attributes - Product'
            }
        })
        // information
        .state("product.show.informations", {
            templateUrl: "/views/product/informations.html",
            data: {
                pageTitle: 'Informations - Product'
            }
        })
        // price
        .state("product.show.price", {
            url: "/price",
            templateUrl: "/views/product/price.html",
            data: {
                pageTitle: 'Prices - Product'
            }
        })
        // associations
        .state("product.show.categories", {
            url: "/categories",
            templateUrl: "/views/product/categories.html",
            data: {
                pageTitle: 'Categories - Product '
            },
            controller: "CategoryController"
        })
        // declinaisons
        .state("product.show.declinations", {
            url: "/declinations",
            templateUrl: "/views/product/declinations.html",
            data: {
                pageTitle: 'Declinaisons - Product '
            }
        })
        // stocks
        .state("product.show.stock", {
            url: "/stock",
            templateUrl: "/templates/product/stock.html",
            data: {
                pageTitle: 'Stock - Product '
            }
        })
        // ecommerce
        .state("product.show.ecommerce", {
            url: "/ecommerce",
            templateUrl: "/views/product/ecommerce.html",
            data: {
                pageTitle: 'Ecommerce - Product '
            }
        })
        .state("product.show.bundles", {
            url: "/bundle",
            templateUrl: "/views/product/bundles.html",
            data: {
                pageTitle: 'Compositions - Product '
            }
        })
        .state("product.show.packaging", {
            url: "/packaging",
            templateUrl: "/views/product/packaging.html",
            data: {
                pageTitle: 'Conditionnement / lots'
            }
        })
        // channels
        .state("product.show.channels", {
            url: "/channels",
            templateUrl: "/views/product/channels.html",
            data: {
                pageTitle: 'Canaux - Integration'
            }
        })
        .state('product.show.stats', {
            url: "/stats",
            templateUrl: "/views/product/stats.html",
            data: {
                pageTitle: 'Statistiques produits'
            }
        })
        // Bank/Payment
        .state('bank', {
            url: "/bank",
            abstract: true,
            templateUrl: "/views/bank/index.html"
        })
        .state('task', {
            url: "/task",
            abstract: true,
            templateUrl: "/views/task/index.html",
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
                        files: [
                            '/assets/apps/css/todo.css'
                        ]
                    });
                }]
            }
        })
        .state('task.list', {
            url: "",
            templateUrl: "/views/task/list.html",
            data: {
                pageTitle: 'Liste des taches'
            },
            controller: "TaskController"
        })
        .state('task.todo', {
            url: "/todo?menuclose?group",
            templateUrl: "/views/task/todo.html",
            data: {
                pageTitle: 'Liste des tâches'
            },
            controller: "TaskController"
        })
        .state('task.show', {
            parent: "task",
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/task/fiche.html",
            data: {
                pageTitle: 'Tâche'
            },
            controller: "TaskController"
        })
        .state('task.create', {
            parent: "task",
            url: "/create.html?societe",
            templateUrl: "/views/task/fiche.html",
            data: {
                pageTitle: 'Création d\'une tâche'
            },
            controller: "TaskController"
        })
        .state('accounting', {
            url: "/accounting",
            abstract: true,
            templateUrl: "/views/accounting/index.html"
            /*resolve: {
                deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                        return $ocLazyLoad.load({
                            name: 'MetronicApp',
                            insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
                            files: [
                                '/assets/global/plugins/bootstrap-daterangepicker/daterangepicker-bs3.css',
                                '/assets/global/plugins/bootstrap-daterangepicker/moment.min.js',
                                '/assets/global/plugins/bootstrap-daterangepicker/daterangepicker.js'
                            ]
                        });
                    }]
            }*/
        })
        .state('accounting.journal', {
            parent: "accounting",
            url: "/journal?journal&account",
            templateUrl: "/views/accounting/journal.html",
            data: {
                pageTitle: 'Journaux'
            },
            controller: "AccountingController"
        })
        .state('accounting.bank', {
            parent: "accounting",
            url: "/bank?bank",
            templateUrl: "/views/accounting/bank.html",
            data: {
                pageTitle: 'Releves bancaires'
            },
            controller: "AccountingController"
        })
        .state('accounting.estimated', {
            parent: "accounting",
            url: "/estimated",
            templateUrl: "/views/accounting/estimated.html",
            data: {
                pageTitle: 'Previsionnel'
            },
            controller: "AccountingController"
        })
        .state('accounting.balance', {
            parent: "accounting",
            url: "/balance",
            templateUrl: "/views/accounting/balance.html",
            data: {
                pageTitle: 'Balance comptable'
            },
            controller: "AccountingBalanceController"
        })
        // Report
        .state('report', {
            url: "/report",
            abstract: true,
            templateUrl: "/views/report/index.html"
        })
        /*.state('contact.list', {
         url: "",
         templateUrl: "/views/contact/list.html",
         data: {
         pageTitle: 'Liste des societes'
         },
         controller: "ContactController"
         })*/
        .state('report.show', {
            parent: "report",
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/report/fiche.html",
            data: {
                pageTitle: 'Fiche compte-rendu'
            },
            controller: "ReportController"
        })
        .state('report.create', {
            parent: "report",
            url: "/create.html?societe",
            templateUrl: "/views/report/create.html",
            data: {
                pageTitle: 'Creation compte-rendu'
            },
            controller: "reportController"
        })
        // Stock
        .state('stock', {
            url: "/stock",
            abstract: true,
            templateUrl: "/views/stock/index.html"
        })
        .state('stock.list', {
            url: "",
            templateUrl: "/views/stock/list.html",
            data: {
                pageTitle: 'Mouvements de stock'
            },
            controller: "StockController"
        })
        .state('stock.inventory', {
            parent: "stock",
            url: "/inventory.html",
            templateUrl: "/views/stock/inventory.html",
            data: {
                pageTitle: 'Etat des stocks'
            },
            controller: "StockController",
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        name: 'MetronicApp',
                        insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
                        files: [
                            '/assets/global/plugins/jquery-barcode/jquery-barcode.min.js'
                        ]
                    });
                }]
            }
        })
        .state('europexpress', {
            url: "/europexpress",
            abstract: true,
            templateUrl: "/views/_europexpress/index.html"
        })
        .state('europexpress.transport', {
            parent: "europexpress",
            url: "/transport",
            templateUrl: "/views/_europexpress/transport.html",
            data: {
                pageTitle: 'Transports'
            },
            controller: "EETransportController"
        })
        .state('europexpress.transport_edit', {
            parent: "europexpress",
            url: "/transport/{id:[0-9a-z]{24}}",
            templateUrl: "/views/_europexpress/transport_edit.html",
            data: {
                pageTitle: 'Modification transports'
            },
            controller: "EETransportEditController"
        })
        .state('europexpress.transport_create', {
            parent: "europexpress",
            url: "/transport/create.html",
            templateUrl: "/views/_europexpress/transport_create.html",
            data: {
                pageTitle: 'Nouveau transport'
            },
            controller: "EETransportEditController"
        })
        .state('europexpress.transport_createmessagerie', {
            parent: "europexpress",
            url: "/transport/create_messagerie.html",
            templateUrl: "/views/_europexpress/transport_createmessagerie.html",
            data: {
                pageTitle: 'Nouvelle messagerie'
            },
            controller: "EETransportEditController"
        })
        .state('europexpress.planning', {
            parent: "europexpress",
            url: "/planning.html?week&year",
            templateUrl: "/views/_europexpress/planning.html",
            data: {
                pageTitle: 'Gestion des plannings'
            },
            controller: "EEPlanningController"
        })
        .state('europexpress.dhl', {
            parent: "europexpress",
            url: "/dhl.html",
            templateUrl: "/views/_europexpress/dhl.html",
            data: {
                pageTitle: 'Donnees DHL'
            },
            controller: "EEDHLController"
        })
        //Absence
        .state('europexpress.absence', {
            parent: "europexpress",
            url: "/absence.html",
            templateUrl: "/views/_europexpress/absence.html",
            data: {
                pageTitle: 'Gestion des congés/absences'
            },
            controller: "UserRhAbsenceController"
        })
        .state('europexpress.absence.create', {
            parent: "europexpress",
            url: "/absencecreate.html",
            templateUrl: "/views/_europexpress/absencecreate.html",
            data: {
                pageTitle: 'Gestion des congés/absences'
            },
            controller: "UserRhAbsenceController"
        })
        .state('europexpress.absence.show', {
            parent: "europexpress",
            url: "/absence/{id:[0-9a-z]{24}}",
            templateUrl: "/views/_europexpress/absenceedit.html",
            data: {
                pageTitle: 'Gestion des congés/absences'
            },
            controller: "UserRhAbsenceController"
        })
        //Vehicule
        .state('europexpress.vehicule', {
            parent: "europexpress",
            url: "/list_vehicule.html",
            templateUrl: "/views/_europexpress/list_vehicule.html",
            data: {
                pageTitle: 'Gestion des véhicules'
            },
            controller: "EEVehiculeController"
        })
        .state('europexpress.vehicule.create', {
            parent: "europexpress",
            url: "/list_vehiculecreate.html",
            templateUrl: "/views/_europexpress/list_vehiculecreate.html",
            data: {
                pageTitle: 'Gestion des véhicules'
            },
            controller: "EEVehiculeController"
        })
        .state('europexpress.vehicule.show', {
            parent: "europexpress",
            url: "/vehicules/{id:[0-9a-z]{24}}",
            templateUrl: "/views/_europexpress/list_vehiculeshow.html",
            data: {
                pageTitle: 'Gestion des véhicules'
            },
            controller: "EEVehiculeController"
        })
        .state('europexpress.billing', {
            parent: "europexpress",
            url: "/facturation.html?month&year&tab",
            templateUrl: "/views/_europexpress/facturation.html",
            data: {
                pageTitle: 'Pré-facturation'
            },
            controller: "EEFacturationController"
        })
        .state('europexpress.billing.planning', {
            parent: "europexpress",
            url: "/suiviplanning.html?month&year",
            templateUrl: "/views/_europexpress/suiviplanning.html",
            data: {
                pageTitle: 'Suivi Planning'
            },
            controller: "EESuiviPlanningController"
        })
        .state('europacourses', {
            url: "/europacourses",
            abstract: true,
            templateUrl: "/views/_europacourses/index.html"
        })
        .state('europacourses.mouvement', {
            parent: "europacourses",
            url: "/mouvement",
            templateUrl: "/views/_europacourses/mouvement.html",
            data: {
                pageTitle: 'Mouvements de stocks'
            },
            controller: "ECMouvementController"
        })
        .state('europacourses.etatstockprod', {
            parent: "europacourses",
            url: "/etatstockProd",
            templateUrl: "/views/_europacourses/etatstockprod.html",
            data: {
                pageTitle: 'Liste des stocks par référence produit'
            },
            controller: "ECMouvementController"
        })
        .state('europacourses.etatstockspot', {
            parent: "europacourses",
            url: "/etatstockSpot",
            templateUrl: "/views/_europacourses/etatstockspot.html",
            data: {
                pageTitle: 'Liste des stocks par emplacement'
            },
            controller: "ECMouvementController"
        })
        .state('europacourses.inventaire', {
            parent: "europacourses",
            url: "/inventaire?sn",
            templateUrl: "/views/_europacourses/inventaire.html",
            data: {
                pageTitle: 'Inventaires'
            },
            controller: "ECMouvementController"
        })
        .state('europacourses.facturation', {
            parent: "europacourses",
            url: "/facturation",
            templateUrl: "/views/_europacourses/facturation.html",
            data: {
                pageTitle: 'Facturation'
            },
            controller: "ECMouvementController"
        })
        // User Profile
        .state('user', {
            url: "/user",
            abstract: true,
            templateUrl: "/views/settings/user/index.html"
        })
        .state('user.list', {
            url: "",
            templateUrl: "/views/settings/user/list.html",
            data: {
                pageTitle: 'Liste des utilisateurs'
            },
            controller: "UserController"
        })
        .state('user.create', {
            parent: "user",
            url: "/create.html",
            templateUrl: "/views/settings/user/fiche.html",
            data: {
                pageTitle: 'Nouvel utilisateur'
            },
            controller: "UserController"
        })
        .state('user.show', {
            parent: "user",
            url: "/{id}",
            templateUrl: "/views/settings/user/fiche.html",
            data: {
                pageTitle: 'Fiche collaborateur'
            },
            controller: "UserController"
        })
        // Menu employees
        .state('employee', {
            url: "/employee",
            abstract: true,
            templateUrl: "/views/employees/index.html"
        })
        .state('employee.list', {
            url: "",
            templateUrl: "/views/employees/list.html",
            data: {
                pageTitle: 'Liste des collaborateurs'
            },
            controller: "EmployeeController"
        })
        .state('employee.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/employees/fiche.html",
            data: {
                pageTitle: 'Fiche Collaborateur'
            },
            controller: "EmployeeController"
        })
        .state('employee.create', {
            parent: "employee",
            url: "/create.html",
            templateUrl: "/views/employees/main.html",
            data: {
                pageTitle: 'Nouveau Collaborateur'
            },
            controller: "EmployeeController"
        })
        // Main
        .state("employee.show.main", {
            templateUrl: "/views/employees/main.html",
            data: {
                pageTitle: 'Main'
            }
        })
        // Files
        .state('employee.show.files', {
            url: "/files",
            templateUrl: "/views/employees/files.html",
            data: {
                pageTitle: 'Images / Documents'
            }
        })
        // Personnal Information
        .state("employee.show.personnalinformation", {
            url: "/PersonnalInformation",
            templateUrl: "/views/employees/personnal.html",
            data: {
                pageTitle: 'PersonnalInformation'
            }
        }) // Job
        .state("employee.show.job", {
            url: "/Job",
            templateUrl: "/views/employees/job.html",
            data: {
                pageTitle: 'Job'
            }
        })
        // Assignees
        .state("employee.show.assignees", {
            url: "/assignees",
            templateUrl: "/views/employees/assignees.html",
            data: {
                pageTitle: 'Affectation'
            }
        })
        // Group management
        .state('group', {
            url: "/group",
            abstract: true,
            templateUrl: "/views/settings/group/index.html"
        })
        .state('group.list', {
            url: "",
            templateUrl: "/views/settings/group/list.html",
            data: {
                pageTitle: 'Liste des utilisateurs'
            },
            controller: "GroupController"
        })
        .state('group.create', {
            parent: "group",
            url: "/create.html",
            templateUrl: "/views/settings/group/create.html",
            data: {
                pageTitle: 'Nouveau groupe'
            },
            controller: "GroupController"
        })
        .state('group.show', {
            parent: "group",
            url: "/{id}",
            templateUrl: "/views/settings/group/fiche.html",
            data: {
                pageTitle: 'Fiche groupe'
            },
            controller: "GroupController"
        })
        // Gestion des Paiements grouped
        .state('payment', {
            parent: "bank",
            url: "/payment",
            abstract: true,
            templateUrl: "/views/bank/index.html"
        })
        .state('payment.chq', {
            url: "/chq",
            abstract: true,
            templateUrl: "/views/bank/index.html"
        })
        .state('payment.chq.list', {
            url: "?Status",
            templateUrl: "/views/bank/listGroupChq.html",
            data: {
                pageTitle: 'Liste des remises de cheques'
            },
            controller: "PaymentGroupController"
        })
        .state('payment.chq.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/bank/ficheGroupChq.html",
            data: {
                pageTitle: 'Remise de cheque'
            },
            controller: "PaymentGroupController"
        })
        .state('payment.chq.create', {
            url: "/create.html",
            templateUrl: "/views/bank/createGroupChq.html",
            data: {
                pageTitle: 'Nouvelle remise de cheque'
            },
            controller: "PaymentGroupController"
        })
        // Gestion des LCR
        .state('payment.lcr', {
            url: "/lcr",
            abstract: true,
            templateUrl: "/views/_lcr/index.html"
        })
        .state('payment.lcr.list', {
            url: "?Status",
            templateUrl: "/views/_lcr/list.html",
            data: {
                pageTitle: 'Liste des LCR clients'
            },
            controller: "LcrController"
        })
        .state('payment.lcr.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/_lcr/fiche.html",
            data: {
                pageTitle: 'LCR client'
            },
            controller: "LcrController"
        })
        .state('payment.lcr.create', {
            url: "/create.html",
            templateUrl: "/views/_lcr/create.html",
            data: {
                pageTitle: 'Nouveau LCR client'
            },
            controller: "LcrController"
        })
        // General settings
        .state('settings', {
            url: "/settings",
            abstract: true,
            templateUrl: "/views/settings/index.html"
        })
        //General Configuration
        .state('settings.general', {
            url: "/general",
            templateUrl: "/views/settings/general.html",
            data: {
                pageTitle: 'Configuration general'
            },
            controller: "SettingGeneralController"
        })
        //Entites Configuration
        .state('settings.entity', {
            url: "/entity",
            abstract: true,
            templateUrl: "/views/settings/entities/index.html"
        })
        .state('settings.entity.list', {
            url: "",
            templateUrl: "/views/settings/entities/list.html",
            data: {
                pageTitle: 'Configuration des organisations'
            },
            controller: "SettingEntityController"
        })
        .state('settings.entity.create', {
            url: "/create.html",
            templateUrl: "/views/settings/entities/fiche.html",
            data: {
                pageTitle: 'Creation d\'une organisation'
            },
            controller: "SettingEntityController"
        })
        .state('settings.entity.show', {
            url: "/{id}",
            templateUrl: "/views/settings/entities/fiche.html",
            data: {
                pageTitle: 'Configuration de l\'organisation'
            },
            controller: "SettingEntityController"
        })
        //Product Configuration
        .state('settings.product', {
            url: "/product",
            templateUrl: "/views/settings/product.html",
            data: {
                pageTitle: 'Configuration des produits'
            }
        })
        // warehouse
        .state('settings.product.warehouse', {
            url: "/warehouse",
            templateUrl: "/views/settings/warehouse/list.html",
            data: {
                pageTitle: 'Configuration des entrepots'
            },
            controller: "SettingProductController"
        })
        .state('settings.product.warehouse.create', {
            url: "/create.html",
            templateUrl: "/views/settings/warehouse/fiche.html",
            data: {
                pageTitle: 'Ajouter un entrepot'
            },
            controller: "SettingProductController"
        })
        .state('settings.product.warehouse.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/settings/warehouse/fiche.html",
            data: {
                pageTitle: 'Editer un entrepot'
            },
            controller: "SettingProductController"
        })
        // prices configuration
        .state('settings.product.pricelists', {
            url: "/pricelists",
            templateUrl: "/views/settings/pricelists/list.html",
            data: {
                pageTitle: 'Configuration des listes de prix'
            },
            controller: "SettingProductController"
        })
        .state('settings.product.pricelists.create', {
            url: "/create.html",
            templateUrl: "/views/settings/pricelists/fiche.html",
            data: {
                pageTitle: 'Ajouter une liste de prix'
            },
            controller: "SettingProductController"
        })
        .state('settings.product.pricelists.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/settings/pricelists/fiche.html",
            data: {
                pageTitle: 'Editer une liste de prix'
            },
            controller: "SettingProductController"
        })
        // product types configuration
        .state('settings.product.types', {
            url: "/types",
            templateUrl: "/views/settings/productTypes/list.html",
            data: {
                pageTitle: 'Configuration des types de produits'
            },
            controller: "SettingProductController"
        })
        .state('settings.product.types.create', {
            url: "/create.html",
            templateUrl: "/views/settings/productTypes/fiche.html",
            data: {
                pageTitle: 'Ajouter un type de produit'
            },
            controller: "SettingProductController"
        })
        .state('settings.product.types.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/settings/productTypes/fiche.html",
            data: {
                pageTitle: 'Editer un type de produit'
            },
            controller: "SettingProductController"
        })
        // shipping configuration
        .state('settings.product.shipping', {
            url: "/shipping",
            templateUrl: "/views/settings/shipping/list.html",
            data: {
                pageTitle: 'Configuration des transports'
            },
            controller: "SettingProductController"
        })
        .state('settings.product.shipping.create', {
            url: "/create.html",
            templateUrl: "/views/settings/shipping/create.html",
            data: {
                pageTitle: 'Ajouter un transport'
            },
            controller: "SettingProductController"
        })
        .state('settings.product.shipping.show', {
            url: "/{id:[0-9a-z]{24}}",
            templateUrl: "/views/settings/shipping/fiche.html",
            data: {
                pageTitle: 'Editer un tranport'
            },
            controller: "SettingProductController"
        })
        //Integration Configuration
        .state('settings.integration', {
            parent: "settings",
            url: "/integration",
            templateUrl: "/views/settings/integration.html",
            data: {
                pageTitle: 'Gestion des integrations'
            },
            controller: "SettingIntegrationController"
        })
    /*
     // AngularJS plugins
     .state('fileupload', {
     url: "/file_upload.html",
     templateUrl: "/views/file_upload.html",
     data: {pageTitle: 'AngularJS File Upload', pageSubTitle: 'angularjs file upload'},
     controller: "GeneralPageController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load([{
     name: 'angularFileUpload',
     files: [
     '/assets/global/plugins/angularjs/plugins/angular-file-upload/angular-file-upload.min.js'
     ]
     }, {
     name: 'MetronicApp',
     files: [
     '/controllers/GeneralPageController.js'
     ]
     }]);
     }]
     }
     })
     
     // UI Select
     .state('uiselect', {
     url: "/ui_select.html",
     templateUrl: "/views/ui_select.html",
     data: {pageTitle: 'AngularJS Ui Select', pageSubTitle: 'select2 written in angularjs'},
     controller: "UISelectController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load([{
     name: 'ui.select',
     insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
     files: [
     '/assets/global/plugins/angularjs/plugins/ui-select/select.min.css',
     '/assets/global/plugins/angularjs/plugins/ui-select/select.min.js'
     ]
     }, {
     name: 'MetronicApp',
     files: [
     '/controllers/UISelectController.js'
     ]
     }]);
     }]
     }
     })
     
     // UI Bootstrap
     .state('uibootstrap', {
     url: "/ui_bootstrap.html",
     templateUrl: "/views/ui_bootstrap.html",
     data: {pageTitle: 'AngularJS UI Bootstrap', pageSubTitle: 'bootstrap components written in angularjs'},
     controller: "GeneralPageController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load([{
     name: 'MetronicApp',
     files: [
     '/controllers/GeneralPageController.js'
     ]
     }]);
     }]
     }
     })
     
     // Tree View
     .state('tree', {
     url: "/tree",
     templateUrl: "/views/tree.html",
     data: {pageTitle: 'jQuery Tree View', pageSubTitle: 'tree view samples'},
     controller: "GeneralPageController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load([{
     name: 'MetronicApp',
     insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
     files: [
     '/assets/global/plugins/jstree/dist/themes/default/style.min.css',
     '/assets/global/plugins/jstree/dist/jstree.min.js',
     '/assets/admin/pages/scripts/ui-tree.js',
     '/controllers/GeneralPageController.js'
     ]
     }]);
     }]
     }
     })
     
     // Form Tools
     .state('formtools', {
     url: "/form-tools",
     templateUrl: "/views/form_tools.html",
     data: {pageTitle: 'Form Tools', pageSubTitle: 'form components & widgets sample'},
     controller: "GeneralPageController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load([{
     name: 'MetronicApp',
     insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
     files: [
     '/assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.css',
     '/assets/global/plugins/bootstrap-switch/css/bootstrap-switch.min.css',
     '/assets/global/plugins/jquery-tags-input/jquery.tagsinput.css',
     '/assets/global/plugins/bootstrap-markdown/css/bootstrap-markdown.min.css',
     '/assets/global/plugins/typeahead/typeahead.css',
     '/assets/global/plugins/fuelux/js/spinner.min.js',
     '/assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.js',
     '/assets/global/plugins/jquery-inputmask/jquery.inputmask.bundle.min.js',
     '/assets/global/plugins/jquery.input-ip-address-control-1.0.min.js',
     '/assets/global/plugins/bootstrap-pwstrength/pwstrength-bootstrap.min.js',
     '/assets/global/plugins/bootstrap-switch/js/bootstrap-switch.min.js',
     '/assets/global/plugins/jquery-tags-input/jquery.tagsinput.min.js',
     '/assets/global/plugins/bootstrap-maxlength/bootstrap-maxlength.min.js',
     '/assets/global/plugins/bootstrap-touchspin/bootstrap.touchspin.js',
     '/assets/global/plugins/typeahead/handlebars.min.js',
     '/assets/global/plugins/typeahead/typeahead.bundle.min.js',
     '/assets/admin/pages/scripts/components-form-tools.js',
     '/controllers/GeneralPageController.js'
     ]
     }]);
     }]
     }
     })
     
     // Date & Time Pickers
     .state('pickers', {
     url: "/pickers",
     templateUrl: "/views/pickers.html",
     data: {pageTitle: 'Date & Time Pickers', pageSubTitle: 'date, time, color, daterange pickers'},
     controller: "GeneralPageController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load([{
     name: 'MetronicApp',
     insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
     files: [
     '/assets/global/plugins/clockface/css/clockface.css',
     '/assets/global/plugins/bootstrap-datepicker/css/datepicker3.css',
     '/assets/global/plugins/bootstrap-timepicker/css/bootstrap-timepicker.min.css',
     '/assets/global/plugins/bootstrap-colorpicker/css/colorpicker.css',
     '/assets/global/plugins/bootstrap-daterangepicker/daterangepicker-bs3.css',
     '/assets/global/plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css',
     '/assets/global/plugins/bootstrap-datepicker/js/bootstrap-datepicker.js',
     '/assets/global/plugins/bootstrap-timepicker/js/bootstrap-timepicker.min.js',
     '/assets/global/plugins/clockface/js/clockface.js',
     '/assets/global/plugins/bootstrap-daterangepicker/moment.min.js',
     '/assets/global/plugins/bootstrap-daterangepicker/daterangepicker.js',
     '/assets/global/plugins/bootstrap-colorpicker/js/bootstrap-colorpicker.js',
     '/assets/global/plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js',
     '/assets/admin/pages/scripts/components-pickers.js',
     '/controllers/GeneralPageController.js'
     ]
     }]);
     }]
     }
     })
     
     // Custom Dropdowns
     .state('dropdowns', {
     url: "/dropdowns",
     templateUrl: "/views/dropdowns.html",
     data: {pageTitle: 'Custom Dropdowns', pageSubTitle: 'select2 & bootstrap select dropdowns'},
     controller: "GeneralPageController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load([{
     name: 'MetronicApp',
     insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
     files: [
     '/assets/global/plugins/bootstrap-select/bootstrap-select.min.css',
     '/assets/global/plugins/select2/select2.css',
     '/assets/global/plugins/jquery-multi-select/css/multi-select.css',
     '/assets/global/plugins/bootstrap-select/bootstrap-select.min.js',
     '/assets/global/plugins/select2/select2.min.js',
     '/assets/global/plugins/jquery-multi-select/js/jquery.multi-select.js',
     '/assets/admin/pages/scripts/components-dropdowns.js',
     '/controllers/GeneralPageController.js'
     ]
     }]);
     }]
     }
     })
     
     // Advanced Datatables
     .state('datatablesAdvanced', {
     url: "/datatables/advanced.html",
     templateUrl: "/views/datatables/advanced.html",
     data: {pageTitle: 'Advanced Datatables', pageSubTitle: 'advanced datatables samples'},
     controller: "GeneralPageController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load({
     name: 'MetronicApp',
     insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
     files: [
     '/assets/global/plugins/select2/select2.css',
     '/assets/global/plugins/datatables/plugins/bootstrap/dataTables.bootstrap.css',
     '/assets/global/plugins/datatables/extensions/Scroller/css/dataTables.scroller.min.css',
     '/assets/global/plugins/datatables/extensions/ColReorder/css/dataTables.colReorder.min.css',
     '/assets/global/plugins/select2/select2.min.js',
     '/assets/global/plugins/datatables/all.min.js',
     '/scripts/table-advanced.js',
     '/controllers/GeneralPageController.js'
     ]
     });
     }]
     }
     })
     
     // Ajax Datetables
     .state('datatablesAjax', {
     url: "/datatables/ajax.html",
     templateUrl: "/views/datatables/ajax.html",
     data: {pageTitle: 'Ajax Datatables', pageSubTitle: 'ajax datatables samples'},
     controller: "GeneralPageController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load({
     name: 'MetronicApp',
     insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
     files: [
     '/assets/global/plugins/select2/select2.css',
     '/assets/global/plugins/bootstrap-datepicker/css/datepicker.css',
     '/assets/global/plugins/datatables/plugins/bootstrap/dataTables.bootstrap.css',
     '/assets/global/plugins/bootstrap-datepicker/js/bootstrap-datepicker.js',
     '/assets/global/plugins/select2/select2.min.js',
     '/assets/global/plugins/datatables/all.min.js',
     '/assets/global/scripts/datatable.js',
     '/scripts/table-ajax.js',
     '/controllers/GeneralPageController.js'
     ]
     });
     }]
     }
     })
     
     // User Profile
     .state("profile", {
     url: "/profile",
     templateUrl: "/views/profile/main.html",
     data: {pageTitle: 'User Profile', pageSubTitle: 'user profile sample'},
     controller: "UserProfileController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load({
     name: 'MetronicApp',
     insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
     files: [
     '/assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.css',
     '/assets/admin/pages/css/profile.css',
     '/assets/admin/pages/css/tasks.css',
     '/assets/global/plugins/jquery.sparkline.min.js',
     '/assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.js',
     '/assets/admin/pages/scripts/profile.js',
     '/controllers/UserProfileController.js'
     ]
     });
     }]
     }
     })
     
     // User Profile Dashboard
     .state("profile.dashboard", {
     url: "/dashboard",
     templateUrl: "views/profile/dashboard.html",
     data: {pageTitle: 'User Profile'}
     })
     
     // User Profile Account
     .state("profile.account", {
     url: "/account",
     templateUrl: "views/profile/account.html",
     data: {pageTitle: 'User Account'}
     })
     
     // User Profile Help
     .state("profile.help", {
     url: "/help",
     templateUrl: "views/profile/help.html",
     data: {pageTitle: 'User Help'}      
     })
     
     // Todo
     .state('todo', {
     url: "/todo",
     templateUrl: "views/todo.html",
     data: {pageTitle: 'Todo'},
     controller: "TodoController",
     resolve: {
     deps: ['$ocLazyLoad', function ($ocLazyLoad) {
     return $ocLazyLoad.load({
     name: 'MetronicApp',
     insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
     files: [
     '/assets/global/plugins/bootstrap-datepicker/css/datepicker3.css',
     '/assets/global/plugins/select2/select2.css',
     '/assets/admin/pages/css/todo.css',
     '/assets/global/plugins/bootstrap-datepicker/js/bootstrap-datepicker.js',
     '/assets/global/plugins/select2/select2.min.js',
     '/assets/admin/pages/scripts/todo.js',
     '/controllers/TodoController.js'
     ]
     });
     }]
     }
     
     })*/
    ;
}]);
/* Init global settings and run the app */
MetronicApp.run(["$rootScope", "settings", "$state",
    function($rootScope, settings, $state) {
        $rootScope.$state = $state; // state to be accessed from view
    }
]);

MetronicApp.run(
    ['$window', '$rootScope', '$state', '$stateParams',
        function($window, $rootScope, $state, $stateParams) {
            // It's very handy to add references to $state and $stateParams to the $rootScope
            // so that you can access them from any scope within your applications.For example,
            // <li ng-class="{ active: $state.includes('contacts.list') }"> will set the <li>
            // to active whenever 'contacts.list' or one of its decendents is active.
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;

            $rootScope.goBack = function() {
                $window.history.back();
            };

        }
    ]);

MetronicApp.run(['editableOptions', 'editableThemes',
    function(editableOptions, editableThemes) {
        // bootstrap3 theme. Can be also 'bs2', 'default'
        editableThemes.bs3.inputClass = 'input-sm';
        editableThemes.bs3.buttonsClass = 'btn-sm';
        editableOptions.theme = 'bs3';
    }
]);

// For dialog box
MetronicApp.config(['dialogsProvider', '$translateProvider',
    function(dialogsProvider, $translateProvider) {
        dialogsProvider.useBackdrop('static');
        dialogsProvider.useEscClose(true);
        dialogsProvider.useCopy(false);
        dialogsProvider.setSize('sm');

        $translateProvider.translations('fr-FR', {
            DIALOGS_ERROR: "Erreur",
            DIALOGS_ERROR_MSG: "Erreur inconnue.",
            DIALOGS_CLOSE: "Fermer",
            DIALOGS_PLEASE_WAIT: "Attendre",
            DIALOGS_PLEASE_WAIT_ELIPS: "Veuillez patienter...",
            DIALOGS_PLEASE_WAIT_MSG: "Veuiller attendre la fin de l'opération.",
            DIALOGS_PERCENT_COMPLETE: "% complete",
            DIALOGS_NOTIFICATION: "Notification",
            DIALOGS_NOTIFICATION_MSG: "Notification inconnue.",
            DIALOGS_CONFIRMATION: "Confirmation",
            DIALOGS_CONFIRMATION_MSG: "Confirmation requise.",
            DIALOGS_OK: "Ok",
            DIALOGS_YES: "Oui",
            DIALOGS_NO: "Non"
        });

        $translateProvider.preferredLanguage('fr-FR');
    }
]);

// results in ($10.00) rather than -$10.00
MetronicApp.config(['$provide', function($provide) {
    $provide.decorator('$locale', ['$delegate', function($delegate) {
        //if($delegate.id == 'fr-fr') {
        $delegate.NUMBER_FORMATS.PATTERNS[1].negPre = '-';
        $delegate.NUMBER_FORMATS.PATTERNS[1].negSuf = ' \u00A4';
        //}
        return $delegate;
    }]);
}]);