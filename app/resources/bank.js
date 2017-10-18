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



"use strict";

//Bank service
MetronicApp.factory("Banks", ['$resource', function($resource) {
    return {
        payment: $resource('/erp/api/bank/payment/:Id', {
            Id: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        }),
        bank: $resource('/erp/api/bank/:Id', {
            Id: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        }),
        paymentGroupChq: $resource('/erp/api/bank/payment/chq/:Id', {
            Id: '@_id'
        }, {
            update: {
                method: 'PUT'
            }
        })
    };
}]);