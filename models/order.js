"use strict";

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = mongoose.Schema.Types.ObjectId,
    timestamps = require('mongoose-timestamp');

var DataTable = require('mongoose-datatable');

DataTable.configure({
    verbose: false,
    debug: false
});
mongoose.plugin(DataTable.init);

var Dict = INCLUDE('dict');

var setPrice = MODULE('utils').setPrice;
var setDate = MODULE('utils').setDate;

var options = {
    collection: 'Orders',
    discriminatorKey: '_type',
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
};


const baseSchema = new Schema({
    forSales: { type: Boolean, default: true },
    isremoved: Boolean,
    ref: { type: String, index: true },
    ID: { type: Number, unique: true },
    /*title: {//For internal use only
        ref: String,
        autoGenerated: {
            type: Boolean,
            default: false
        } //For automatic process generated deliveries
    },*/
    currency: {
        _id: { type: String, ref: 'currency', default: '' },
        rate: { type: Number, default: 1 } // changed default to '0' for catching errors
    },

    Status: { type: String, default: 'DRAFT' },
    cond_reglement_code: {
        type: String,
        default: 'RECEP'
    },
    mode_reglement_code: {
        type: String,
        default: 'TIP'
    },
    //bank_reglement: {type: String},
    //availability_code: {type: String, default: 'AV_NOW'},
    type: {
        type: String,
        default: 'SRC_COMM'
    },
    supplier: { type: Schema.Types.ObjectId, ref: 'Customers', require: true },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'Customers' }],
    ref_client: { type: String, default: "" },
    offer: { type: ObjectId, ref: 'order' },
    datec: {
        type: Date,
        default: Date.now,
        set: setDate
    },
    date_livraison: {
        type: Date,
        set: setDate
    },
    notes: [{
        title: String,
        note: String,
        public: {
            type: Boolean,
            default: false
        },
        edit: {
            type: Boolean,
            default: false
        }
    }],
    discount: {
        escompte: {
            percent: { type: Number, default: 0 },
            value: { type: Number, default: 0, set: setPrice } // total remise globale
        },
        discount: {
            percent: { type: Number, default: 0 }, //discount
            value: { type: Number, default: 0, set: setPrice } // total remise globale
        }
    },
    total_ht: {
        type: Number,
        default: 0,
        set: setPrice
    },
    total_taxes: [{
        _id: false,
        taxeId: { type: Schema.Types.ObjectId, ref: 'taxes' },
        value: { type: Number, default: 0 }
    }],
    total_ttc: {
        type: Number,
        default: 0,
        set: setPrice
    },
    shipping: {
        total_ht: {
            type: Number,
            default: 0,
            set: setPrice
        },
        total_taxes: [{
            _id: false,
            taxeId: { type: Schema.Types.ObjectId, ref: 'taxes' },
            value: { type: Number, default: 0 }
        }],
        /*total_ttc: {
            type: Number,
            default: 0
        }*/
    },
    createdBy: { type: ObjectId, ref: 'Users' },
    editedBy: { type: ObjectId, ref: 'Users' },
    salesPerson: { type: ObjectId, ref: 'Employees' }, //commercial_id
    salesTeam: { type: ObjectId, ref: 'Department' },
    entity: String,
    optional: Schema.Types.Mixed,
    delivery_mode: { type: String, default: "Comptoir" },
    billing: { type: Schema.Types.ObjectId, ref: 'Customers' },
    //costList: { type: ObjectId, ref: 'priceList', default: null }, //Not used
    //priceList: { type: ObjectId, ref: 'priceList', default: null },
    address: {
        name: { type: String, default: '' },
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zip: { type: String, default: '' },
        country: { type: String, ref: 'countries', default: 'FR' }
    },
    shippingAddress: {
        _id: { type: ObjectId, default: null },
        name: { type: String, default: '' },
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zip: { type: String, default: '' },
        country: { type: String, ref: 'countries', default: 'FR' }
    },
    /*bl: [{
        label: String,
        name: String,
        contact: String,
        address: String,
        zip: String,
        town: String,
        products: [{
            id: Schema.Types.ObjectId,
            name: String,
            qty: {
                type: Number,
                default: 0
            } // QTY Order
        }],
        shipping: {
            id: String,
            label: String,
            address: Boolean,
            total_ht: {
                type: Number,
                default: 0
            }
        }
    }],*/
    weight: { type: Number, default: 0 }, // Poids total
    /*lines: [{
        _id: false,
        //pu: {type: Number, default: 0},
        type: { type: String, default: 'product' }, //Used for subtotal
        refProductSupplier: String, //Only for an order Supplier
        qty: { type: Number, default: 0 },
        //price_base_type: String,
        //title: String,
        priceSpecific: { type: Boolean, default: false },
        pu_ht: {
            type: Number,
            default: 0
        },
        description: String,
        private: String, // Private note
        product_type: String,
        product: { type: Schema.Types.ObjectId, ref: "product" },
        total_taxes: [{
            _id: false,
            taxeId: { type: Schema.Types.ObjectId, ref: 'taxes' },
            value: { type: Number }
        }],
        discount: { type: Number, default: 0 },
        total_ht: { type: Number, default: 0, set: setPrice },
        //weight: { type: Number, default: 0 },
        optional: { type: Schema.Types.Mixed }
    }],*/
    history: [{
        date: { type: Date, default: Date.now },
        author: {
            id: String,
            name: String
        },
        mode: String, //email, order, alert, new, ...
        Status: String,
        msg: String
    }]
}, options);

