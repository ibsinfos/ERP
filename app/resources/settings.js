"use strict";
/* global angular: true */

//Users service used REST endpoint
MetronicApp.factory("Settings", ['$resource', function($resource) {
    return {
        productTypes: $resource('/erp/api/product/productTypes/:Id', { Id: '@_id' }, {
            update: { method: 'PUT' },
            query: { method: 'GET', isArray: false }
        }),
        productFamily: $resource('/erp/api/product/family/:Id', { Id: '@_id' }, {
            update: { method: 'PUT' },
            query: { method: 'GET', isArray: false }
        }),
        productAttributes: $resource('/erp/api/product/attributes/:Id', { Id: '@_id' }, {
            update: { method: 'PUT' },
            query: { method: 'GET', isArray: false }
        })

    };
}]);