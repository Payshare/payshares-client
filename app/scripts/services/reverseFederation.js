/**
 *
 * The reverse federation service looks up and caches reverse federation queries.
 *
 * These files are used to do DNS-based verifications autonomously on the
 * client-side. Quite neat when you think about it and a decent solution until
 * we have a network-internal nickname system.
 *
 * @namespace rpReverseFederation
 */

/* jshint camelcase:false */
 
var sc = angular.module('paysharesClient');

sc.factory('rpReverseFederation', function ($q, $http, rpPaysharesTxt) {
    var results = {};

    function checkAddress(address) {

        var reverseFederationPromise = $q.defer();

        if(_.has(results, address)) {
            return results[address];
        }

        results[address] = reverseFederationPromise.promise;


        var domain = Options.DEFAULT_FEDERATION_DOMAIN;
        var txtPromise = rpPaysharesTxt.get(domain);

        if (txtPromise) {
            txtPromise.then(processTxt, handleNoTxt);
        } else {
            handleNoTxt();
        }

        return reverseFederationPromise.promise;

        function handleNoTxt() {
            reverseFederationPromise.reject({
                result: "error",
                error: "noPaysharesTxt",
                error_message: "Payshares.txt not available for the requested domain."
            });
        }

        function processTxt(txt) {
            if (!txt.reverse_federation_url) {
                reverseFederationPromise.reject({
                    result: "error",
                    error: "noReverseFederation",
                    error_message: "Reverse federation is not available on the requested domain."
                });
                return;
            }
            var config = {
                params: {
                    type: 'reverse_federation',
                    domain: domain,
                    destination_address: address
                }
            };
            $http.get(txt.reverse_federation_url[0], config)
            .success(function (data) {
                if ("object" === typeof data &&
                    "object" === typeof data.federation_json &&
                    data.federation_json.type === "federation_record" &&
                    data.federation_json.destination_address === address &&
                    data.federation_json.domain === domain) {
                    reverseFederationPromise.resolve(data.federation_json);
                } else if ("string" === typeof data.error) { 
                    reverseFederationPromise.reject({
                        result: "error",
                        error: "remote",
                        error_remote: data.error,
                        error_message: data.error_message ? "Service error: " + data.error_message : "Unknown remote service error."
                    });
                } else {
                    reverseFederationPromise.reject({
                        result: "error",
                        error: "unavailable",
                        error_message: "Federation gateway's response was invalid."
                    });
                }
            })
            .error(function () {
                reverseFederationPromise.reject({
                    result: "error",
                    error: "unavailable",
                    error_message: "Federation gateway did not respond."
                });
            });
        }
    }

    return {
        checkAddress: checkAddress
    };
});
