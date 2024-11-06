const express = require('express');
const Iyzipay = require('iyzipay');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const rateLimit = require("express-rate-limit");
const admin = require('firebase-admin');
const db = admin.firestore();

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

    const conversationId = uuidv4();

    try {
        // Create transaction record first
        const transactionRef = await db.collection('transactions').add({
            eventId: eventId,
            userId: paidBy,
            amount: price,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            conversationId: conversationId
        });

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

        if (!req.body.price || !req.body.paidBy || !req.body.eventId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        iyzipay.checkoutFormInitialize.create(request, async function (err, result) {
            if (err) {
                // Update transaction status on error
                await transactionRef.update({ 
                    status: 'failed',
                    error: err.message,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                });
                res.status(500).json({ error: 'An error occurred while initializing the payment.' });
            } else {
                if (result.status === 'success') {
                    // Update transaction with token
                    await transactionRef.update({ 
                        token: result.token,
                        formInitialized: true,
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                    });
                    res.json({ status: 'success', checkoutFormContent: result.checkoutFormContent });
                } else {
                    await transactionRef.update({ 
                        status: 'failed',
                        error: result.errorMessage,
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                    });
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
router.post('/payment-result', async (req, res) => {
    try {
        // Find the transaction record
        const transactionQuery = await db.collection('transactions')
            .where('token', '==', req.body.token)
            .limit(1)
            .get();

        if (transactionQuery.empty) {
            return res.status(400).json({ error: 'Invalid transaction' });
        }

        const transaction = transactionQuery.docs[0];

        // Check if already processed
        if (transaction.data().status === 'completed') {
            return res.status(400).json({ error: 'Transaction already processed' });
        }

        iyzipay.checkoutForm.retrieve({
            locale: Iyzipay.LOCALE.TR,
            token: req.body.token
        }, async function (err, result) {
            if (err) {
                await transaction.ref.update({ 
                    status: 'failed',
                    error: err.message,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                });
                return res.status(500).json({ error: 'Payment verification failed' });
            }

            if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
                // Update transaction record
                await transaction.ref.update({
                    status: 'completed',
                    paymentId: result.paymentId,
                    paymentTransactionId: result.paymentItems[0].paymentTransactionId,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                });

                // Register user for event
                const eventRef = db.doc(`events/${transaction.data().eventId}`);
                const userRef = db.doc(`users/${transaction.data().userId}`);

                await eventRef.update({
                    registeredUsers: admin.firestore.FieldValue.arrayUnion(transaction.data().userId)
                });

                await userRef.update({
                    registeredEvents: admin.firestore.FieldValue.arrayUnion(transaction.data().eventId)
                });

                res.json({ 
                    status: 'success',
                    eventId: transaction.data().eventId
                });
            } else {
                await transaction.ref.update({
                    status: 'failed',
                    error: result.errorMessage,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                });
                res.status(400).json({ 
                    status: 'failure', 
                    errorMessage: result.errorMessage 
                });
            }
        });
    } catch (error) {
        console.error('Payment result error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
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