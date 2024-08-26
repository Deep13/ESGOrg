sap.ui.define([
    "sap/ui/model/json/JSONModel",
], function (JSONModel) {
    "use strict";
    return {
        // Firebase-config retrieved from the Firebase-console
        initializeFirebase: function () {
            // Replace with your config here
            const firebaseConfig = {
                apiKey: "AIzaSyDyKDAG4aFAWYXAF7yOBC2p2xEUERAYpOE",
                authDomain: "esgdashboard-2c535.firebaseapp.com",
                projectId: "esgdashboard-2c535",
                storageBucket: "esgdashboard-2c535.appspot.com",
                messagingSenderId: "585639322807",
                appId: "1:585639322807:web:9f7b670b47d828de58d932"
            };
            // Initialize Firebase with the Firebase-config
            firebase.initializeApp(firebaseConfig);
        },
        // Function to initialize Firebase with a specific configuration
        // initializeFirebaseApp: function (config) {
        //     if (!firebase.apps.some(app => app.name === "employee")) {
        //         firebase.initializeApp(config, "employee");
        //     } else {
        //         // If named app is already initialized, use it
        //         firebase.app("employee");
        //     }
        // }
    };
});