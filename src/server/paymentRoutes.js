const express = require('express');
const Iyzipay = require('iyzipay');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const rateLimit = require("express-rate-limit");

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_URL || 'https://sandbox-api.iyzipay.com'
});

// Create payment
router.post('/create-payment', paymentLimiter, async (req, res) => {
    const { price, paidBy, eventId, eventName } = req.body;

    const event = await Event.findById(req.body.eventId);
    if (event.price !== req.body.price) {
        return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        price: price,
        paidPrice: price,
        currency: Iyzipay.CURRENCY.TRY,
        basketId: eventId,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: `${process.env.FRONTEND_URL}/payment-result`,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: {
            id: paidBy,
            name: 'NOT_PROVIDED',
            surname: 'NOT_PROVIDED',
            email: 'NOT_PROVIDED',
            identityNumber: '11111111111',
            registrationAddress: 'NOT_PROVIDED',
            city: 'NOT_PROVIDED',
            country: 'Turkey',
            ip: req.ip
        },
        shippingAddress: {
            contactName: 'NOT_PROVIDED',
            city: 'NOT_PROVIDED',
            country: 'Turkey',
            address: 'NOT_PROVIDED'
        },
        billingAddress: {
            contactName: 'NOT_PROVIDED',
            city: 'NOT_PROVIDED',
            country: 'Turkey',
            address: 'NOT_PROVIDED'
        },
        basketItems: [
            {
                id: eventId,
                name: eventName,
                category1: 'Event',
                itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                price: price
            }
        ]
    };

    try {
        if (!req.body.price || !req.body.paidBy || !req.body.eventId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        iyzipay.checkoutFormInitialize.create(request, function (err, result) {
            if (err) {
                console.error('Iyzipay error:', err);
                res.status(500).json({ error: 'An error occurred while initializing the payment.' });
            } else {
                if (result.status === 'success') {
                    res.json({ status: 'success', checkoutFormContent: result.checkoutFormContent });
                } else {
                    res.status(400).json({ status: 'failure', errorMessage: result.errorMessage });
                }
            }
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ 
          error: 'Ödeme Başarısız Oldu', 
          details: error.message 
        });
    }
});

// Retrieve payment result
router.post('/payment-result', (req, res) => {
    iyzipay.checkoutForm.retrieve({
        locale: Iyzipay.LOCALE.TR,
        conversationId: req.body.conversationId,
        token: req.body.token
    }, function (err, result) {
        if (err) {
            console.error('Iyzipay error:', err);
            res.status(500).json({ error: 'An error occurred while retrieving the payment result.' });
        } else {
            res.json(result);
        }
    });
});

// Cancel payment
router.post('/cancel-payment', (req, res) => {
    iyzipay.cancel.create({
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        paymentId: req.body.paymentId,
        ip: req.ip
    }, function (err, result) {
        if (err) {
            console.error('Iyzipay error:', err);
            res.status(500).json({ error: 'An error occurred while cancelling the payment.' });
        } else {
            res.json(result);
        }
    });
});

// Refund payment
router.post('/refund-payment', (req, res) => {
    iyzipay.refund.create({
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        paymentTransactionId: req.body.paymentTransactionId,
        price: req.body.price,
        currency: Iyzipay.CURRENCY.TRY,
        ip: req.ip
    }, function (err, result) {
        if (err) {
            console.error('Iyzipay error:', err);
            res.status(500).json({ error: 'An error occurred while refunding the payment.' });
        } else {
            res.json(result);
        }
    });
});

module.exports = router;