const express = require('express');
const Iyzipay = require('iyzipay');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET_KEY,
    uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com'
});

// Create payment
router.post('/create-payment', async (req, res) => {
    const { price, paidBy, eventId, eventName } = req.body;

    const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        price: price,
        paidPrice: price,
        currency: Iyzipay.CURRENCY.TRY,
        installment: '1',
        basketId: eventId,
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: `${process.env.FRONTEND_URL}/payment-result`,
        paymentCard: {
            cardHolderName: req.body.cardHolderName,
            cardNumber: req.body.cardNumber,
            expireMonth: req.body.expireMonth,
            expireYear: req.body.expireYear,
            cvc: req.body.cvc,
            registerCard: '0'
        },
        buyer: {
            id: paidBy,
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            identityNumber: req.body.identityNumber,
            registrationAddress: req.body.address,
            city: req.body.city,
            country: req.body.country,
            ip: req.ip
        },
        shippingAddress: {
            contactName: `${req.body.name} ${req.body.surname}`,
            city: req.body.city,
            country: req.body.country,
            address: req.body.address
        },
        billingAddress: {
            contactName: `${req.body.name} ${req.body.surname}`,
            city: req.body.city,
            country: req.body.country,
            address: req.body.address
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
        iyzipay.payment.create(request, function (err, result) {
            if (err) {
                console.error('Iyzipay error:', err);
                res.status(500).json({ error: 'An error occurred while processing the payment.' });
            } else {
                if (result.status === 'success') {
                    res.json({ status: 'success', ...result });
                } else {
                    res.status(400).json({ status: 'failure', errorMessage: result.errorMessage });
                }
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});

// Retrieve payment result
router.get('/payment-result', (req, res) => {
    iyzipay.payment.retrieve({
        locale: Iyzipay.LOCALE.TR,
        conversationId: req.query.conversationId,
        paymentId: req.query.paymentId
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