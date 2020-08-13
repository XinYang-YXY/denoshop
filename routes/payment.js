if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;

const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;

const express = require("express");
const ensureAuthenticated = require('../helpers/auth');
const router = express.Router();
const stripe = require("stripe")(stripeSecretKey);

const uuid = require("uuid");

// DB Table
const DeliveryInfo = require("../models/DeliveryInfo");
// DB Table

const CartItem = require("../models/CartItem");
const PurchaseRecord = require("../models/PurchaseRecord");
const Order = require("../models/Order");
const HackingProduct = require("../models/HackingProduct");

const moment = require("moment");

const paypal = require('paypal-rest-sdk');

paypal.configure({
    'mode': 'sandbox',
    'client_id': paypalClientId,
    'client_secret': paypalClientSecret
});

router.get("/checkout", ensureAuthenticated, (req, res) => {

    DeliveryInfo.findAll({
        where: {
            userId: req.user.id
        }
    }).then((AddressList) =>{
        let defaultAddress = AddressList[0];

        CartItem.findAll({
            where: {
                userId: req.user.id
            }
        }).then(cartItems => {
            let sum = 0
            Array.prototype.forEach.call(cartItems, item => {
                let price = item.price;
                let quantity = item.itemNum;
    
                let total = quantity * price;
                sum += total;
            });    
    
            res.render("user/checkout", {
                style: { text: "user/shopping/checkoutdelivery.css"},
                title: "Checkout",
                sum,
                cartItems,
                defaultAddress,
                AddressList,
                stripePublicKey: stripePublicKey,
                paypalClientId: paypalClientId
            });
        })
    })
});

router.get("/privacypolicy", (req, res) => {
    res.render("user/privacypolicy", {
        style: {text: "user/payment/privacypolicy.css"},
        title: "Privacy Policy",
    })
});

router.get("/useragreement", (req, res) => {
    res.render("user/useragreement", {
        style: {text: "user/payment/useragreement.css"},
        title: "User Agreement",
    })
});

router.get("/orderplaced/:orderId", (req, res) => {
    Order.findOne({
        where: {
            id: req.params.orderId,
            userId: req.user.id,
        }
    }).then(orderObj => {
        var deliveryInfoId = orderObj.deliveryInfoId
        DeliveryInfo.findOne({
            where: {
                id: deliveryInfoId
            }
        }).then(deliveryAddress => {
            console.log(deliveryAddress)
            res.render("user/orderplaced", {
                style: {text: "user/payment/ordersuccess.css"},
                title: "Order Success",
                deliveryAddress,
                order: orderObj,
                orderId: req.params.orderId,
            })    
        })
    })    
})

router.get("/retrieve/:addrId", ensureAuthenticated, (req, res) => {
    DeliveryInfo.findOne({
        where: {
            id: req.params.addrId,
            userId: req.user.id
        }
    }).then(deliveryAddr => {
        console.log(deliveryAddr)
        res.json(deliveryAddr)

    })
})

router.post("/charge", ensureAuthenticated, async (req, res) => {
    let {
        receiverName,
        phoneNo,
        country,
        state,
        city,
        blockNo,
        street,
        unitNo,
        postcode,
        orderDescription,
        deliveryTime,
    } = req.body;
    let userId = req.user.id;

    const deliveryDate = moment(req.body.DeliveryDate).format("YYYY-MM-DD")
    
    const customer = await stripe.customers.update(
                                req.user.stripeId,
                                {source: req.body.stripeToken}
                            ).then(customer => {return customer})
    const cartItems = await CartItem.findAll({
                            where: {userId: req.user.id}
                        }).then(cartItems => {return cartItems})

    let sum = 0

    Array.prototype.forEach.call(cartItems, item => {
        var quantity = item.itemNum
        var price = item.price
        var totalprice = price * quantity
        sum += totalprice
    })

    const amount = sum * 100

    const charge = await stripe.charges.create({
                                amount,
                                description: orderDescription,
                                currency: "sgd",
                                customer: req.user.stripeId
                            }).then(charge => {
                                return charge
                            }).catch(err => {
                                console.log(err)
                            })

    let deliveryObj = await DeliveryInfo.findOne({
                                    where: {
                                        country: country,
                                        city: city,
                                        street: street,
                                        unitNo: unitNo,
                                        postcode: postcode,
                                        state: state,
                                        blockNo: blockNo,
                                        phoneNo: phoneNo,
                                        receiverName: receiverName,
                                        userId: userId,
                                    }
                                }).then(deliveryObj => {
                                    return deliveryObj
                                }).catch(err => {
                                    console.log(err)
                                })

    if (deliveryObj == null) {
        const newDeliveryObj = await DeliveryInfo.create({
                                            country,
                                            city,
                                            street,
                                            unitNo,
                                            postcode,
                                            state,
                                            blockNo,
                                            phoneNo,
                                            receiverName,
                                            userId,
                                        }).then(newDeliveryObj => {
                                            return newDeliveryObj
                                        }).catch(err => {
                                            console.log(err)
                                        })
        deliveryObj = newDeliveryObj
    }
    
    let deliveryInfoId = deliveryObj.id
    let chargeId = charge.id
    var orderStatus = 1

    var orderuuid = uuid.v4()
    var dateAdded = moment().format("YYYY-MM-DD")

    const order = await Order.create({
                            id:orderuuid,
                            chargeId,
                            deliveryDate,
                            deliveryTime,
                            orderDescription,
                            orderStatus,
                            orderSum: sum,
                            orderDate: dateAdded,
                            userId,
                            deliveryInfoId
                        }).then(orderObj => {
                            return orderObj
                        }).catch(err => {
                            console.log(err)
                        })
    
    let orderId = order.id
    Array.prototype.forEach.call(cartItems, item => {
        var itemNum = item.itemNum
        var title = item.title
        PurchaseRecord.create({
            title,
            itemNum,
            dateAdded,
            orderId
        })
        HackingProduct.findOne({
            where:{
                title: title
            }
        }).then(product => {
            var prodQuantity = product.quantity - itemNum
            HackingProduct.update(
                {quantity: prodQuantity},
                {where: {
                    title: title
                }}
            )
        })
    })
    CartItem.destroy({
        where: {
            userId: req.user.id,
        }
    }).catch(err => {
        console.log(err)
    })
    res.redirect("/payment/orderplaced/" + orderId)
})

