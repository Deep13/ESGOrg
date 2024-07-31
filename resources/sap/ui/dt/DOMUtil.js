/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","sap/ui/Device","sap/ui/dom/jquery/zIndex","sap/ui/dom/jquery/scrollLeftRTL"],function(q,D){"use strict";var a={};a.getSize=function(d){var c=d.getBoundingClientRect();return{width:c.width,height:c.height};};a.getOffsetFromParent=function(g,p){var P=p?q(p):null;var s=P?P.scrollTop():null;var S=p?a.getScrollLeft(p):null;var m=P?P.offset():null;var o={left:g.position.left,top:g.position.top};if(m){o.left-=(m.left-(S||0));o.top-=(m.top-(s||0));}if(sap.ui.getCore().getConfiguration().getRTL()){var i=P?P.outerWidth():q(window).outerWidth();if(D.browser.safari&&!D.browser.mobile&&a.hasVerticalScrollBar(P)){o.left-=a.getScrollbarWidth();}o.left=o.left-(i-g.size.width);}return o;};a.getScrollLeft=function(e){if(!sap.ui.getCore().getConfiguration().getRTL()||!a.hasHorizontalScrollBar(e)){return q(e).scrollLeft();}var s=q(e).scrollLeftRTL();var m=e.scrollWidth-e.clientWidth;return s-m;};a.getZIndex=function(d){var z;var e=q(d);if(e.length){z=e.zIndex()||e.css("z-index");}return z;};a._getElementDimensions=function(d,m,b){var r=d[0]||d;var o=r["offset"+m];var v=0;for(var i=0;i<2;i++){var B=window.getComputedStyle(r,null)["border"+b[i]+m];v-=B?parseInt(B.slice(0,-2)):0;}return o+v;};a._getElementWidth=function(d){return a._getElementDimensions(d,"Width",["Right","Left"]);};a._getElementHeight=function(d){return a._getElementDimensions(d,"Height",["Top","Bottom"]);};a.hasVerticalScrollBar=function(d){var $=q(d);var o=$.css("overflow-y")==="auto"||$.css("overflow-y")==="scroll";return o&&$.get(0).scrollHeight>a._getElementHeight(d);};a.hasHorizontalScrollBar=function(d){var $=q(d);var o=$.css("overflow-x")==="auto"||$.css("overflow-x")==="scroll";return o&&$.get(0).scrollWidth>a._getElementWidth(d);};a.hasScrollBar=function(d){return a.hasVerticalScrollBar(d)||a.hasHorizontalScrollBar(d);};a.getScrollbarWidth=function(){if(typeof a.getScrollbarWidth._cache==='undefined'){var o=q('<div></div>').css({position:'absolute',top:'-9999px',left:'-9999px',width:'100px'}).appendTo('body');var w=o.width();o.css('overflow','scroll');var i=q('<div></div>').css('width','100%').appendTo(o);var W=i.width();o.remove();a.getScrollbarWidth._cache=w-W;}return a.getScrollbarWidth._cache;};a.getOverflows=function(d){var $=q(d);return{overflowX:$.css("overflow-x"),overflowY:$.css("overflow-y")};};a.getGeometry=function(d,u){if(d){var o=q(d).offset();if(u){o.left=o.left-q(window).scrollLeft();o.top=o.top-q(window).scrollTop();}return{domRef:d,size:this.getSize(d),position:o,visible:this.isVisible(d)};}};a.syncScroll=function(s,t){var $=q(t);var T=$.scrollTop();var o=$.scrollLeft();var b=q(s);var S=b.scrollTop();var c=b.scrollLeft();if(S!==T){$.scrollTop(S);}if(c!==o){$.scrollLeft(c);}};a.getDomRefForCSSSelector=function(d,c){if(c&&d){var $=q(d);if(c===":sap-domref"){return $;}if(c.indexOf(":sap-domref")>-1){return $.find(c.replace(/:sap-domref/g,""));}return $.find(c);}return q();};a.isVisible=function(d){return d?d.offsetWidth>0&&d.offsetHeight>0:false;};a.setDraggable=function(n,v){n.setAttribute("draggable",v);};a.getDraggable=function(n){switch(n.getAttribute("draggable")){case"true":return true;case"false":return false;default:return;}};a._copyStylesTo=function(s,d){var S="";var b="";var l=s.length;for(var i=0;i<l;i++){b=s[i];S=S+b+":"+s.getPropertyValue(b)+";";}d.style.cssText=S;};a._copyPseudoElement=function(p,s,d){var S=window.getComputedStyle(s,p);var c=S.getPropertyValue("content");if(c&&c!=="none"){c=String(c).trim();if(c.indexOf("attr(")===0){c=c.replace("attr(","");if(c.length){c=c.substring(0,c.length-1);}c=s.getAttribute(c)||"";}var P=q("<span></span>");if(p===":after"){P.appendTo(d);}else{P.prependTo(d);}P.text(c.replace(/(^['"])|(['"]$)/g,""));a._copyStylesTo(S,P.get(0));P.css("display","inline");}};a.copyComputedStyle=function(s,d){s=q(s).get(0);d=q(d).get(0);var S=window.getComputedStyle(s);if(S.getPropertyValue("display")==="none"){d.style.display="none";return;}a._copyStylesTo(S,d);this._copyPseudoElement(":after",s,d);this._copyPseudoElement(":before",s,d);};a.copyComputedStyles=function(s,d){s=q(s).get(0);d=q(d).get(0);for(var i=0;i<s.children.length;i++){this.copyComputedStyles(s.children[i],d.children[i]);}q(d).removeClass();q(d).attr("id","");q(d).attr("role","");q(d).attr("data-sap-ui","");q(d).attr("for","");q(d).attr("tabindex",-1);this.copyComputedStyle(s,d);};a.cloneDOMAndStyles=function(n,t){n=q(n).get(0);var c=n.cloneNode(true);this.copyComputedStyles(n,c);q(t).append(c);};a.insertStyles=function(s,t){var S=document.createElement('style');S.type='text/css';S.appendChild(document.createTextNode(s));t.appendChild(S);};a.contains=function(i,t){var n=document.getElementById(i);return!!n&&n.contains(t);};a.appendChild=function(t,c){var s=c.scrollTop;var S=q(c).scrollLeft();t.appendChild(c);c.scrollTop=s;q(c).scrollLeft(S);};a.focusWithoutScrolling=function(t){if(D.browser.name!=="ie"){t.focus({preventScroll:true});return;}var s=[];var p=t.parentNode;while(p){s.push([p,q(p).scrollLeft(),p.scrollTop]);p=p.parentNode;}t.focus();s.forEach(function(i){var e=i[0];if(q(e).scrollLeft()!==i[1]){q(e).scrollLeft(i[1]);}if(e.scrollTop!==i[2]){e.scrollTop=i[2];}});};return a;},true);
