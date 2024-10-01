const fs = require('fs');
const path = require('path');

// Ensure required folders exist
const viewFolder = path.join(__dirname, 'view/Governance');
const controllerFolder = path.join(__dirname, 'controller/Governance');

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
const viewContent = `<mvc:View controllerName="ESGOrg.ESGOrg.controller.Governance.${clientName}" xmlns:mvc="sap.ui.core.mvc"
    xmlns:core="sap.ui.core" displayBlock="true"
    xmlns:object="sap.uxap"
    xmlns:layout="sap.ui.layout"
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
        <object:ObjectPageHeaderContent>
        <object:content>
            <layout:VerticalLayout class="sapUiMediumMarginTop">
                <ObjectStatus title="Organization" text="Rude Labs" />
                <ObjectStatus title="Country" text="India" />
                <ObjectStatus title="State/Circle/Zone/Office"
                    text="Jharkhand" />
                <ObjectStatus title="Branch/Office" text="Corporate" />
            </layout:VerticalLayout>
            <layout:VerticalLayout class="sapUiMediumMarginTop">
                <ObjectStatus title="Period" text="August" />
                <ObjectStatus title="Year" text="2024" />
                <ObjectStatus title="Scope" text="1" />
            </layout:VerticalLayout>
            <layout:VerticalLayout class="sapUiMediumMarginTop">
                <ObjectStatus title="Reporting" text="In Progress" state="Warning" />
                <ProgressIndicator
                    percentValue="30"
                    displayValue="30%"
                    showValue="true"
                    state="Warning" />
            </layout:VerticalLayout>

        </object:content>
    </object:ObjectPageHeaderContent>

    <VBox class="sapUiMediumMargin">
        <Table id="editableTable" inset="false" mode="MultiSelect" items="{/rows}"
        >
            <headerToolbar>
                <Toolbar>
                    <Title text="Editable Table" />
                    <ToolbarSpacer />
                    <Button text="Add Row" press="onAddRow" />
                    <Button text="Delete Selected" press="onDeleteRow" />

                </Toolbar>
            </headerToolbar>
            <columns>
                <!-- Columns will be added dynamically via the controller -->
            </columns>
            <items>
                <ColumnListItem>
                    <cells>
                        <!-- Cells will be added dynamically via the controller -->
                    </cells>
                </ColumnListItem>
            </items>
        </Table>

    </VBox>
</content>
<footer>
    <OverflowToolbar>
        <ToolbarSpacer />
        <Text text="Koshish Sustainable Solutions Pvt.Ltd © 2024" />
        <ToolbarSpacer />

        <Button text="Save as Draft" press="onSubmit" />
    </OverflowToolbar>
</footer>
    </Page>
</mvc:View>`;

// JavaScript content for the controller file
const controllerContent = `sap.ui.define(
    ["../../controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/Column",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/Select",
    "sap/ui/core/Item",
    "sap/m/ColumnListItem",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
],
    function (Controller, JSONModel, Column, Label, Input, Select, Item, ColumnListItem, MessageToast,MessageBox) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.Governance.${clientName}", {
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
                this.aColumns = [
                    {
                        name: "Fuels",
                        type: "dropdown",
                        dropdownValues: ["Fuels", "Bioenergy", "Refrigerant & other"]
                    },
                    {
                        name: "Type",
                        type: "dropdown",
                        dropdownValues: ["Gaseous fuels", "Liquid fuels", "Kyoto protocol - standard", "Solid fuels"]
                    },
                    {
                        name: "Fuel",
                        type: "dropdown",
                        dropdownValues: ["CNG", "LNG", "LPG"]
                    },
                    {
                        name: "Unit",
                        type: "dropdown",
                        dropdownValues: ["litres", "cubic metres", "tonnes"]
                    },
                    {
                        name: "Amount",
                        type: "text"
                    },
                    {
                        name: "Factor",
                        type: "text"
                    }
                ];

                this._initializeTable();
            },
            _initializeTable: function () {
                var oTable = this.byId("editableTable");
                oTable.removeAllColumns();
                var oModel = new sap.ui.model.json.JSONModel({
                    rows: []
                });
                this.getView().setModel(oModel);

                // Dynamically create columns based on aColumns array
                this.aColumns.forEach(function (column) {
                    oTable.addColumn(new Column({
                        header: new Label({ text: column.name })
                    }));
                }, this);

                // Add initial row
                this.onAddRow();
            },

            onAddRow: function () {
                var oTable = this.byId("editableTable");
                var oModel = this.getView().getModel();
                var oNewRow = {};
                var aCells = [];

                this.aColumns.forEach(function (oColumnData) {
                    oNewRow[oColumnData.name] = "";  // Initialize with empty value

                    // Create the cell based on column type
                    var oCellTemplate = this.createCellTemplate(oColumnData);
                    aCells.push(oCellTemplate);
                }.bind(this));

                var oNewItem = new ColumnListItem({
                    cells: aCells
                });

                oTable.addItem(oNewItem);

                var aRows = oModel.getProperty("/rows");
                aRows.push(oNewRow);
                oModel.setProperty("/rows", aRows);
            },

            onDeleteRow: function () {
                var oTable = this.byId("editableTable");
                var oModel = this.getView().getModel();
                var aSelectedItems = oTable.getSelectedItems();

                if (aSelectedItems.length === 0) {
                    MessageToast.show("Please select rows to delete.");
                    return;
                }

                var aRows = oModel.getProperty("/rows");

                aSelectedItems.forEach(function (oItem) {
                    var iIndex = oTable.indexOfItem(oItem);
                    aRows.splice(iIndex, 1);
                });

                oModel.setProperty("/rows", aRows);
                oTable.removeSelections();
            },

            onSubmit: function () {
                var oModel = this.getView().getModel();
                var aData = oModel.getProperty("/rows");
                console.log(aData);
                MessageBox.success("Data recorded successfully")
            },

            createCellTemplate: function (oColumnData) {
                if (oColumnData.type === "dropdown") {
                    return new Select({
                        items: oColumnData.dropdownValues.map(function (value) {
                            return new Item({ key: value, text: value });
                        }),
                        selectedKey: "{path: '" + oColumnData.name + "'}",
                        forceSelection: false
                    });
                } else if (oColumnData.type === "text") {
                    return new Input({
                        value: "{path: '" + oColumnData.name + "'}"
                    });
                }
            },
            onpressBack: function (oEvent) {
                this.oRouter.navTo("GovernanceReporting");
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
    "viewName": "Governance/" + clientName
};

// Write back the updated manifest.json
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`manifest.json updated with new route and target for ${clientName}.`);
