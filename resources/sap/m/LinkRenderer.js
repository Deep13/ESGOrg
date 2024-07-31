/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['sap/ui/core/Renderer','sap/ui/core/library',"sap/ui/util/defaultLinkTypes"],function(R,c,d){"use strict";var T=c.TextDirection;var L={apiVersion:2};L.render=function(r,C){var t=C.getTextDirection(),s=R.getTextAlign(C.getTextAlign(),t),S=C._determineSelfReferencePresence(),h=C.getHref(),a=d(C.getRel(),h,C.getTarget()),A={labelledby:S?{value:C.getId(),append:true}:undefined},i=h&&C._isHrefValid(h),e=C.getEnabled(),b="";r.openStart("a",C);r.class("sapMLnk");if(C.getSubtle()){r.class("sapMLnkSubtle");b+=C._sAriaLinkSubtleId;}if(C.getEmphasized()){r.class("sapMLnkEmphasized");b+=" "+C._sAriaLinkEmphasizedId;}A.describedby=b?{value:b.trim(),append:true}:undefined;if(!e){r.class("sapMLnkDsbl");r.attr("aria-disabled","true");}r.attr("tabindex",C._getTabindex());if(C.getWrapping()){r.class("sapMLnkWrapping");}if(C.getTooltip_AsString()){r.attr("title",C.getTooltip_AsString());}if(i&&e){r.attr("href",h);}else if(C.getText()){r.attr("href","");}if(C.getTarget()){r.attr("target",C.getTarget());}if(a){r.attr("rel",a);}if(C.getWidth()){r.style("width",C.getWidth());}else{r.class("sapMLnkMaxWidth");}if(s){r.style("text-align",s);}if(t!==T.Inherit){r.attr("dir",t.toLowerCase());}C.getDragDropConfig().forEach(function(D){if(!D.getEnabled()){r.attr("draggable",false);}});r.accessibilityState(C,A);r.openEnd();if(this.writeText){this.writeText(r,C);}else{this.renderText(r,C);}r.close("a");};L.renderText=function(r,C){r.text(C.getText());};return L;},true);
