

sap.ui.define([
    "sap/ui/model/json/JSONModel",
], function (JSONModel) {
    "use strict";
    return {
        // Firebase-config retrieved from the Firebase-console
        getConfig: function (name) {
            const firebaseConfigs = {
                "rudelabs": {
                    apiKey: "AIzaSyCTU9-G2JK39AM4wugtU9jpbkfxdApee20",
                    authDomain: "rudelabs-fadc8.firebaseapp.com",
                    projectId: "rudelabs-fadc8",
                    storageBucket: "rudelabs-fadc8.appspot.com",
                    messagingSenderId: "406068852570",
                    appId: "1:406068852570:web:20bb7150848f38bbc32563"
                },
                "sigmaearth": {
                    apiKey: "AIzaSyCTU9-G2JK39AM4wugtU9jpbkfxdApee20",
                    authDomain: "rudelabs-fadc8.firebaseapp.com",
                    projectId: "rudelabs-fadc8",
                    storageBucket: "rudelabs-fadc8.appspot.com",
                    messagingSenderId: "406068852570",
                    appId: "1:406068852570:web:20bb7150848f38bbc32563"
                }
            };
            return firebaseConfigs[name];
        }
    };
});