baseSchema.plugin(timestamps);

if (CONFIG('storing-files')) {
    var gridfs = INCLUDE(CONFIG('storing-files'));
    baseSchema.plugin(gridfs.pluginGridFs, {
        root: 'Orders'
    });
}

const Order = mongoose.model('order', baseSchema);

var orderCustomerSchema = new Schema({});
var orderSupplierSchema = new Schema({});

var quotationCustomerSchema = new Schema({});
var quotationSupplierSchema = new Schema({});

// Gets listing
baseSchema.statics.query = function(options, callback) {
    var self = this;

    // options.search {String}
    // options.category {String}
    // options.page {String or Number}
    // options.max {String or Number}
    // options.id {String}

    options.page = U.parseInt(options.page) - 1;
    options.max = U.parseInt(options.max, 20);
    if (options.id && typeof(options.id) === 'string')
        options.id = options.id.split(',');
    if (options.page < 0)
        options.page = 0;
    var take = U.parseInt(options.max);
    var skip = U.parseInt(options.page * options.max);

    var query = options.query;
    if (!query.isremoved)
        query.isremoved = { $ne: true };

    //if (options.search)
    //    builder.in('search', options.search.keywords(true, true));
    if (options.id) {
        if (typeof options.id === 'object')
            options.id = { '$in': options.id };
        query._id = options.id;
    }

    var sort = "ref";

    if (options.sort)
        sort = options.sort;

    //console.log(query);

    this.find(query)
        .select(options.fields)
        .limit(take)
        .skip(skip)
        //.populate('category', "_id path url linker name")
        .sort(sort)
        //.lean()
        .exec(function(err, doc) {
            //console.log(doc);
            var data = {};
            data.count = doc.length;
            data.items = doc;
            data.limit = options.max;
            data.pages = Math.ceil(data.count / options.max);

            if (!data.pages)
                data.pages = 1;
            data.page = options.page + 1;
            callback(null, data);
        });
};

// Read Order
baseSchema.statics.getById = function(id, callback) {
    var self = this;
    var OrderRowModel = MODEL('orderRows').Schema;

    //TODO Check ACL here
    var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
    var query = {};

    if (checkForHexRegExp.test(id))
        query = {
            _id: id
        };
    else
        query = {
            ref: id
        };

    //console.log(query);

    self.findOne(query, "-latex")
        .populate("contacts", "name phone email")
        .populate({
            path: "supplier",
            select: "name salesPurchases",
            populate: { path: "salesPurchases.priceList" }
        })
        .populate({
            path: "total_taxes.taxeId"
        })
        .populate("createdBy", "username")
        .populate("editedBy", "username")
        //.populate("offer", "ref total_ht")
        .exec(function(err, order) {
            if (err)
                return callback(err);

            OrderRowModel.find({ order: order._id })
                .populate({
                    path: "product",
                    select: "taxes info weight units",
                    //populate: { path: "taxes.taxeId" }
                })
                .populate({
                    path: "total_taxes.taxeId"
                })
                .sort({ sequence: 1 })
                .exec(function(err, rows) {
                    if (err)
                        return callback(err);

                    order = order.toObject();
                    order.lines = rows || [];

                    return callback(err, order);
                });
        });
};
//orderSupplierSchema.statics.getById = getById;

/**
 * Methods
 */
baseSchema.virtual('_status')
    .get(function() {
        var res_status = {};

        var status = this.Status;
        var statusList = exports.Status;

        if (status && statusList.values[status] && statusList.values[status].label) {
            res_status.id = status;
            res_status.name = i18n.t("orders:" + statusList.values[status].label);
            //this.status.name = statusList.values[status].label;
            res_status.css = statusList.values[status].cssClass;
        } else { // By default
            res_status.id = status;
            res_status.name = status;
            res_status.css = "";
        }

        return res_status;
    });


