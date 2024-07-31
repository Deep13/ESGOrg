sap.ui.define([
    "sap/ui/model/json/JSONModel",
], function (JSONModel) {
    "use strict";
    return {
        // Firebase-config retrieved from the Firebase-console
        initializeFirebase: function () {
            // Replace with your config here
            const firebaseConfig = {
                apiKey: "AIzaSyCQqsFOFF3ckZexHzKiSLpP_J7vpYIH9us",
                authDomain: "organisation-91d00.firebaseapp.com",
                projectId: "organisation-91d00",
                storageBucket: "organisation-91d00.appspot.com",
                messagingSenderId: "753918608947",
                appId: "1:753918608947:web:693b9680cebf13a2624546"
            };
            // Initialize Firebase with the Firebase-config
            firebase.initializeApp(firebaseConfig);
        },
        // Function to initialize Firebase with a specific configuration
        initializeFirebaseApp: function (config) {
            if (!firebase.apps.some(app => app.name === "employee")) {
                firebase.initializeApp(config, "employee");
            } else {
                // If named app is already initialized, use it
                firebase.app("employee");
            }
        }
    };
});