/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./_Batch","./_GroupLock","./_Helper","./_V2Requestor","sap/base/Log","sap/ui/base/SyncPromise","sap/ui/thirdparty/jquery"],function(_,a,b,c,L,S,q){"use strict";var B={"Accept":"multipart/mixed"},C="sap.ui.model.odata.v4.lib._Requestor",d,r=/(\$\w+)=~/g,e=/^\d+$/;function g(h){var s;h=h.toLowerCase();for(s in this.headers){if(s.toLowerCase()===h){return this.headers[s];}}}function R(s,h,Q,m){this.mBatchQueue={};this.mHeaders=h||{};this.aLockedGroupLocks=[];this.oModelInterface=m;this.sQueryParams=b.buildQuery(Q);this.mRunningChangeRequests={};this.oSecurityTokenPromise=null;this.iSessionTimer=0;this.iSerialNumber=0;this.sServiceUrl=s;}R.prototype.mFinalHeaders={"Content-Type":"application/json;charset=UTF-8;IEEE754Compatible=true"};R.prototype.mPredefinedPartHeaders={"Accept":"application/json;odata.metadata=minimal;IEEE754Compatible=true"};R.prototype.mPredefinedRequestHeaders={"Accept":"application/json;odata.metadata=minimal;IEEE754Compatible=true","OData-MaxVersion":"4.0","OData-Version":"4.0","X-CSRF-Token":"Fetch"};R.prototype.mReservedHeaders={accept:true,"accept-charset":true,"content-encoding":true,"content-id":true,"content-language":true,"content-length":true,"content-transfer-encoding":true,"content-type":true,"if-match":true,"if-none-match":true,isolation:true,"odata-isolation":true,"odata-maxversion":true,"odata-version":true,prefer:true,"sap-contextid":true};R.prototype.addChangeSet=function(G){var f=[],h=this.getOrCreateBatchQueue(G);f.iSerialNumber=this.getSerialNumber();h.iChangeSet+=1;h.splice(h.iChangeSet,0,f);};R.prototype.addChangeToGroup=function(o,G){var f;if(this.getGroupSubmitMode(G)==="Direct"){o.$resolve(this.request(o.method,o.url,this.lockGroup(G,this,true,true),o.headers,o.body,o.$submit,o.$cancel));}else{f=this.getOrCreateBatchQueue(G);f[f.iChangeSet].push(o);}};R.prototype.addQueryString=function(s,m,Q){var f;Q=this.convertQueryOptions(m,Q,false,true);s=s.replace(r,function(u,o){var v=Q[o];delete Q[o];return o+"="+v;});f=b.buildQuery(Q);if(!f){return s;}return s+(s.includes("?")?"&"+f.slice(1):f);};R.prototype.batchRequestSent=function(G,h){var p,f;if(h){if(this.mRunningChangeRequests[G]){throw new Error("Unexpected second $batch");}p=new S(function(i){f=i;});p.$resolve=f;this.mRunningChangeRequests[G]=p;}};R.prototype.batchResponseReceived=function(G,h){if(h){this.mRunningChangeRequests[G].$resolve();delete this.mRunningChangeRequests[G];}};R.prototype.buildQueryString=function(m,Q,D,s){return b.buildQuery(this.convertQueryOptions(m,Q,D,s));};R.prototype.cancelChanges=function(G){if(this.mRunningChangeRequests[G]){throw new Error("Cannot cancel the changes for group '"+G+"', the batch request is running");}this.cancelChangesByFilter(function(){return true;},G);this.cancelGroupLocks(G);};R.prototype.cancelChangesByFilter=function(f,G){var h=false,t=this;function k(s){var l=t.mBatchQueue[s],o,m,E,i,j;for(j=l.length-1;j>=0;j-=1){if(Array.isArray(l[j])){m=l[j];for(i=m.length-1;i>=0;i-=1){o=m[i];if(o.$cancel&&f(o)){o.$cancel();E=new Error("Request canceled: "+o.method+" "+o.url+"; group: "+s);E.canceled=true;o.$reject(E);m.splice(i,1);h=true;}}}}}if(G){if(this.mBatchQueue[G]){k(G);}}else{for(G in this.mBatchQueue){k(G);}}return h;};R.prototype.cancelGroupLocks=function(G){this.aLockedGroupLocks.forEach(function(o){if((!G||G===o.getGroupId())&&o.isModifying()&&o.isLocked()){o.cancel();}});};R.prototype.checkForOpenRequests=function(){var t=this;if(Object.keys(this.mRunningChangeRequests).length||Object.keys(this.mBatchQueue).some(function(G){return t.mBatchQueue[G].some(function(v){return Array.isArray(v)?v.length:true;});})||this.aLockedGroupLocks.some(function(G){return G.isLocked();})){throw new Error("Unexpected open requests");}};R.prototype.checkHeaderNames=function(h){var k;for(k in h){if(this.mReservedHeaders[k.toLowerCase()]){throw new Error("Unsupported header: "+k);}}};R.prototype.cleanUpChangeSets=function(f){var h,H=false,i;function j(o){if(!m(o)){h.push(o);}}function m(o){if(o.method!=="PATCH"){return false;}return h.some(function(k){if(k.method==="PATCH"&&k.headers["If-Match"]===o.headers["If-Match"]){b.merge(k.body,o.body);o.$resolve(k.$promise);return true;}});}for(i=f.iChangeSet;i>=0;i-=1){h=[];f[i].forEach(j);if(h.length===0){f.splice(i,1);}else if(h.length===1&&this.isChangeSetOptional()){f[i]=h[0];}else{f[i]=h;}H=H||h.length>0;}return H;};R.prototype.clearSessionContext=function(t){if(t){this.oModelInterface.fireSessionTimeout();}delete this.mHeaders["SAP-ContextId"];if(this.iSessionTimer){clearInterval(this.iSessionTimer);this.iSessionTimer=0;}};R.prototype.convertExpand=function(E,s){var k,f=[],t=this;if(!E||typeof E!=="object"){throw new Error("$expand must be a valid object");}k=Object.keys(E);if(s){k=k.sort();}k.forEach(function(h){var v=E[h];if(v&&typeof v==="object"){f.push(t.convertExpandOptions(h,v,s));}else{f.push(h);}});return f.join(",");};R.prototype.convertExpandOptions=function(E,v,s){var f=[];this.doConvertSystemQueryOptions(undefined,v,function(o,O){f.push(o+'='+O);},undefined,s);return f.length?E+"("+f.join(";")+")":E;};R.prototype.convertQueryOptions=function(m,Q,D,s){var f={};if(!Q){return undefined;}this.doConvertSystemQueryOptions(m,Q,function(k,v){f[k]=v;},D,s);return f;};R.prototype.convertResourcePath=function(s){return s;};R.prototype.destroy=function(){this.clearSessionContext();};R.prototype.doCheckVersionHeader=function(G,s,v){var o=G("OData-Version"),D=!o&&G("DataServiceVersion");if(D){throw new Error("Expected 'OData-Version' header with value '4.0' but received"+" 'DataServiceVersion' header with value '"+D+"' in response for "+this.sServiceUrl+s);}if(o==="4.0"||!o&&v){return;}throw new Error("Expected 'OData-Version' header with value '4.0' but received value '"+o+"' in response for "+this.sServiceUrl+s);};R.prototype.doConvertResponse=function(o,m){return o;};R.prototype.doConvertSystemQueryOptions=function(m,Q,f,D,s){var t=this;Object.keys(Q).forEach(function(k){var v=Q[k];if(D&&k[0]==='$'){return;}switch(k){case"$expand":if(v!=="~"){v=t.convertExpand(v,s);}break;case"$select":if(Array.isArray(v)){v=s?v.sort().join(","):v.join(",");}break;default:}f(k,v);});};R.prototype.fetchTypeForPath=function(m,A){return this.oModelInterface.fetchMetadata(m+(A?"/$Type":"/"));};R.prototype.formatPropertyAsLiteral=function(v,p){return b.formatLiteral(v,p.$Type);};R.prototype.getGroupSubmitMode=function(G){return this.oModelInterface.getGroupProperty(G,"submit");};R.prototype.getModelInterface=function(){return this.oModelInterface;};R.prototype.getOrCreateBatchQueue=function(G){var f,h=this.mBatchQueue[G];if(!h){f=[];f.iSerialNumber=0;h=this.mBatchQueue[G]=[f];h.iChangeSet=0;if(this.oModelInterface.onCreateGroup){this.oModelInterface.onCreateGroup(G);}}return h;};R.prototype.getPathAndAddQueryOptions=function(p,o,P){var A=[],n,N={},f,t=this;p=p.slice(1,-5);if(o.$Parameter){o.$Parameter.forEach(function(f){N[f.$Name]=f;});}if(o.$kind==="Function"){for(n in P){f=N[n];if(f){if(f.$isCollection){throw new Error("Unsupported collection-valued parameter: "+n);}A.push(encodeURIComponent(n)+"="+encodeURIComponent(t.formatPropertyAsLiteral(P[n],f)));}}p+="("+A.join(",")+")";}else{for(n in P){if(!(n in N)){delete P[n];}}}return p;};R.prototype.getSerialNumber=function(){this.iSerialNumber+=1;return this.iSerialNumber;};R.prototype.getServiceUrl=function(){return this.sServiceUrl;};R.prototype.hasChanges=function(G,E){var f=this.mBatchQueue[G];if(f){return f.some(function(v){return Array.isArray(v)&&v.some(function(o){return o.headers["If-Match"]===E;});});}return false;};R.prototype.hasPendingChanges=function(G){var t=this;function f(m){if(!G){return Object.keys(m);}return G in m?[G]:[];}return f(this.mRunningChangeRequests).length>0||this.aLockedGroupLocks.some(function(o){return(G===undefined||o.getGroupId()===G)&&o.isModifying()&&o.isLocked();})||f(this.mBatchQueue).some(function(s){return t.mBatchQueue[s].some(function(v){return Array.isArray(v)&&v.some(function(o){return o.$cancel;});});});};R.prototype.isActionBodyOptional=function(){return false;};R.prototype.isChangeSetOptional=function(){return true;};R.prototype.mergeGetRequests=function(f){var h=[],t=this;function m(o){return o.$queryOptions&&h.some(function(i){if(i.$queryOptions&&o.url===i.url){b.aggregateQueryOptions(i.$queryOptions,o.$queryOptions);o.$resolve(i.$promise);return true;}return false;});}f.forEach(function(o){if(!m(o)){h.push(o);}});h.forEach(function(o){if(o.$queryOptions){o.url=t.addQueryString(o.url,o.$metaPath,o.$queryOptions);}});h.iChangeSet=f.iChangeSet;return h;};R.prototype.processBatch=function(G){var h,f=this.mBatchQueue[G]||[],t=this;function o(j){if(Array.isArray(j)){j.forEach(o);}else if(j.$submit){j.$submit();}}function i(E,j){if(Array.isArray(j)){j.forEach(i.bind(null,E));}else{j.$reject(E);}}function v(f,j){var k;f.forEach(function(l,m){var E,s,n,p=j[m];if(Array.isArray(p)){v(l,p);}else if(!p){E=new Error("HTTP request was not processed because the previous request failed");E.cause=k;E.$reported=true;l.$reject(E);}else if(p.status>=400){p.getResponseHeader=g;k=b.createError(p,"Communication error",l.url,l.$resourcePath);i(k,l);}else{if(p.responseText){try{t.doCheckVersionHeader(g.bind(p),l.url,true);n=t.doConvertResponse(JSON.parse(p.responseText),l.$metaPath);}catch(u){l.$reject(u);return;}}else{n=l.method==="GET"?null:{};}t.reportUnboundMessagesAsJSON(l.url,g.call(p,"sap-messages"));s=g.call(p,"ETag");if(s){n["@odata.etag"]=s;}l.$resolve(n);}});}delete this.mBatchQueue[G];o(f);h=this.cleanUpChangeSets(f);if(f.length===0){return Promise.resolve();}this.batchRequestSent(G,h);f=this.mergeGetRequests(f);return this.sendBatch(d.cleanBatch(f)).then(function(j){v(f,j);}).catch(function(E){var j=new Error("HTTP request was not processed because $batch failed");j.cause=E;i(j,f);throw E;}).finally(function(){t.batchResponseReceived(G,h);});};R.prototype.ready=function(){return S.resolve();};R.prototype.lockGroup=function(G,o,l,m,f){var h;h=new a(G,o,l,m,this.getSerialNumber(),f);if(l){this.aLockedGroupLocks.push(h);}return h;};R.prototype.refreshSecurityToken=function(o){var t=this;if(!this.oSecurityTokenPromise){if(o!==this.mHeaders["X-CSRF-Token"]){return Promise.resolve();}this.oSecurityTokenPromise=new Promise(function(f,h){q.ajax(t.sServiceUrl+t.sQueryParams,{method:"HEAD",headers:Object.assign({},t.mHeaders,{"X-CSRF-Token":"Fetch"})}).then(function(D,T,j){var s=j.getResponseHeader("X-CSRF-Token");if(s){t.mHeaders["X-CSRF-Token"]=s;}else{delete t.mHeaders["X-CSRF-Token"];}t.oSecurityTokenPromise=null;f();},function(j){t.oSecurityTokenPromise=null;h(b.createError(j,"Could not refresh security token"));});});}return this.oSecurityTokenPromise;};R.prototype.relocate=function(s,o,n){var f=this.mBatchQueue[s],t=this,F=f&&f[0].some(function(h,i){if(h.body===o){t.addChangeToGroup(h,n);f[0].splice(i,1);return true;}});if(!F){throw new Error("Request not found in group '"+s+"'");}};R.prototype.relocateAll=function(s,n,E){var j=0,f=this.mBatchQueue[s],t=this;if(f){f[0].slice().forEach(function(o){if(!E||o.headers["If-Match"]===E){t.addChangeToGroup(o,n);f[0].splice(j,1);}else{j+=1;}});}};R.prototype.removePatch=function(p){var f=this.cancelChangesByFilter(function(o){return o.$promise===p;});if(!f){throw new Error("Cannot reset the changes, the batch request is running");}};R.prototype.removePost=function(G,E){var o=b.getPrivateAnnotation(E,"postBody"),f=this.cancelChangesByFilter(function(h){return h.body===o;},G);if(!f){throw new Error("Cannot reset the changes, the batch request is running");}};R.prototype.reportUnboundMessagesAsJSON=function(s,m){this.oModelInterface.reportUnboundMessages(s,JSON.parse(m||null));};R.prototype.request=function(m,s,G,h,p,f,i,M,o,A,Q){var j,E,k=G&&G.getGroupId()||"$direct",P,l=Infinity,n,t=this;if(k==="$cached"){E=new Error("Unexpected request: "+m+" "+s);E.$cached=true;throw E;}if(G&&G.isCanceled()){if(i){i();}E=new Error("Request already canceled");E.canceled=true;return Promise.reject(E);}if(G){G.unlock();l=G.getSerialNumber();}s=this.convertResourcePath(s);o=o||s;if(this.getGroupSubmitMode(k)!=="Direct"){P=new Promise(function(u,v){var w=t.getOrCreateBatchQueue(k);n={method:m,url:s,headers:Object.assign({},t.mPredefinedPartHeaders,t.mHeaders,h,t.mFinalHeaders),body:p,$cancel:i,$metaPath:M,$queryOptions:Q,$reject:v,$resolve:u,$resourcePath:o,$submit:f};if(m==="GET"){w.push(n);}else if(A){w[0].unshift(n);}else{j=w.iChangeSet;while(w[j].iSerialNumber>l){j-=1;}w[j].push(n);}});n.$promise=P;return P;}if(Q){s=t.addQueryString(s,M,Q);}if(f){f();}return this.sendRequest(m,s,Object.assign({},h,this.mFinalHeaders),JSON.stringify(d.cleanPayload(p)),o).then(function(u){t.reportUnboundMessagesAsJSON(u.resourcePath,u.messages);return t.doConvertResponse(u.body,M);});};R.prototype.sendBatch=function(f){var o=_.serializeBatchRequest(f);return this.sendRequest("POST","$batch"+this.sQueryParams,Object.assign(o.headers,B),o.body).then(function(h){if(h.messages!==null){throw new Error("Unexpected 'sap-messages' response header for batch request");}return _.deserializeBatchResponse(h.contentType,h.body);});};R.prototype.sendRequest=function(m,s,h,p,o){var f=this.sServiceUrl+s,t=this;return new Promise(function(i,j){function k(I){var O=t.mHeaders["X-CSRF-Token"];return q.ajax(f,{contentType:h&&h["Content-Type"],data:p,headers:Object.assign({},t.mPredefinedRequestHeaders,t.mHeaders,b.resolveIfMatchHeader(h)),method:m}).then(function(v,T,l){var E=l.getResponseHeader("ETag"),n=l.getResponseHeader("X-CSRF-Token");try{t.doCheckVersionHeader(l.getResponseHeader,s,!v);}catch(u){j(u);return;}if(n){t.mHeaders["X-CSRF-Token"]=n;}t.setSessionContext(l.getResponseHeader("SAP-ContextId"),l.getResponseHeader("SAP-Http-Session-Timeout"));if(!v){v=m==="GET"?null:{};}if(E){v["@odata.etag"]=E;}i({body:v,contentType:l.getResponseHeader("Content-Type"),messages:l.getResponseHeader("sap-messages"),resourcePath:s});},function(l){var n=l.getResponseHeader("SAP-ContextId"),u=l.getResponseHeader("X-CSRF-Token"),M;if(!I&&l.status===403&&u&&u.toLowerCase()==="required"){t.refreshSecurityToken(O).then(function(){k(true);},j);}else{M="Communication error";if(n){t.setSessionContext(n,l.getResponseHeader("SAP-Http-Session-Timeout"));}else if(t.mHeaders["SAP-ContextId"]){M="Session not found on server";L.error(M,undefined,C);t.clearSessionContext(true);}j(b.createError(l,M,f,o));}});}if(t.oSecurityTokenPromise&&m!=="GET"){return t.oSecurityTokenPromise.then(k);}return k();});};R.prototype.setSessionContext=function(s,f){var t=e.test(f)?parseInt(f):0,i=Date.now()+30*60*1000,h=this;this.clearSessionContext();if(s){h.mHeaders["SAP-ContextId"]=s;if(t>=60){this.iSessionTimer=setInterval(function(){if(Date.now()>=i){h.clearSessionContext(true);}else{q.ajax(h.sServiceUrl+h.sQueryParams,{method:"HEAD",headers:{"SAP-ContextId":h.mHeaders["SAP-ContextId"]}}).fail(function(j){if(j.getResponseHeader("SAP-Err-Id")==="ICMENOSESSION"){L.error("Session not found on server",undefined,C);h.clearSessionContext(true);}});}},(t-5)*1000);}else if(f!==null){L.warning("Unsupported SAP-Http-Session-Timeout header",f,C);}}};R.prototype.submitBatch=function(G){var f,p,t=this;p=S.all(this.aLockedGroupLocks.map(function(o){return o.waitFor(G);}));f=p.isPending();if(f){L.info("submitBatch('"+G+"') is waiting for locks",null,C);}return p.then(function(){if(f){L.info("submitBatch('"+G+"') continues",null,C);}t.aLockedGroupLocks=t.aLockedGroupLocks.filter(function(o){return o.isLocked();});return t.processBatch(G);});};R.prototype.waitForRunningChangeRequests=function(G){return this.mRunningChangeRequests[G]||S.resolve();};d={cleanBatch:function(f){f.forEach(function(o){if(Array.isArray(o)){d.cleanBatch(o);}else{o.body=d.cleanPayload(o.body);}});return f;},cleanPayload:function(p){var o=p;if(o){Object.keys(o).forEach(function(k){if(k.startsWith("@$ui5.")){if(o===p){o=Object.assign({},p);}delete o[k];}});}return o;},create:function(s,m,h,Q,o){var f=new R(s,h,Q,m);if(o==="2.0"){c(f);}return f;}};return d;},false);