router.post("/paypal/:paypalId", ensureAuthenticated, async (req, res) => {
    let {
        receivername,
        phoneno,
        country,
        state,
        city,
        blockno,
        street,
        unitno,
        postcode,
        orderdescription,
        deliverytime,
    } = req.headers;
    let userId = req.user.id;

    const deliveryDate = moment(req.headers.DeliveryDate).format("YYYY-MM-DD")

    const cartItems = await CartItem.findAll({
                                where: { userId: req.user.id }
                            }).then(cartItems => {return cartItems})


    let sum = 0

    Array.prototype.forEach.call(cartItems, item => {
        var quantity = item.itemNum
        var price = item.price
        var totalprice = price * quantity
        sum += totalprice
    })

    let deliveryObj = await DeliveryInfo.findOne({
        where: {
            country: country,
            city: city,
            street: street,
            unitNo: unitno,
            postcode: postcode,
            state: state,
            blockNo: blockno,
            phoneNo: phoneno,
            receiverName: receivername,
            userId: userId,
        }
    }).then(deliveryObj => {
        return deliveryObj
    }).catch(err => {
        console.log(err)
    })

    if (deliveryObj == null) {
        const newDeliveryObj = await DeliveryInfo.create({
                                        country: country,
                                        city: city,
                                        street: street,
                                        unitNo: unitno,
                                        postcode: postcode,
                                        state: state,
                                        blockNo: blockno,
                                        phoneNo: phoneno,
                                        receiverName: receivername,
                                        userId: userId,
                                    }).then(newDeliveryObj => {
                                        return newDeliveryObj
                                    }).catch(err => {
                                        console.log(err)
                                    })
        deliveryObj = newDeliveryObj
    }

    let deliveryInfoId = deliveryObj.id
    let paypalId = req.params.paypalId
    var orderStatus = 1

    var orderuuid = uuid.v4()
    var dateAdded = moment().format("YYYY-MM-DD")

    const order = await Order.create({
                            id: orderuuid,
                            paypalId,
                            deliveryDate,
                            deliveryTime: deliverytime,
                            orderDescription: orderdescription,
                            orderStatus,
                            orderSum: sum,
                            orderDate: dateAdded,
                            userId,
                            deliveryInfoId
                        }).then(orderObj => {
                            let orderId = orderObj.id
                            Array.prototype.forEach.call(cartItems, item => {
                                var itemNum = item.itemNum
                                var title = item.title
                                var dateAdded = moment().format("YYYY-MM-DD")
                                PurchaseRecord.create({
                                    title,
                                    itemNum,
                                    dateAdded,
                                    orderId
                                })
                                HackingProduct.findOne({
                                    where:{
                                        title: title
                                    }
                                }).then(product => {
                                    var prodQuantity = product.quantity - itemNum
                                    HackingProduct.update(
                                        {quantity: prodQuantity},
                                        {where: {
                                            title: title
                                        }}
                                    )
                                })
                            })
                            return {orderId: orderId}
                        }).then((orderId) => {
                            CartItem.destroy({
                                where: {
                                    userId: req.user.id,
                                }
                            })
                            return {orderId: orderId}
                        }).then((orderId) => {
                            let orderID = orderId.orderId.orderId
                            console.log(orderID)
                            res.json({orderID: orderID})
                            console.log("res.json")
                        }).catch(err => {
                            console.log(err)
                        })
})

router.get("/invoice/:id", ensureAuthenticated, (req, res) => {
    var orderId = req.params.id
    var userId = req.user.id

    Order.findOne({
		where: {
			id: orderId,
			userId: userId
		},
		include: [PurchaseRecord, DeliveryInfo]
	}).then(async (order) => {
        var purchaseRecordArr = order.purchaseRecords
        var deliveryInfo = order.deliveryInfo

		var titleArr = []
		for (let i = 0; i < purchaseRecordArr.length; i++) {
			titleArr.push(purchaseRecordArr[i].title)
		}

		var prodDetails = await HackingProduct.findAll({
			where: {
				title: titleArr,
			}
		}).then((data) => {return data})

		for (let i = 0; i < purchaseRecordArr.length; i++) {
			var record = purchaseRecordArr[i]
			var recordTitle = purchaseRecordArr[i].title
            var recordFound = prodDetails.filter(function(item) { return item.title === recordTitle})
            var number = i + 1
            record["number"] = number
			record["description"] = recordFound[0].description
			record["price"] = recordFound[0].price
			record["id"] = recordFound[0].id
        }
        console.log(order)
        return res.render("user/invoice", {
            style: {text: "user/payment/invoice.css"},
            title: "Invoice",
            order,
            purchaseRecords: order.purchaseRecords,
            deliveryInfo,
        })
	})
})

module.exports = router;