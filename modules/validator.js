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



'use strict';

exports.name = 'validator';
exports.version = '1.00';

var mongoose = require('mongoose');
var objectId = mongoose.Types.ObjectId;

var validator = require('validator');
var xssFilters = require('xss-filters');

validator.extend('isLogin', function(str) {
    var regExp = /[\w\.@]{4,100}$/;

    return regExp.test(str);
});

validator.extend('isNotValidChars', function(str) {
    var regExp = /[~<>\^\*₴]/;

    return regExp.test(str);
});

validator.extend('isPass', function(str) {
    var regExp = /^[\w\.@]{3,100}$/;

    return regExp.test(str);
});

validator.extend('isProfile', function(str) {
    var regExp = /^\d+$/;

    return regExp.test(str);
});

validator.extend('isEmployeeName', function(str) {
    var regExp = /^[a-zA-Z]+[a-zA-Z-_\s]+$/;

    return regExp.test(str);
});

validator.extend('isEmployeeDate', function(str) {
    var regExp = /[a-zA-Z0-9]+[a-zA-Z0-9-,#@&*-_\s()\.\/\s]+$/;

    return regExp.test(str);
});

function getValidUserBody(body) {
    var hasLogin = body.hasOwnProperty('login');
    var hasEmail = body.hasOwnProperty('email');
    var hasPass = body.hasOwnProperty('pass');
    var hasProfile = body.hasOwnProperty('profile');

    hasEmail = hasEmail ? validator.isEmail(body.email) : false;
    hasLogin = hasLogin ? validator.isLogin(body.login) : false;
    hasPass = hasPass ? validator.isPass(body.pass) : false;
    hasProfile = hasProfile ? validator.isProfile(body.profile) : false;

    return hasEmail && hasLogin && hasPass && hasProfile;
}

function parseUserBody(body) {
    var email = body.email;

    if (body.login) {
        body.login = validator.escape(body.login);
        body.login = xssFilters.inHTMLData(body.login);
    }
    if (email) {
        email = validator.escape(email);
        email = validator.normalizeEmail(email);

        body.email = xssFilters.inHTMLData(email);
    }
    if (body.pass) {
        body.pass = validator.escape(body.pass);
        body.pass = xssFilters.inHTMLData(body.pass);
    }

    return body;
}

function getValidProfileBody(body) {
    var hasName = body.hasOwnProperty('profileName');

    //not sure about regexp
    // why not && ?
    hasName = hasName ? validator.isLogin(body.profileName) : false;

    return hasName;
}

function parseProfileBody(body) {
    if (body.profileName) {
        body.profileName = validator.escape(body.profileName);
        body.profileName = xssFilters.inHTMLData(body.profileName);
    }


    if (body.profileDescription) {
        body.profileDescription = validator.escape(body.profileDescription);
        body.profileDescription = xssFilters.inHTMLData(body.profileDescription);
    }

    body._id = Date.parse(new Date());

    body.profileAccess = body.profileAccess.map(function(item) {
        item.module = item.module._id;
        return item;
    });

    return body;
}

function getValidTaskBody(body) {
    //toDo not finished
    var hasSummary = body.hasOwnProperty('summary');

    hasSummary = hasSummary ? !!body.summary : false;
    hasSummary = hasSummary ? !validator.isNotValidChars(body.summary) : false;

    return hasSummary;
}

function parseTaskBody(body) {
    var dateCalculator = MODULE('dateCalculator');

    if (body.summary) {
        body.summary = validator.escape(body.summary);
        body.summary = xssFilters.inHTMLData(body.summary);
    }
    if (body.project) {
        body.project = validator.escape(body.project);
        body.project = xssFilters.inHTMLData(body.project);
    }
    if (body.assignedTo) {
        body.assignedTo = validator.escape(body.assignedTo);
        body.assignedTo = xssFilters.inHTMLData(body.assignedTo);
    }
    if (body.type) {
        body.type = validator.escape(body.type);
        body.type = xssFilters.inHTMLData(body.type);
    }
    if (body.tags) {
        body.tags = body.tags.map(function(tag, i, tags) {
            tag = validator.escape(tag);
            tag = xssFilters.inHTMLData(tag);
            return tag;
        });
    } //unused
    if (body.description) {
        body.description = validator.escape(body.description);
        body.description = xssFilters.inHTMLData(body.description);
    }
    if (body.priority) {
        body.priority = validator.escape(body.priority);
        body.priority = xssFilters.inHTMLData(body.priority);
    }
    if (body.sequence) {
        body.sequence = validator.escape(body.sequence);
        body.sequence = xssFilters.inHTMLData(body.sequence);
    }
    if (body.customer) {
        body.customer = validator.escape(body.customer);
        body.customer = xssFilters.inHTMLData(body.customer);
    } //unused
    if (body.StartDate) {
        body.StartDate = new Date(body.StartDate);
        if (!body.estimated) {
            body.EndDate = new Date(body.StartDate);
        }
    }
    if (body.workflow) {
        body.workflow = validator.escape(body.workflow);
        body.workflow = xssFilters.inHTMLData(body.workflow);
    }
    if (body.uId) {
        body.createdBy = {};
        body.editedBy = {};
        body.createdBy.user = body.uId;
        body.createdBy.date = new Date();
        body.editedBy.date = new Date();
        body.editedBy.user = body.uId;
    }
    if (body.logged) {
        body.logged = validator.escape(body.logged);
        body.logged = xssFilters.inHTMLData(body.logged);
    }
    if (body.attachments) {
        var attachments = body.attachments;

        if (attachments.id) {
            attachments.id = validator.escape(attachments.id);
            attachments.id = xssFilters.inHTMLData(attachments.id);
        }
        if (attachments.name) {
            attachments.name = validator.escape(attachments.name);
            attachments.name = xssFilters.inHTMLData(attachments.name);
        }
        if (attachments.path) {
            attachments.path = validator.escape(attachments.path);
            attachments.path = xssFilters.inHTMLData(attachments.path);
        }
        if (attachments.size) {
            attachments.size = validator.escape(attachments.size);
            attachments.size = xssFilters.inHTMLData(attachments.size);
        }
        if (attachments.uploadDate) {
            attachments.uploadDate = validator.escape(attachments.uploadDate);
            attachments.uploadDate = xssFilters.inHTMLData(attachments.uploadDate);
        }
        if (attachments.uploaderName) {
            attachments.uploaderName = validator.escape(attachments.uploaderName);
            attachments.uploaderName = xssFilters.inHTMLData(attachments.uploaderName);
        }
    } //unused
    if (body.notes) {
        if (body.notes.length != 0) {
            var obj = body.notes[body.notes.length - 1];
            if (!obj._id) {
                obj._id = mongoose.Types.ObjectId();
            }
            // obj.date = new Date();
            if (!obj.author) {
                obj.author = req.session.uName;
            }

            obj.note = validator.escape(obj.note);
            obj.title = validator.escape(obj.title);
            obj.note = xssFilters.inHTMLData(obj.note);
            obj.title = xssFilters.inHTMLData(obj.title);

            body.notes[data.notes.length - 1] = obj;
        }
    } //unused
    if (body.estimated) {
        body.remaining = body.estimated - body.logged;
        if (body.estimated !== 0) {
            body.progress = Math.round((body.logged / body.estimated) * 100);
        } else {
            body.progress = 0;
        }
        body.estimated = body.estimated;

        var StartDate = (body.StartDate) ? new Date(body.StartDate) : new Date();
        body.EndDate = dateCalculator.calculateTaskEndDate(StartDate, body.estimated);
        body.duration = dateCalculator.returnDuration(StartDate, body.EndDate);
    }


    return body;
}

function validEmployeeBody(body) {
    var hasName = body.hasOwnProperty('name');
    var dateBirth = body.hasOwnProperty('dateBirth');

    var hasNameFirst = hasName ? validator.isEmployeeName(body.name.first) : false;
    var hasNameLast = hasName ? validator.isEmployeeName(body.name.last) : false;

    dateBirth = dateBirth ? validator.isDate(body.dateBirth) : false;

    return hasNameFirst && hasNameLast && dateBirth;
}

exports.validUserBody = getValidUserBody;
exports.parseUserBody = parseUserBody;
exports.validProfileBody = getValidProfileBody;
exports.parseProfileBody = parseProfileBody;
exports.validTaskBody = getValidTaskBody;
exports.parseTaskBody = parseTaskBody;
exports.validEmployeeBody = validEmployeeBody;