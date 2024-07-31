/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/library","sap/ui/base/Object","sap/ui/integration/cards/NumericHeader","sap/ui/integration/cards/Header","sap/base/strings/formatMessage","sap/ui/integration/controls/ActionsToolbar","sap/ui/integration/util/BindingHelper","./CardActions"],function(l,B,N,H,f,A,a,C){"use strict";var b=l.AreaType;function c(F,h){if(F.parts&&F.translationKey&&F.parts.length===2){var o={parts:[F.translationKey,F.parts[0].toString(),F.parts[1].toString()],formatter:function(t,p,P){var s=p||F.parts[0];var e=P||F.parts[1];if(Array.isArray(p)){s=p.length;}if(Array.isArray(P)){e=P.length;}var i=parseFloat(s)||0;var g=parseFloat(e)||0;return f(t,[i,g]);}};h.bindProperty("statusText",o);}}var d=B.extend("sap.ui.integration.util.HeaderFactory",{metadata:{library:"sap.ui.integration"},constructor:function(o){B.call(this);this._oCard=o;}});d.prototype.create=function(m){var h,o=this._oCard,e,g=this._createActionsToolbar();if(!m&&!g){return null;}if(!m){m={};}e=new C({card:o,areaType:b.Header});switch(m.type){case"Numeric":h=new N(m,g,o._sAppId);break;default:h=new H(m,g,o._sAppId,o._oIconFormatter);break;}if(m.status&&m.status.text&&m.status.text.format){if(m.status.text.format.translationKey){o._loadDefaultTranslations();}c(m.status.text.format,h);}h.setServiceManager(o._oServiceManager);h.setDataProviderFactory(o._oDataProviderFactory);h._setDataConfiguration(m.data);e.attach(m,h);h._oActions=e;return h;};d.prototype._createActionsToolbar=function(){var o=this._oCard,h=o.getHostInstance(),e=o.getAggregation("_extension"),g,i;if(!h&&!e){return null;}g=new A();i=g.initializeContent(h,o,e);if(i){return g;}return null;};return d;});
