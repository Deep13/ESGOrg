/*
 * ! OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./Control","./ActionToolbar","./table/TableSettings","./table/GridTableType","./table/V4AnalyticsTableType","./table/ResponsiveTableType","./table/PropertyHelper","./mixin/FilterIntegrationMixin","./library","sap/m/Text","sap/m/Title","sap/m/ColumnHeaderPopover","sap/m/ColumnPopoverSortItem","sap/m/OverflowToolbar","sap/m/library","sap/ui/core/Core","sap/ui/core/format/NumberFormat","sap/ui/core/dnd/DragDropInfo","sap/ui/core/Item","sap/ui/core/format/ListFormat","sap/ui/events/KeyCodes","sap/ui/model/Sorter","sap/ui/dom/containsOrEquals","sap/base/strings/capitalize","sap/base/util/deepEqual"],function(C,A,T,G,V,R,P,F,l,a,b,c,d,O,M,e,N,D,I,L,K,S,f,g,h){"use strict";var i=l.SelectionMode;var j=l.TableType;var k=l.RowAction;var m=M.ToolbarDesign;var s="sap.ui.mdc.IFilter";var n=new window.WeakMap();var o=function(B){if(!n.has(B)){n.set(B,{oFilterInfoBar:null});}return n.get(B);};function p(B,E){sap.ui.require(["sap/m/MessageToast"],function(H){var J=e.getLibraryResourceBundle("sap.ui.mdc");H.show(J.getText(B,E));});}var q=C.extend("sap.ui.mdc.Table",{library:"sap.ui.mdc",metadata:{designtime:"sap/ui/mdc/designtime/table/Table.designtime",interfaces:["sap.ui.mdc.IFilterSource","sap.ui.mdc.IxState"],defaultAggregation:"columns",properties:{width:{type:"sap.ui.core.CSSSize",group:"Dimension",defaultValue:null,invalidate:true},height:{type:"sap.ui.core.CSSSize",group:"Dimension",defaultValue:null,invalidate:true},rowAction:{type:"sap.ui.mdc.RowAction[]",defaultValue:[]},p13nMode:{type:"sap.ui.mdc.TableP13nMode[]",defaultValue:[]},delegate:{type:"object",defaultValue:{name:"sap/ui/mdc/TableDelegate",payload:{}}},headerLevel:{type:"sap.ui.core.TitleLevel",group:"Appearance",defaultValue:sap.ui.core.TitleLevel.Auto},rowsBindingInfo:{type:"object",defaultValue:null},autoBindOnInit:{type:"boolean",group:"Misc",defaultValue:true},header:{type:"string",group:"Misc",defaultValue:null},headerVisible:{type:"boolean",group:"Misc",defaultValue:true},selectionMode:{type:"sap.ui.mdc.SelectionMode",defaultValue:i.None},showRowCount:{type:"boolean",group:"Misc",defaultValue:true},threshold:{type:"int",group:"Appearance",defaultValue:-1},noDataText:{type:"string"},sortConditions:{type:"object"},filterConditions:{type:"object",defaultValue:{}},enableExport:{type:"boolean",defaultValue:false},busyIndicatorDelay:{type:"int",defaultValue:100}},aggregations:{_content:{type:"sap.ui.core.Control",multiple:false,visibility:"hidden"},type:{type:"sap.ui.mdc.table.TableTypeBase",altTypes:["sap.ui.mdc.TableType"],multiple:false},columns:{type:"sap.ui.mdc.table.Column",multiple:true},creationRow:{type:"sap.ui.mdc.table.CreationRow",multiple:false},actions:{type:"sap.ui.core.Control",multiple:true,forwarding:{getter:"_createToolbar",aggregation:"actions"}},variant:{type:"sap.ui.fl.variants.VariantManagement",multiple:false},quickFilter:{type:"sap.ui.core.Control",multiple:false},rowSettings:{type:"sap.ui.mdc.table.RowSettings",multiple:false}},associations:{filter:{type:s,multiple:false}},events:{rowPress:{parameters:{bindingContext:{type:"sap.ui.model.Context"}}},selectionChange:{parameters:{bindingContext:{type:"sap.ui.model.Context"},selected:{type:"boolean"},selectAll:{type:"boolean"}}},beforeExport:{parameters:{exportSettings:{type:"object"},userExportSettings:{type:"object"}}},paste:{parameters:{data:{type:"string[][]"}}}}},constructor:function(){this._oTableReady=new Promise(this._resolveTable.bind(this));this._oAdaptationController=null;C.apply(this,arguments);this.bCreated=true;this._doOneTimeOperations();this._initializeContent();},renderer:{apiVersion:2,render:function(B,E){B.openStart("div",E);B.class("sapUiMdcTable");B.style("height",E.getHeight());B.style("width",E.getWidth());B.openEnd();B.renderControl(E.getAggregation("_content"));B.close("div");}}});var t=["variant","quickFilter"];F.call(q.prototype);t.forEach(function(B){var E=g(B),H="_o"+E,J="get"+E,Q="set"+E,U="destroy"+E;q.prototype[J]=function(){return this[H];};q.prototype[U]=function(){var W=this[H];this[Q]();if(W){W.destroy();}return this;};q.prototype[Q]=function(W){this.validateAggregation(B,W,false);var X=this._createToolbar(),Y=W!==this[H];if(!W||Y){X.removeBetween((this[J]()));this[H]=W;}if(Y&&W){this._setToolbarBetween(X);}return this;};});q.prototype.init=function(){C.prototype.init.apply(this,arguments);this.mSkipPropagation={rowSettings:true};var B=sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");this.setProperty("adaptationConfig",{itemConfig:{changeOperations:{add:"addColumn",remove:"removeColumn",move:"moveColumn"},adaptationUI:"sap/ui/mdc/p13n/panels/SelectionPanel",containerSettings:{title:B.getText("table.SETTINGS_COLUMN")}}});};q.prototype.applySettings=function(){C.prototype.applySettings.apply(this,arguments);this.initControlDelegate();};q.prototype._setToolbarBetween=function(B){[this._oVariant,this._oQuickFilter].forEach(function(E){if(E){B.addBetween(E);}});};q.prototype.initialized=function(){return this._oTableReady;};q.prototype._resolveTable=function(B,E){this._fResolve=B;this._fReject=E;};q.prototype._getStringType=function(B){var E,H=E=B||this.getType();if(!H){E=j.Table;}else if(typeof H==="object"){if(H.isA("sap.ui.mdc.table.ResponsiveTableType")){E=j.ResponsiveTable;}else if(H.isA("sap.ui.mdc.table.V4AnalyticsTableType")){E="V4AnalyticsTable";}else{E=j.Table;}}return E;};q.prototype._updateTypeSettings=function(){var B=this.getType();if(B&&typeof B==="object"){B.updateTableSettings();}else{if(B==="ResponsiveTable"){B=R;}else if(B==="V4AnalyticsTable"){B=V;}else{B=G;}B.updateDefault(this._oTable);}};q.prototype.scrollToIndex=function(B){if(!this._oTable||(typeof B!=="number")){return;}if(this._getStringType()===j.ResponsiveTable){this._oTable.scrollToIndex(B);}else{if(B===-1){B=this.getRowBinding()?this.getRowBinding().getLength():0;}this._oTable.setFirstVisibleRow(B);}};q.prototype.setType=function(B){var E=this._getStringType(B);var H=this._getStringType();this.setAggregation("type",B,true);if(E===H&&this._oTable){this._updateTypeSettings();return this;}if(this.bCreated){if(this._oTable){if(H==="ResponsiveTable"){this._oTable.setHeaderToolbar();}else{this._oTable.removeExtension(this._oToolbar);}this._oTable.destroy("KeepDom");this._oTable=null;this._bTableExists=false;}else{this._onAfterTableCreated();}if(this._oTemplate){this._oTemplate.destroy();this._oTemplate=null;}this._oTableReady=new Promise(this._resolveTable.bind(this));this._initializeContent();}return this;};q.prototype.setRowSettings=function(B){var E=this._getStringType();this.setAggregation("rowSettings",B,true);if(this._oTable){if(E==="ResponsiveTable"){R.updateRowSettings(this._oTemplate,B);this.checkAndRebind();}else{G.updateRowSettings(this._oTable,B);}}return this;};q.prototype.setHeaderLevel=function(B){if(this.getHeaderLevel()===B){return this;}this.setProperty("headerLevel",B,true);this._oTitle&&this._oTitle.setLevel(B);return this;};q.prototype.focus=function(B){var E=this.getDomRef();if(this._oTable&&E&&!f(E,document.activeElement)){this._oTable.focus();}};q.prototype.setBusy=function(B){this.setProperty('busy',B,true);if(this._oTable){this._oTable.setBusy(B);}return this;};q.prototype.setBusyIndicatorDelay=function(B){this.setProperty('busyIndicatorDelay',B,true);if(this._oTable){this._oTable.setBusyIndicatorDelay(B);}return this;};q.prototype.setSelectionMode=function(B){var E=this.getSelectionMode();this.setProperty("selectionMode",B,true);if(this._oTable&&E!=this.getSelectionMode()){this._updateSelectionBehavior();}return this;};q.prototype.setRowAction=function(B){var E=this.getRowAction();this.setProperty("rowAction",B,true);if(!h(E.sort(),this.getRowAction().sort())){this._updateRowAction();}return this;};q.prototype.setCreationRow=function(B){this.setAggregation("creationRow",B,true);if(B){B.update();}return this;};q.prototype.setP13nMode=function(B){var E=this.getP13nMode();this.setProperty("p13nMode",B,true);if(!h(E.sort(),this.getP13nMode().sort())){u(this);}return this;};function u(B){if(B._oToolbar){B._oToolbar.destroyEnd();B._getP13nButtons().forEach(function(H){B._oToolbar.addEnd(H);});}if(B._oTable){var E=B._oTable.getDragDropConfig()[0];if(E){E.setEnabled(B.getP13nMode().indexOf("Column")>-1);}}if(B.isFilteringEnabled()){v(B);}r(B);}q.prototype.setFilterConditions=function(B){this.setProperty("filterConditions",B,true);var E=this.getInbuiltFilter();if(E){E.setFilterConditions(B);}r(this);return this;};function r(B){var E=x(B);var H=y(B);var J=z(B);if(!E){return;}if(J.length===0||!B.isFilteringEnabled()){var Q=E.getDomRef();if(Q&&Q.contains(document.activeElement)){B.focus();}E.setVisible(false);return;}B.awaitPropertyHelper().then(function(U){var W=J.map(function($){return U.getLabel($);});var X=e.getLibraryResourceBundle("sap.ui.mdc");var Y=L.getInstance();var Z=X.getText("table.FILTER_INFO",Y.format(W));E.setVisible(true);H.setText(Z);});}function v(B){if(!B._oTable){return;}var E=x(B);if(!E){E=w(B);}if(B._bMobileTable){if(B._oTable.getInfoToolbar()!==E){B._oTable.setInfoToolbar(E);B._oTable.addAriaLabelledBy(y(B));}}else if(B._oTable.indexOfExtension(E)===-1){B._oTable.insertExtension(E,1);B._oTable.addAriaLabelledBy(y(B));}}function w(B){var E=B.getId()+"-filterInfoBar";var H=o(B).oFilterInfoBar;if(H&&!H.bIsDestroyed){H.destroy();}H=new O({id:E,active:true,design:m.Info,visible:false,content:[new a({id:E+"-text",wrapping:false})],press:function(){T.showPanel(B,"Filter",H);}});H.focus=function(){if(this.getDomRef()){O.prototype.focus.apply(this,arguments);}else{B.focus();}};o(B).oFilterInfoBar=H;r(B);return H;}function x(B){var E=o(B).oFilterInfoBar;if(E&&(E.bIsDestroyed||E.bIsBeingDestroyed)){return null;}return o(B).oFilterInfoBar;}function y(B){var E=x(B);return E?E.getContent()[0]:null;}q.prototype.setThreshold=function(B){this.setProperty("threshold",B,true);if(!this._oTable){return this;}B=this.getThreshold()>-1?this.getThreshold():undefined;if(this._bMobileTable){this._oTable.setGrowingThreshold(B);}else{this._oTable.setThreshold(B);}return this;};q.prototype._onFilterProvided=function(){this._updateInnerTableNoDataText();};q.prototype.setNoDataText=function(B){this.setProperty("noDataText",B,true);this._updateInnerTableNoDataText();return this;};q.prototype._updateInnerTableNoDataText=function(){if(!this._oTable){return;}var B=this._getNoDataText();if(this._bMobileTable){this._oTable.setNoDataText(B);}else{this._oTable.setNoData(B);}};q.prototype._getNoDataText=function(){var B=this.getNoDataText();if(B){return B;}var E=e.getLibraryResourceBundle("sap.ui.mdc");if(!this.isTableBound()){if(this.getFilter()){return E.getText("table.NO_DATA_WITH_FILTERBAR");}return E.getText("table.NO_DATA");}return E.getText("table.NO_RESULTS");};q.prototype._updateRowAction=function(){if(!this._oTable){return;}var B=this.getRowAction().indexOf(k.Navigation)>-1;var E=this._bMobileTable?R:G;E.updateRowAction(this,B,this._bMobileTable?undefined:this._onRowActionPress);};q.prototype._initializeContent=function(){var B,E=this._getStringType();if(E==="ResponsiveTable"){B=R;}else if(E==="V4AnalyticsTable"){B=V;}else{B=G;}Promise.all([this.awaitControlDelegate(),B.loadTableModules(),this.retrieveAdaptationController()]).then(function(){if(this.bIsDestroyed){return;}if(!this._bTableExists&&E===this._getStringType()){this._bMobileTable=E==="ResponsiveTable";this._createContent();this._bTableExists=true;}}.bind(this));};q.prototype._doOneTimeOperations=function(){if(!this.bColumnsOrdered){this.bColumnsOrdered=true;this._orderColumns();}};q.prototype._onAfterTableCreated=function(B){if(B&&this._fResolve){this._fResolve(this);}else if(this._fReject){this._fReject(this);}delete this._fResolve;delete this._fReject;};q.prototype._createContent=function(){this._createToolbar();this._createTable();this._updateRowAction();var B=this.getColumns();B.forEach(this._insertInnerColumn,this);this.setAggregation("_content",this._oTable);this._onAfterTableCreated(true);this.initialized().then(function(){this.initPropertyHelper(P);var E=this.getCreationRow();if(E){E.update();}if(this.getAutoBindOnInit()){this.checkAndRebind();}}.bind(this));};q.prototype.setHeader=function(B){this.setProperty("header",B,true);this._updateHeaderText();this._updateExportState(true);return this;};q.prototype.setHeaderVisible=function(B){this.setProperty("headerVisible",B,true);if(this._oTitle){this._oTitle.setWidth(this.getHeaderVisible()?undefined:"0px");}return this;};q.prototype.setEnableExport=function(E){if(E!==this.getEnableExport()){this.setProperty("enableExport",E,true);if(E&&!this._oExportButton&&this._oToolbar){this._oToolbar.addEnd(this._getExportButton());}else if(this._oExportButton){this._oExportButton.setVisible(E);}}return this;};q.prototype._createToolbar=function(){if(!this._oToolbar){this._oTitle=new b(this.getId()+"-title",{text:this.getHeader(),width:this.getHeaderVisible()?undefined:"0px",level:this.getHeaderLevel()});this._oToolbar=new A(this.getId()+"-toolbar",{design:"Transparent",begin:[this._oTitle],end:[this._getP13nButtons(),this._getExportButton()]});}return this._oToolbar;};q.prototype._getVisibleProperties=function(){var B=[],E;this.getColumns().forEach(function(H,J){E=H&&H.getDataProperty();if(E){B.push({name:E});}});return B;};q.prototype.getConditions=function(){return this.getInbuiltFilter()?this.getInbuiltFilter().getConditions():[];};q.prototype._getSortedProperties=function(){return this.getSortConditions()?this.getSortConditions().sorters:[];};function z(B){var E=B.getFilterConditions();return Object.keys(E).filter(function(H){return E[H].length>0;});}q.prototype.getCurrentState=function(){var B={};var E=this.getP13nMode();if(E.indexOf("Column")>-1){B.items=this._getVisibleProperties();}if(this.isSortingEnabled()){B.sorters=this._getSortedProperties();}if(this.isFilteringEnabled()){B.filter=this.getFilterConditions();}return B;};q.prototype.isFilteringEnabled=function(){return this.getP13nMode().indexOf("Filter")>-1;};q.prototype.retrieveInbuiltFilter=function(){var B=sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");return C.prototype.retrieveInbuiltFilter.call(this,this._registerInnerFilter,false).then(function(E){var H={adaptationUI:E,applyFilterChangeOn:E,initializeControl:E.createFilterFields,sortData:false,containerSettings:{title:B.getText("filter.PERSONALIZATION_DIALOG_TITLE")}};this.enhanceAdaptationConfig({filterConfig:H});return E;}.bind(this));};q.prototype.isSortingEnabled=function(){return this.getP13nMode().indexOf("Sort")>-1;};q.prototype._getP13nButtons=function(){var B=this.getP13nMode();var E=[];if(this.isSortingEnabled()){E.push(T.createSortButton(this.getId(),[this._showSort,this]));}if(this.isFilteringEnabled()){E.push(T.createFilterButton(this.getId(),[this._showFilter,this]));}if(B.indexOf("Column")>-1){E.push(T.createColumnsButton(this.getId(),[this._showSettings,this]));}return E;};q.prototype._getExportButton=function(){if(!this.getEnableExport()){return null;}var B={fileName:this.getHeader()};if(!this._cachedExportSettings){this._cachedExportSettings=B;}if(!this._oExportButton){this._oExportButton=T.createExportButton(this.getId(),{"default":[function(){this._onExport(B);},this],"exportAs":[this._onExportAs,this]});}this._updateExportState();return this._oExportButton;};q.prototype._updateExportState=function(U){var B=this._getRowBinding();if(this._oExportButton){this._oExportButton.setEnabled(!!(B&&B.getLength()>0));if(U&&this._cachedExportSettings){this._cachedExportSettings.fileName=this.getHeader();}}};q.prototype._createExportColumnConfiguration=function(B){var E=B&&B.splitCells;var H=this.getColumns();return this.awaitPropertyHelper().then(function(J){var Q=[];H.forEach(function(U){var W=J.getColumnExportSettings(U,E);Q=Q.concat(W);},this);return[Q,J];}.bind(this));};q.prototype._onExport=function(B){return this._createExportColumnConfiguration(B).then(function(E){var H=E[0];var J=E[1];if(!H||!H.length){sap.ui.require(["sap/m/MessageBox"],function(W){W.error(e.getLibraryResourceBundle("sap.ui.mdc").getText("table.NO_COLS_EXPORT"),{styleClass:(this.$()&&this.$().closest(".sapUiSizeCompact").length)?"sapUiSizeCompact":""});}.bind(this));return;}var Q=this._getRowBinding();var U={workbook:{columns:H},dataSource:Q,fileName:B?B.fileName:this.getHeader()};this._loadExportLibrary().then(function(){sap.ui.require(["sap/ui/export/ExportUtils","sap/ui/export/Spreadsheet"],function(W,X){var Y=Promise.resolve();if(B.includeFilterSettings){Y=W.parseFilterConfiguration(Q,function(Z){return J.getLabel(Z);}).then(function(Z){if(Z){U.workbook.context={metaSheetName:Z.name,metainfo:[Z]};}});}Y.then(function(){var Z={splitCells:false,includeFilterSettings:false};if(B){Z.splitCells=B.splitCells;Z.includeFilterSettings=B.includeFilterSettings;}var $=new X(U);$.attachBeforeExport(function(_){this.fireBeforeExport({exportSettings:_.getParameter("exportSettings"),userExportSettings:Z});},this);$.build().finally(function(){$.destroy();});}.bind(this));}.bind(this));}.bind(this));}.bind(this));};q.prototype._onExportAs=function(){var B=this;this._loadExportLibrary().then(function(){sap.ui.require(['sap/ui/export/ExportUtils'],function(E){E.getExportSettingsViaDialog(B._cachedExportSettings,B).then(function(U){B._cachedExportSettings=U;B._onExport(U);});});});};q.prototype._loadExportLibrary=function(){if(!this._oExportLibLoadPromise){this._oExportLibLoadPromise=e.loadLibrary("sap.ui.export",true);}return this._oExportLibLoadPromise;};q.prototype.onkeydown=function(E){if(E.isMarked()){return;}if((E.metaKey||E.ctrlKey)&&E.shiftKey&&E.which===K.E){if(this.getEnableExport()&&this._oExportButton&&this._oExportButton.getEnabled()){this._onExportAs();E.setMarked();E.preventDefault();}}};q.prototype._createTable=function(){var B=this.getThreshold()>-1?this.getThreshold():undefined;var E=this.getRowSettings()?this.getRowSettings().getAllSettings():{};if(this._bMobileTable){this._oTable=R.createTable(this.getId()+"-innerTable",{autoPopinMode:true,growing:true,sticky:["ColumnHeaders","HeaderToolbar","InfoToolbar"],itemPress:[this._onItemPress,this],selectionChange:[this._onSelectionChange,this],growingThreshold:B,noDataText:this._getNoDataText(),headerToolbar:this._oToolbar,ariaLabelledBy:[this._oTitle]});this._oTemplate=R.createTemplate(this.getId()+"-innerTableRow",E);this._createColumn=q.prototype._createMobileColumn;this._sAggregation="items";this._oTable.bindRows=this._oTable.bindItems;this._oTable.bActiveHeaders=true;this._oTable.attachEvent("columnPress",this._onResponsiveTableColumnPress,this);}else{this._oTable=G.createTable(this.getId()+"-innerTable",{enableBusyIndicator:true,enableColumnReordering:false,threshold:B,cellClick:[this._onCellClick,this],noData:this._getNoDataText(),extension:[this._oToolbar],ariaLabelledBy:[this._oTitle],plugins:[G.createMultiSelectionPlugin(this,[this._onRowSelectionChange,this])],columnSelect:[this._onGridTableColumnPress,this],rowSettingsTemplate:E});this._createColumn=q.prototype._createColumn;this._sAggregation="rows";}this._updateTypeSettings();this._updateSelectionBehavior();var H=new D({sourceAggregation:"columns",targetAggregation:"columns",dropPosition:"Between",enabled:this.getP13nMode().indexOf("Column")>-1,drop:[this._onColumnRearrange,this]});H.bIgnoreMetadataCheck=true;this._oTable.addDragDropConfig(H);this._oTable.setBusyIndicatorDelay(this.getBusyIndicatorDelay());this._oTable.attachPaste(this._onInnerTablePaste,this);if(this.isFilteringEnabled()){v(this);}};q.prototype._updateSelectionBehavior=function(){var B=this._bMobileTable?R:G;B.updateSelection(this);};q.prototype._onColumnRearrange=function(E){var B=E.getParameter("draggedControl");var H=E.getParameter("droppedControl");if(B===H){return;}var J=E.getParameter("dropPosition");var Q=this._oTable.indexOfColumn(B);var U=this._oTable.indexOfColumn(H);var W=U+(J=="Before"?0:1)+(Q<U?-1:0);T.moveColumn(this,Q,W);};q.prototype._onColumnPress=function(B){if(!this.isSortingEnabled()){return;}var E,H=B.getParent(),J;E=H.indexOfColumn(B);J=this.getColumns()[E];this.awaitPropertyHelper().then(function(Q){var U=Q.getSortableProperties(J.getDataProperty());if(!U||!U.length){return;}var W,X=[];U.forEach(function(Y){W=new I({text:Q.getName(Y),key:Q.getName(Y)});X.push(W);});if(X.length>0){if(this._oPopover){this._oPopover.destroy();}this._oPopover=new c({items:[new d({items:X,sort:[this._onCustomSort,this]})]});this._oPopover.openBy(B);B.addDependent(this._oPopover);}}.bind(this));};q.prototype._onCustomSort=function(E){var B=E.getParameter("property");T.createSort(this,B,true);};q.prototype._insertInnerColumn=function(B,E){if(!this._oTable){return;}var H=this._createColumn(B);this._setColumnTemplate(B,H,E);if(E===undefined){this._oTable.addColumn(H);}else{this._oTable.insertColumn(H,E);}};q.prototype._orderColumns=function(){var B,E=[],H=this.getColumns();H.forEach(function(J){B=J.getInitialIndex();if(B>-1){E.push({index:B,column:this.removeColumn(J)});}},this);E.sort(function(J,Q){return J-Q;});E.forEach(function(J){this.insertColumn(J.column,J.index);},this);};q.prototype._setColumnTemplate=function(B,E,H){var J=B.getTemplate(true),Q;if(!this._bMobileTable){Q=B.getCreationTemplate(true);[J,Q].forEach(function(U){if(!U){return;}if(U.setWrapping){U.setWrapping(false);}if(U.setRenderWhitespace){U.setRenderWhitespace(false);}});E.setTemplate(J);E.setCreationTemplate(Q);}else if(H>=0){this._oTemplate.insertCell(J,H);}else{this._oTemplate.addCell(J);}};q.prototype._createColumn=function(B){return G.createColumn(B.getId()+"-innerColumn",{width:B.getWidth(),minWidth:Math.round(B.getMinWidth()*parseFloat(M.BaseFontSize)),hAlign:B.getHAlign(),label:B.getColumnHeaderControl(this._bMobileTable)});};q.prototype._createMobileColumn=function(B){return R.createColumn(B.getId()+"-innerColumn",{width:B.getWidth(),autoPopinWidth:B.getMinWidth(),hAlign:B.getHAlign(),header:B.getColumnHeaderControl(this._bMobileTable),importance:B.getImportance(),popinDisplay:"Inline"});};q.prototype.moveColumn=function(B,E){var H;this.removeAggregation("columns",B,true);this.insertAggregation("columns",B,E,true);if(this._oTable){H=this._oTable.removeColumn(B.getId()+"-innerColumn");this._oTable.insertColumn(H,E);if(this._bMobileTable){this._updateColumnTemplate(B,E);}}};q.prototype.removeColumn=function(B){B=this.removeAggregation("columns",B,true);if(this._oTable){var E=this._oTable.removeColumn(B.getId()+"-innerColumn");E.destroy();if(this._bMobileTable){this._updateColumnTemplate(B,-1);}}return B;};q.prototype.addColumn=function(B){this.addAggregation("columns",B,true);this._insertInnerColumn(B);return this;};q.prototype.insertColumn=function(B,E){this.insertAggregation("columns",B,E,true);this._insertInnerColumn(B,E);return this;};q.prototype._updateColumnTemplate=function(B,E){var H,J;if(this._oTemplate){H=B.getTemplate(true);J=this._oTemplate.indexOfCell(H);q._removeItemCell(this._oTemplate,J,E);}if(J>-1){this._oTable.getItems().forEach(function(Q){if(Q.removeCell){q._removeItemCell(Q,J,E);}});}};q._removeItemCell=function(B,E,H){var J=B.removeCell(E);if(J){if(H>-1){B.insertCell(J,H);}else{J.destroy();}}};q.prototype._onItemPress=function(E){this.fireRowPress({bindingContext:E.getParameter("listItem").getBindingContext()});};q.prototype._onSelectionChange=function(E){var B=E.getParameter("selectAll");this.fireSelectionChange({bindingContext:E.getParameter("listItem").getBindingContext(),selected:E.getParameter("selected"),selectAll:B});if(B){var H=this.getRowBinding();if(H&&this._oTable){var J=H.getLength();var Q=this._oTable.getItems().length;var U=H.isLengthFinal();if(Q!=J||!U){p("table.SELECTION_LIMIT_MESSAGE",[Q]);}}}};q.prototype._onResponsiveTableColumnPress=function(E){this._onColumnPress(E.getParameter("column"));};q.prototype._onCellClick=function(E){this.fireRowPress({bindingContext:E.getParameter("rowBindingContext")});};q.prototype._onRowActionPress=function(E){var B=E.getParameter("row");this.fireRowPress({bindingContext:B.getBindingContext()});};q.prototype._onRowSelectionChange=function(E){if(!this._bSelectionChangedByAPI){this.fireSelectionChange({bindingContext:E.getParameter("rowContext"),selected:E.getSource().isIndexSelected(E.getParameter("rowIndex")),selectAll:E.getParameter("selectAll")});}};q.prototype._onGridTableColumnPress=function(E){E.preventDefault();this._onColumnPress(E.getParameter("column"));};q.prototype.getSelectedContexts=function(){if(this._oTable){if(this._bMobileTable){return this._oTable.getSelectedContexts();}var B=this._oTable.getPlugins()[0].getSelectedIndices();return B.map(function(E){return this._oTable.getContextByIndex(E);},this);}return[];};q.prototype.clearSelection=function(){if(this._oTable){if(this._bMobileTable){this._oTable.removeSelections(true);}else{this._bSelectionChangedByAPI=true;this._oTable.getPlugins()[0].clearSelection();this._bSelectionChangedByAPI=false;}}};q.prototype._registerInnerFilter=function(B){B.attachSearch(this.rebind,this);};q.prototype._onFiltersChanged=function(E){if(this.isTableBound()&&E.getParameter("conditionsBased")){this._oTable.setShowOverlay(true);}};q.prototype.isTableBound=function(){return this._oTable?this._oTable.isBound(this._bMobileTable?"items":"rows"):false;};q.prototype.bindRows=function(B){if(!this.bDelegateInitialized||!this._oTable){return;}this.getControlDelegate().updateBindingInfo(this,this.getPayload(),B);if(B&&B.path){this._oTable.setShowOverlay(false);if(this._bMobileTable&&this._oTemplate){B.template=this._oTemplate;}else{delete B.template;}if(!B.parameters){B.parameters={};}B.sorter=this._getSorters();if(this.getShowRowCount()){q._addBindingListener(B,"dataReceived",this._onDataReceived.bind(this));q._addBindingListener(B,"change",this._updateHeaderText.bind(this));}this._updateColumnsBeforeBinding(B);this.getControlDelegate().rebindTable(this,B);this._updateInnerTableNoDataText();}return this;};q.prototype._onDataReceived=function(E){if(E&&E.getParameter&&E.getParameter("__simulateAsyncAnalyticalBinding")){return;}this._updateHeaderText();this._updateExportState();};q.prototype._updateHeaderText=function(){var H,B;if(this._oTitle&&this.getHeader()){H=this.getHeader();if(this.getShowRowCount()){B=this._getRowCount();if(B){H+=" ("+B+")";}}this._oTitle.setText(H);}};q.prototype._updateColumnsBeforeBinding=function(B){var E=[].concat(B.sorter||[]);var H=this.getColumns();var J=this._bMobileTable;this.awaitPropertyHelper().then(function(Q){H.forEach(function(U){var W=e.byId(U.getId()+"-innerColumn");var X=Q.getSortableProperties(U.getDataProperty());var Y=X&&X.map(function(_){return Q.getPath(_);});if(Y){var Z=E.find(function(Z){return Y.indexOf(Z.sPath)>-1;});var $=Z&&Z.bDescending?"Descending":"Ascending";if(J){W.setSortIndicator(Z?$:"None");}else{W.setSorted(!!Z).setSortOrder($);}}});});};q.prototype._getRowCount=function(){var B=this.getRowBinding(),E,H="";if(B){E=B.getLength();if(!this._oNumberFormatInstance){this._oNumberFormatInstance=N.getFloatInstance();}if(B.isLengthFinal()){H=this._oNumberFormatInstance.format(E);}}return H;};q.prototype.getRowBinding=function(){return this._getRowBinding();};q.prototype._getRowBinding=function(){if(this._oTable){return this._oTable.getBinding(this._sAggregation);}};q._addBindingListener=function(B,E,H){if(!B.events){B.events={};}if(!B.events[E]){B.events[E]=H;}else{var J=B.events[E];B.events[E]=function(){H.apply(this,arguments);J.apply(this,arguments);};}};q.prototype.rebindTable=function(){this.rebind();};q.prototype.rebind=function(){if(this._bTableExists){this.bindRows(this.getRowsBindingInfo()||{});}else{this.initialized().then(this.rebind.bind(this));}};q.prototype._showSettings=function(E){T.showPanel(this,"Columns",E.getSource());};q.prototype._showSort=function(E){T.showPanel(this,"Sort",E.getSource());};q.prototype._showFilter=function(E){T.showPanel(this,"Filter",E.getSource());};q.prototype._getSorters=function(){var B=this.getSortConditions()?this.getSortConditions().sorters:[];var E=[];B.forEach(function(H){E.push(new S(H.name,H.descending));});return E;};q.prototype._onInnerTablePaste=function(E){this.firePaste({data:E.getParameter("data")});};q.prototype.exit=function(){if(this._oTemplate){this._oTemplate.destroy();}this._oTemplate=null;this._oTable=null;if(this._oToolbar&&!this._bTableExists){this._oToolbar.destroy();}this._oToolbar=null;this._oTitle=null;this._oNumberFormatInstance=null;t.forEach(function(B){var E=g(B),H="_o"+E;this[H]=null;},this);this._oTableReady=null;this._fReject=null;this._fResolve=null;C.prototype.exit.apply(this,arguments);};return q;});
