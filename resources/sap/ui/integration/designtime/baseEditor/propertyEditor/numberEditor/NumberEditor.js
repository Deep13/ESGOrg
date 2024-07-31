/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/designtime/baseEditor/propertyEditor/BasePropertyEditor","sap/ui/integration/designtime/baseEditor/util/isValidBindingString","sap/base/util/restricted/_isNil","sap/ui/core/format/NumberFormat"],function(B,i,_,N){"use strict";var a=B.extend("sap.ui.integration.designtime.baseEditor.propertyEditor.numberEditor.NumberEditor",{xmlFragment:"sap.ui.integration.designtime.baseEditor.propertyEditor.numberEditor.NumberEditor",metadata:{library:"sap.ui.integration"},invalidInputError:"BASE_EDITOR.NUMBER.INVALID_BINDING_OR_NUMBER",renderer:B.getMetadata().getRenderer().render});a.prototype.getDefaultValidators=function(){return Object.assign({},B.prototype.getDefaultValidators.call(this),{isNumber:{type:"isNumber"}});};a.configMetadata=Object.assign({},B.configMetadata);a.prototype.formatValue=function(v){if(_(v)||i(v,false)){return v;}var n=parseFloat(v);if(!this.validateNumber(n)){return v;}return this.getFormatterInstance().format(n);};a.prototype._onLiveChange=function(e){var n=this._parseLocalized(e.getParameter("newValue"));B.prototype.setValue.call(this,n);};a.prototype.validateNumber=function(v){return!isNaN(v);};a.prototype.getFormatterInstance=function(){return N.getFloatInstance();};a.prototype._parseLocalized=function(v){if(!v||i(v,false)){return v;}var n=this.getFormatterInstance().parse(v);return n;};return a;});
