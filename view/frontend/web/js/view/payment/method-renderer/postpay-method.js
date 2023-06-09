/**
 * Copyright © Postpay. All rights reserved.
 * See LICENSE for license details.
 */
define([
    'jquery',
    'Magento_Checkout/js/view/payment/default',
    'Magento_Customer/js/customer-data',
    'Magento_Checkout/js/model/payment/additional-validators',
    'Magento_Checkout/js/model/place-order',
    'Magento_Checkout/js/model/quote',
    'Magento_Customer/js/model/customer',
    'Postpay_Payment/js/action/set-payment-method',
    'postpay-js',
    'mage/translate'
], function (
    $,
    Component,
    customerData,
    additionalValidators,
    placeOrderService,
    quote,
    customer,
    setPaymentMethodAction,
    postpay,
    $t
) {
    'use strict';

    var config = window.checkoutConfig.payment;

    return Component.extend({
        defaults: {
            totals: quote.totals(),
            template: 'Postpay_Payment/payment/postpay'
        },

        /**
         * Initialize Postpay Ui.
         *
         * Is called after knockout renders the payment summary widget.
         */
        initUi: function () {
            postpay.init(config.postpay.uiParams);
        },

        /**
         * Get payment method id attribute.
         *
         * @returns {String}
         */
        getId: function () {
            return 'payment-method-' + this.getCode();
        },

        /**
         * Check if payment summary widget is enabled.
         *
         * @returns {Boolean}
         */
        summaryWidgetEnabled: function () {
            return config[this.getCode()].summaryWidget;
        },

        /**
         * Get total amount.
         *
         * @returns {Integer}
         */
        getTotal: function () {
            return Math.round(this.totals.grand_total * 100);
        },

        /**
         * Get currency code.
         *
         * @returns {String}
         */
        getCurrency: function () {
            return this.totals.quote_currency_code;
        },

        /**
         * Get country code.
         *
         * @returns {String}
         */
        getCountry: function () {
            //return quote.billingAddress().countryId;
            if(quote.billingAddress()) {
                return quote.billingAddress().countryId;
            } else if (quote.shippingAddress()) {
                return quote.shippingAddress().countryId;
            }
        },

        /**
         * Get number of instalments.
         *
         * @returns {Integer}
         */
        getNumInstalments: function () {
            return config[this.getCode()].numInstalments;
        },

        /**
         * Get payment method icon.
         *
         * @returns {String}
         */
        getIcon: function () {
            return config[this.getCode()].icon;
        },

        /**
         * Get place order button text.
         *
         * @returns {String}
         */
        getButtonText: function () {
            return this.getNumInstalments() === 1 ?
                $t('Pay Now') :
                $t('Continue to Postpay');
        },

        /**
         * In-context checkout or redirect.
         */
        checkout: function (params) {
            if (config.postpay.inContext) {
                postpay.checkout(params.token);
            } else {
                customerData.invalidate(['cart']);
                $.mage.redirect(params.redirect_url);
            }
        },

        /**
         * Place order handler.
         */
        continueToPostpay: function () {
            if (additionalValidators.validate()) {
                this.selectPaymentMethod();
                var self = this;
                var payload = {};

                if (!customer.isLoggedIn()) {
                    payload['email'] = quote.guestEmail;
                }

                setPaymentMethodAction(this.messageContainer).done(function () {
                    placeOrderService(config.postpay.checkoutUrl, payload, self.messageContainer)
                        .done(function (response) {
                            self.checkout(response);
                        })
                        .fail(function (response) {
                            self.messageContainer.addErrorMessage(response.message);
                        });
                    }
                );
            }
        }
    });
});
