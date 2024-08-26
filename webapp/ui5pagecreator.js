const fs = require('fs');
const path = require('path');

// Ensure required folders exist
const viewFolder = path.join(__dirname, 'view');
const controllerFolder = path.join(__dirname, 'controller');

if (!fs.existsSync(viewFolder)) {
    fs.mkdirSync(viewFolder, { recursive: true });
}

if (!fs.existsSync(controllerFolder)) {
    fs.mkdirSync(controllerFolder, { recursive: true });
}

// Get the argument passed to the script
const [, , clientName] = process.argv;

if (!clientName) {
    console.error('Please provide a view name as an argument.');
    process.exit(1);
}

// XML content for the view file
const viewContent = `<mvc:View controllerName="ESGOrg.ESGOrg.controller.${clientName}" xmlns:mvc="sap.ui.core.mvc"
    xmlns:core="sap.ui.core" displayBlock="true"
    xmlns="sap.m">
    <Page id="page" titleAlignment="Center" >
    <customHeader>
			<OverflowToolbar>
            <Button icon="sap-icon://navigation-left-arrow" tooltip="Back" press="onpressBack" />
				<Image src="./assets/company_logo.png" class="sapUiMediumMargin"
					width="60px" />
				<ToolbarSpacer />
				<Title text="${clientName}" />
				<ToolbarSpacer />
				<HBox alignItems="Center">
					<Button icon="sap-icon://log" tooltip="Log Out" press="onLogOut" />
					<Button icon="sap-icon://headset" tooltip="Support" press="" />
				</HBox>
			</OverflowToolbar>
		</customHeader>
        <content>
        </content>
        <footer>
        <OverflowToolbar>
            <HBox alignItems="Center" alignContent="Center" justifyContent="Center"
                width="100%">
                <Text text="Koshish Sustainable Solutions Pvt.Ltd © 2024" />
            </HBox>
        </OverflowToolbar>
    </footer>
    </Page>
</mvc:View>`;

// JavaScript content for the controller file
const controllerContent = `sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel"],
    function (Controller, JSONModel) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.${clientName}", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.${clientName}
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("${clientName}")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function () {
                this.checkgetUserLog().then(user => {
                    
                  });
            },
            onpressBack: function (oEvent) {
                this.oRouter.navTo("Main");
            },
            onLogOut: function () {
                this.logOut();
              }
        });
    }
);`;

// Paths for the new files
const viewFilePath = path.join(viewFolder, `${clientName}.view.xml`);
const controllerFilePath = path.join(controllerFolder, `${clientName}.controller.js`);

// Write the files
fs.writeFileSync(viewFilePath, viewContent);
fs.writeFileSync(controllerFilePath, controllerContent);

console.log(`Files created:
- ${viewFilePath}
- ${controllerFilePath}`);

// Read, modify, and write back the manifest.json file
const manifestPath = path.join(__dirname, './manifest.json');

if (!fs.existsSync(manifestPath)) {
    console.error('manifest.json not found.');
    process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

// Add the new route and target for the client
manifest['sap.ui5'].routing.routes.push({
    "name": clientName,
    "pattern": clientName,
    "target": clientName
});

manifest['sap.ui5'].routing.targets[clientName] = {
    "viewType": "XML",
    "transition": "slide",
    "viewName": clientName
};

// Write back the updated manifest.json
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`manifest.json updated with new route and target for ${clientName}.`);