function saveOrder(next) {
    var self = this;
    var SeqModel = MODEL('Sequence').Schema;
    var EntityModel = MODEL('entity').Schema;

    if (this.isNew)
        this.history = [];

    if (self.isNew && !self.ref)
        return SeqModel.inc("ORDER", function(seq, number) {
            //console.log(seq);
            self.ID = number;
            EntityModel.findOne({
                _id: self.entity
            }, "cptRef", function(err, entity) {
                if (err)
                    console.log(err);

                if (entity && entity.cptRef)
                    self.ref = (self.forSales == true ? "CO" : "CF") + entity.cptRef + seq;
                else
                    self.ref = (self.forSales == true ? "CO" : "CF") + seq;
                next();
            });
        });

    if (self.date_livraison)
        self.ref = F.functions.refreshSeq(self.ref, self.date_livraison);

    next();
}

function saveQuotation(next) {
    var self = this;
    var SeqModel = MODEL('Sequence').Schema;
    var EntityModel = MODEL('entity').Schema;

    if (this.isNew)
        this.history = [];

    MODULE('utils').sumTotal(this.lines, this.shipping, this.discount, this.supplier, function(err, result) {
        if (err)
            return next(err);

        self.total_ht = result.total_ht;
        self.total_taxes = result.total_taxes;
        self.total_ttc = result.total_ttc;
        self.weight = result.weight;

        if (self.isNew && !self.ref)
            return SeqModel.inc("QUOTATION", function(seq, number) {
                //console.log(seq);
                self.ID = number;
                EntityModel.findOne({
                    _id: self.entity
                }, "cptRef", function(err, entity) {
                    if (err)
                        console.log(err);

                    if (entity && entity.cptRef)
                        self.ref = (self.forSales == true ? "PC" : "DA") + entity.cptRef + seq;
                    else
                        self.ref = (self.forSales == true ? "PC" : "DA") + seq;
                    next();
                });
            });

        self.ref = F.functions.refreshSeq(self.ref, self.datec);
        next();

    });
}


orderCustomerSchema.pre('save', saveOrder);
orderSupplierSchema.pre('save', saveOrder);
quotationCustomerSchema.pre('save', saveQuotation);
quotationSupplierSchema.pre('save', saveQuotation);

const orderCustomer = Order.discriminator('orderCustomer', orderCustomerSchema);
const orderSupplier = Order.discriminator('orderSupplier', orderSupplierSchema);
const quotationCustomer = Order.discriminator('quotationCustomer', quotationCustomerSchema);
const quotationSupplier = Order.discriminator('quotationSupplier', quotationSupplierSchema);

exports.Schema = {
    OrderCustomer: orderCustomer,
    OrderSupplier: orderSupplier,
    QuotationCustomer: quotationCustomer,
    QuotationSupplier: quotationSupplier
};

exports.Status = {
    "_id": "fk_order_status",
    "lang": "orders",
    "values": {
        "DRAFT": {
            "enable": true,
            "label": "StatusOrderDraft",
            "cssClass": "ribbon-color-default label-default",
            "system": true
        },
        "VALIDATED": {
            "enable": true,
            "label": "StatusOrderValidated",
            "cssClass": "ribbon-color-warning label-warning"
        },
        "CANCELED": {
            "enable": true,
            "label": "StatusOrderCanceled",
            "cssClass": "ribbon-color-danger label-danger",
            "system": true
        },
        "PROCESSING": {
            "enable": true,
            "label": "StatusOrderProcessing",
            "cssClass": "ribbon-color-info label-info"
        },
        "SHIPPING": {
            "label": "StatusOrderSending",
            "enable": true,
            "cssClass": "ribbon-color-success label-success"
        },
        "CLOSED": {
            "enable": true,
            "label": "StatusOrderClosed",
            "cssClass": "ribbon-color-success label-success",
            "system": true
        },
        "ERROR": {
            "label": "StatusOrderError",
            "cssClass": "ribbon-color-danger label-danger",
            "system": true
        },
        "BILLING": {
            "label": "StatusOrderToBill",
            "cssClass": "ribbon-color-default label-default"
        },
        "BILLED": {
            "enable": true,
            "label": "StatusOrderToBill",
            "cssClass": "ribbon-color-primary label-primary",
            "system": true
        },
        "NEW": {
            "enable": true,
            "label": "PropalStatusNew",
            "cssClass": "ribbon-color-info label-info"
        },
        "SIGNED": {
            "enable": true,
            "label": "PropalStatusClosed",
            "cssClass": "ribbon-color-danger label-danger",
            "system": true
        },
        "NOTSIGNED": {
            "enable": true,
            "label": "PropalStatusNotSigned",
            "cssClass": "ribbon-color-warning label-warning",
            "system": true
        }
    }
};

exports.name = "order";