sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel", "../assets/js/firebaseConfigs", "../assets/js/Firebase"],
    function (Controller, JSONModel, firebaseConfigs, Firebase) {
        "use strict";

        return Controller.extend("ESGOrg.ESGOrg.controller.EmployeeLogin", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.ClientPayment
             */
            onInit: function () {
                this.getRouter()
                    .getRoute("EmployeeLogin")
                    .attachPatternMatched(this._handleRouteMatched, this);


            },
            _handleRouteMatched: function () {
                var data = this.getUserLog();
                // if (data) {
                //     // alert('user logged in');
                //     this.getRouter().navTo("Main");
                // }
            },
            onLogin: function () {
                var that = this;
                var email = this.getView().byId('userInput').getValue();
                var password = this.getView().byId('passwordInput').getValue();
                firebase.app("employee").auth().signInWithEmailAndPassword(email, password).then(async function (usersigned) {
                    // const userDoc = await firestore.collection('users').doc(usersigned.user.uid).get();
                    // if (userDoc.exists) {
                    //     const organizationId = userDoc.data().DB;
                    //     const config = firebaseConfigs.getConfig(organizationId);
                    //     const configModel = Firebase.initializeFirebaseApp(config);
                    //     that.setModel(configModel, "fbModel");
                    // }
                    that.getRouter().navTo("Main");

                }).catch(function (error) {
                    // console.log(error)
                    var msg = "";
                    if (error.message) {
                        try {
                            msg = JSON.parse(error.message);
                            msg = msg.error.message;

                        }
                        catch {
                            msg = error.message;
                        }
                    }
                    else {
                        msg = error.toString();
                    }
                    alert(msg)
                })
            }

        });
    }
);
