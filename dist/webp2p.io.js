/*! datachannel.js build:1.1.1, development. Copyright(c) 2013 Jesús Leganés Combarro "Piranna" <piranna@gmail.com> */
(function(exports){
/* JSJaC - The JavaScript Jabber Client Library
 * Copyright (C) 2004-2008 Stefan Strigler
 *
 * JSJaC is licensed under the terms of the Mozilla Public License
 * version 1.1 or, at your option, under the terms of the GNU General
 * Public License version 2 or subsequent, or the terms of the GNU Lesser
 * General Public License version 2.1 or subsequent. 
 *
 * Please visit http://zeank.in-berlin.de/jsjac/ for details about JSJaC.
 */
JSJAC_HAVEKEYS = true;          // whether to use keys
JSJAC_NKEYS    = 16;            // number of keys to generate
JSJAC_INACTIVITY = 300;         // qnd hack to make suspend/resume
                                    // work more smoothly with polling
JSJAC_ERR_COUNT = 10;           // number of retries in case of connection
                                    // errors

JSJAC_ALLOW_PLAIN = true;       // whether to allow plaintext logins

JSJAC_CHECKQUEUEINTERVAL = 100;   // msecs to poll send queue
JSJAC_CHECKINQUEUEINTERVAL = 100; // msecs to poll incoming queue
JSJAC_TIMERVAL = 2000;          // default polling interval
JSJAC_RETRYDELAY = 5000;        // msecs to wait before trying next request after error

// Options specific to HTTP Binding (BOSH)
JSJACHBC_MAX_HOLD = 1;          // default for number of connctions held by
                                    // connection manager
JSJACHBC_MAX_WAIT = 300;        // default 'wait' param - how long an idle connection
                                    // should be held by connection manager

JSJACHBC_BOSH_VERSION  = "1.6";
JSJACHBC_USE_BOSH_VER  = true;

JSJACHBC_MAXPAUSE = 120;        // how long a suspend/resume cycle may take

/*** END CONFIG ***/

String.prototype.htmlEnc=function(){if(!this)
return this;var str=this.replace(/&/g,"&amp;");str=str.replace(/</g,"&lt;");str=str.replace(/>/g,"&gt;");str=str.replace(/\"/g,"&quot;");str=str.replace(/\n/g,"<br />");return str;};String.prototype.revertHtmlEnc=function(){if(!this)
return this;var str=this.replace(/&amp;/gi,'&');str=str.replace(/&lt;/gi,'<');str=str.replace(/&gt;/gi,'>');str=str.replace(/&quot;/gi,'\"');str=str.replace(/<br( )?(\/)?>/gi,'\n');return str;};Date.jab2date=function(ts){var date=new Date(Date.UTC(ts.substr(0,4),ts.substr(5,2)-1,ts.substr(8,2),ts.substr(11,2),ts.substr(14,2),ts.substr(17,2)));if(ts.substr(ts.length-6,1)!='Z'){var offset=new Date();offset.setTime(0);offset.setUTCHours(ts.substr(ts.length-5,2));offset.setUTCMinutes(ts.substr(ts.length-2,2));if(ts.substr(ts.length-6,1)=='+')
date.setTime(date.getTime()-offset.getTime());else if(ts.substr(ts.length-6,1)=='-')
date.setTime(date.getTime()+offset.getTime());}
return date;};Date.hrTime=function(ts){return Date.jab2date(ts).toLocaleString();};Date.prototype.jabberDate=function(){var padZero=function(i){if(i<10)return"0"+i;return i;};var jDate=this.getUTCFullYear()+"-";jDate+=padZero(this.getUTCMonth()+1)+"-";jDate+=padZero(this.getUTCDate())+"T";jDate+=padZero(this.getUTCHours())+":";jDate+=padZero(this.getUTCMinutes())+":";jDate+=padZero(this.getUTCSeconds())+"Z";return jDate;};Number.max=function(A,B){return(A>B)?A:B;};Number.min=function(A,B){return(A<B)?A:B;};if(window.XDomainRequest){window.ieXDRToXHR=function(window){"use strict";var XHR=window.XMLHttpRequest;window.XMLHttpRequest=function(){this.onreadystatechange=Object;this.xhr=null;this.xdr=null;this.readyState=0;this.status='';this.statusText=null;this.responseText=null;this.getResponseHeader=null;this.getAllResponseHeaders=null;this.setRequestHeader=null;this.abort=null;this.send=null;this.isxdr=false;var self=this;self.xdrLoadedBinded=function(){self.xdrLoaded();};self.xdrErrorBinded=function(){self.xdrError();};self.xdrProgressBinded=function(){self.xdrProgress();};self.xhrReadyStateChangedBinded=function(){self.xhrReadyStateChanged();};};XMLHttpRequest.prototype.open=function(method,url,asynch,user,pwd){var parser=document.createElement('a');parser.href=url;if(parser.hostname!=document.domain){if(this.xdr===null){this.xdr=new window.XDomainRequest();}
this.isxdr=true;this.setXDRActive();this.xdr.open(method,url);}else{if(this.xhr===null){this.xhr=new XHR();}
this.isxdr=false;this.setXHRActive();this.xhr.open(method,url,asynch,user,pwd);}};XMLHttpRequest.prototype.xdrGetResponseHeader=function(name){if(name==='Content-Type'&&this.xdr.contentType>''){return this.xdr.contentType;}
return'';};XMLHttpRequest.prototype.xdrGetAllResponseHeaders=function(){return(this.xdr.contentType>'')?'Content-Type: '+this.xdr.contentType:'';};XMLHttpRequest.prototype.xdrSetRequestHeader=function(name,value){};XMLHttpRequest.prototype.xdrLoaded=function(){if(this.onreadystatechange!==null){this.readyState=4;this.status=200;this.statusText='OK';this.responseText=this.xdr.responseText;if(window.ActiveXObject){var doc=new ActiveXObject('Microsoft.XMLDOM');doc.async='false';doc.loadXML(this.responseText);this.responseXML=doc;}
this.onreadystatechange();}};XMLHttpRequest.prototype.xdrError=function(){if(this.onreadystatechange!==null){this.readyState=4;this.status=0;this.statusText='';this.responseText='';this.onreadystatechange();}};XMLHttpRequest.prototype.xdrProgress=function(){if(this.onreadystatechange!==null&&this.status!==3){this.readyState=3;this.status=3;this.statusText='';this.onreadystatechange();}};XMLHttpRequest.prototype.finalXDRRequest=function(){var xdr=this.xdr;delete xdr.onload;delete xdr.onerror;delete xdr.onprogress;};XMLHttpRequest.prototype.sendXDR=function(data){var xdr=this.xdr;xdr.onload=this.xdrLoadedBinded;xdr.onerror=this.xdr.ontimeout=this.xdrErrorBinded;xdr.onprogress=this.xdrProgressBinded;this.responseText=null;this.xdr.send(data);};XMLHttpRequest.prototype.abortXDR=function(){this.finalXDRRequest();this.xdr.abort();};XMLHttpRequest.prototype.setXDRActive=function(){this.send=this.sendXDR;this.abort=this.abortXDR;this.getResponseHeader=this.xdrGetResponseHeader;this.getAllResponseHeaders=this.xdrGetAllResponseHeaders;this.setRequestHeader=this.xdrSetRequestHeader;};XMLHttpRequest.prototype.xhrGetResponseHeader=function(name){return this.xhr.getResponseHeader(name);};XMLHttpRequest.prototype.xhrGetAllResponseHeaders=function(){return this.xhr.getAllResponseHeaders();};XMLHttpRequest.prototype.xhrSetRequestHeader=function(name,value){return this.xhr.setRequestHeader(name,value);};XMLHttpRequest.prototype.xhrReadyStateChanged=function(){if(this.onreadystatechange!==null&&this.readyState!==this.xhr.readyState){var xhr=this.xhr;this.readyState=xhr.readyState;if(this.readyState===4){this.status=xhr.status;this.statusText=xhr.statusText;this.responseText=xhr.responseText;this.responseXML=xhr.responseXML;}
this.onreadystatechange();}};XMLHttpRequest.prototype.finalXHRRequest=function(){delete this.xhr.onreadystatechange;};XMLHttpRequest.prototype.abortXHR=function(){this.finalXHRRequest();this.xhr.abort();};XMLHttpRequest.prototype.sendXHR=function(data){this.xhr.onreadystatechange=this.xhrReadyStateChangedBinded;this.xhr.send(data);};XMLHttpRequest.prototype.setXHRActive=function(){this.send=this.sendXHR;this.abort=this.abortXHR;this.getResponseHeader=this.xhrGetResponseHeader;this.getAllResponseHeaders=this.xhrGetAllResponseHeaders;this.setRequestHeader=this.xhrSetRequestHeader;};window.ieXDRToXHR=undefined;};window.ieXDRToXHR(window);}
var hexcase=0;var b64pad="=";var chrsz=8;function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length*chrsz));}
function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length*chrsz));}
function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length*chrsz));}
function hex_hmac_sha1(key,data){return binb2hex(core_hmac_sha1(key,data));}
function b64_hmac_sha1(key,data){return binb2b64(core_hmac_sha1(key,data));}
function str_hmac_sha1(key,data){return binb2str(core_hmac_sha1(key,data));}
function sha1_vm_test()
{return hex_sha1("abc")=="a9993e364706816aba3e25717850c26c9cd0d89d";}
function core_sha1(x,len)
{x[len>>5]|=0x80<<(24-len%32);x[((len+64>>9)<<4)+15]=len;var w=Array(80);var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;var e=-1009589776;for(var i=0;i<x.length;i+=16)
{var olda=a;var oldb=b;var oldc=c;var oldd=d;var olde=e;for(var j=0;j<80;j++)
{if(j<16)w[j]=x[i+j];else w[j]=rol(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);var t=safe_add(safe_add(rol(a,5),sha1_ft(j,b,c,d)),safe_add(safe_add(e,w[j]),sha1_kt(j)));e=d;d=c;c=rol(b,30);b=a;a=t;}
a=safe_add(a,olda);b=safe_add(b,oldb);c=safe_add(c,oldc);d=safe_add(d,oldd);e=safe_add(e,olde);}
return Array(a,b,c,d,e);}
function sha1_ft(t,b,c,d)
{if(t<20)return(b&c)|((~b)&d);if(t<40)return b^c^d;if(t<60)return(b&c)|(b&d)|(c&d);return b^c^d;}
function sha1_kt(t)
{return(t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514;}
function core_hmac_sha1(key,data)
{var bkey=str2binb(key);if(bkey.length>16)bkey=core_sha1(bkey,key.length*chrsz);var ipad=Array(16),opad=Array(16);for(var i=0;i<16;i++)
{ipad[i]=bkey[i]^0x36363636;opad[i]=bkey[i]^0x5C5C5C5C;}
var hash=core_sha1(ipad.concat(str2binb(data)),512+data.length*chrsz);return core_sha1(opad.concat(hash),512+160);}
function rol(num,cnt)
{return(num<<cnt)|(num>>>(32-cnt));}
function str2binb(str)
{var bin=Array();var mask=(1<<chrsz)-1;for(var i=0;i<str.length*chrsz;i+=chrsz)
bin[i>>5]|=(str.charCodeAt(i/chrsz)&mask)<<(32-chrsz-i%32);return bin;}
function binb2str(bin)
{var str="";var mask=(1<<chrsz)-1;for(var i=0;i<bin.length*32;i+=chrsz)
str+=String.fromCharCode((bin[i>>5]>>>(32-chrsz-i%32))&mask);return str;}
function binb2hex(binarray)
{var hex_tab=hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++)
{str+=hex_tab.charAt((binarray[i>>2]>>((3-i%4)*8+4))&0xF)+
hex_tab.charAt((binarray[i>>2]>>((3-i%4)*8))&0xF);}
return str;}
function binb2b64(binarray)
{var tab="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var str="";for(var i=0;i<binarray.length*4;i+=3)
{var triplet=(((binarray[i>>2]>>8*(3-i%4))&0xFF)<<16)|(((binarray[i+1>>2]>>8*(3-(i+1)%4))&0xFF)<<8)|((binarray[i+2>>2]>>8*(3-(i+2)%4))&0xFF);for(var j=0;j<4;j++)
{if(i*8+j*6>binarray.length*32)str+=b64pad;else str+=tab.charAt((triplet>>6*(3-j))&0x3F);}}
return str.replace(/AAA\=(\=*?)$/,'$1');}
function hex_md5(s){return binl2hex(core_md5(str2binl(s),s.length*chrsz));}
function b64_md5(s){return binl2b64(core_md5(str2binl(s),s.length*chrsz));}
function str_md5(s){return binl2str(core_md5(str2binl(s),s.length*chrsz));}
function hex_hmac_md5(key,data){return binl2hex(core_hmac_md5(key,data));}
function b64_hmac_md5(key,data){return binl2b64(core_hmac_md5(key,data));}
function str_hmac_md5(key,data){return binl2str(core_hmac_md5(key,data));}
function md5_vm_test()
{return hex_md5("abc")=="900150983cd24fb0d6963f7d28e17f72";}
function core_md5(x,len)
{x[len>>5]|=0x80<<((len)%32);x[(((len+64)>>>9)<<4)+14]=len;var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;for(var i=0;i<x.length;i+=16)
{var olda=a;var oldb=b;var oldc=c;var oldd=d;a=md5_ff(a,b,c,d,x[i+0],7,-680876936);d=md5_ff(d,a,b,c,x[i+1],12,-389564586);c=md5_ff(c,d,a,b,x[i+2],17,606105819);b=md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=md5_ff(a,b,c,d,x[i+4],7,-176418897);d=md5_ff(d,a,b,c,x[i+5],12,1200080426);c=md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=md5_ff(b,c,d,a,x[i+7],22,-45705983);a=md5_ff(a,b,c,d,x[i+8],7,1770035416);d=md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=md5_ff(c,d,a,b,x[i+10],17,-42063);b=md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=md5_ff(a,b,c,d,x[i+12],7,1804603682);d=md5_ff(d,a,b,c,x[i+13],12,-40341101);c=md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=md5_ff(b,c,d,a,x[i+15],22,1236535329);a=md5_gg(a,b,c,d,x[i+1],5,-165796510);d=md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=md5_gg(c,d,a,b,x[i+11],14,643717713);b=md5_gg(b,c,d,a,x[i+0],20,-373897302);a=md5_gg(a,b,c,d,x[i+5],5,-701558691);d=md5_gg(d,a,b,c,x[i+10],9,38016083);c=md5_gg(c,d,a,b,x[i+15],14,-660478335);b=md5_gg(b,c,d,a,x[i+4],20,-405537848);a=md5_gg(a,b,c,d,x[i+9],5,568446438);d=md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=md5_gg(c,d,a,b,x[i+3],14,-187363961);b=md5_gg(b,c,d,a,x[i+8],20,1163531501);a=md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=md5_gg(d,a,b,c,x[i+2],9,-51403784);c=md5_gg(c,d,a,b,x[i+7],14,1735328473);b=md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=md5_hh(a,b,c,d,x[i+5],4,-378558);d=md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=md5_hh(c,d,a,b,x[i+11],16,1839030562);b=md5_hh(b,c,d,a,x[i+14],23,-35309556);a=md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=md5_hh(d,a,b,c,x[i+4],11,1272893353);c=md5_hh(c,d,a,b,x[i+7],16,-155497632);b=md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=md5_hh(a,b,c,d,x[i+13],4,681279174);d=md5_hh(d,a,b,c,x[i+0],11,-358537222);c=md5_hh(c,d,a,b,x[i+3],16,-722521979);b=md5_hh(b,c,d,a,x[i+6],23,76029189);a=md5_hh(a,b,c,d,x[i+9],4,-640364487);d=md5_hh(d,a,b,c,x[i+12],11,-421815835);c=md5_hh(c,d,a,b,x[i+15],16,530742520);b=md5_hh(b,c,d,a,x[i+2],23,-995338651);a=md5_ii(a,b,c,d,x[i+0],6,-198630844);d=md5_ii(d,a,b,c,x[i+7],10,1126891415);c=md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=md5_ii(b,c,d,a,x[i+5],21,-57434055);a=md5_ii(a,b,c,d,x[i+12],6,1700485571);d=md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=md5_ii(c,d,a,b,x[i+10],15,-1051523);b=md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=md5_ii(a,b,c,d,x[i+8],6,1873313359);d=md5_ii(d,a,b,c,x[i+15],10,-30611744);c=md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=md5_ii(b,c,d,a,x[i+13],21,1309151649);a=md5_ii(a,b,c,d,x[i+4],6,-145523070);d=md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=md5_ii(c,d,a,b,x[i+2],15,718787259);b=md5_ii(b,c,d,a,x[i+9],21,-343485551);a=safe_add(a,olda);b=safe_add(b,oldb);c=safe_add(c,oldc);d=safe_add(d,oldd);}
return Array(a,b,c,d);}
function md5_cmn(q,a,b,x,s,t)
{return safe_add(bit_rol(safe_add(safe_add(a,q),safe_add(x,t)),s),b);}
function md5_ff(a,b,c,d,x,s,t)
{return md5_cmn((b&c)|((~b)&d),a,b,x,s,t);}
function md5_gg(a,b,c,d,x,s,t)
{return md5_cmn((b&d)|(c&(~d)),a,b,x,s,t);}
function md5_hh(a,b,c,d,x,s,t)
{return md5_cmn(b^c^d,a,b,x,s,t);}
function md5_ii(a,b,c,d,x,s,t)
{return md5_cmn(c^(b|(~d)),a,b,x,s,t);}
function core_hmac_md5(key,data)
{var bkey=str2binl(key);if(bkey.length>16)bkey=core_md5(bkey,key.length*chrsz);var ipad=Array(16),opad=Array(16);for(var i=0;i<16;i++)
{ipad[i]=bkey[i]^0x36363636;opad[i]=bkey[i]^0x5C5C5C5C;}
var hash=core_md5(ipad.concat(str2binl(data)),512+data.length*chrsz);return core_md5(opad.concat(hash),512+128);}
function safe_add(x,y)
{var lsw=(x&0xFFFF)+(y&0xFFFF);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xFFFF);}
function bit_rol(num,cnt)
{return(num<<cnt)|(num>>>(32-cnt));}
function str2binl(str)
{var bin=Array();var mask=(1<<chrsz)-1;for(var i=0;i<str.length*chrsz;i+=chrsz)
bin[i>>5]|=(str.charCodeAt(i/chrsz)&mask)<<(i%32);return bin;}
function binl2str(bin)
{var str="";var mask=(1<<chrsz)-1;for(var i=0;i<bin.length*32;i+=chrsz)
str+=String.fromCharCode((bin[i>>5]>>>(i%32))&mask);return str;}
function binl2hex(binarray)
{var hex_tab=hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++)
{str+=hex_tab.charAt((binarray[i>>2]>>((i%4)*8+4))&0xF)+
hex_tab.charAt((binarray[i>>2]>>((i%4)*8))&0xF);}
return str;}
function binl2b64(binarray)
{var tab="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var str="";for(var i=0;i<binarray.length*4;i+=3)
{var triplet=(((binarray[i>>2]>>8*(i%4))&0xFF)<<16)|(((binarray[i+1>>2]>>8*((i+1)%4))&0xFF)<<8)|((binarray[i+2>>2]>>8*((i+2)%4))&0xFF);for(var j=0;j<4;j++)
{if(i*8+j*6>binarray.length*32)str+=b64pad;else str+=tab.charAt((triplet>>6*(3-j))&0x3F);}}
return str;}
function utf8t2d(t)
{t=t.replace(/\r\n/g,"\n");var d=new Array;var test=String.fromCharCode(237);if(test.charCodeAt(0)<0)
for(var n=0;n<t.length;n++)
{var c=t.charCodeAt(n);if(c>0)
d[d.length]=c;else{d[d.length]=(((256+c)>>6)|192);d[d.length]=(((256+c)&63)|128);}}
else
for(var n=0;n<t.length;n++)
{var c=t.charCodeAt(n);if(c<128)
d[d.length]=c;else if((c>127)&&(c<2048)){d[d.length]=((c>>6)|192);d[d.length]=((c&63)|128);}
else{d[d.length]=((c>>12)|224);d[d.length]=(((c>>6)&63)|128);d[d.length]=((c&63)|128);}}
return d;}
function utf8d2t(d)
{var r=new Array;var i=0;while(i<d.length)
{if(d[i]<128){r[r.length]=String.fromCharCode(d[i]);i++;}
else if((d[i]>191)&&(d[i]<224)){r[r.length]=String.fromCharCode(((d[i]&31)<<6)|(d[i+1]&63));i+=2;}
else{r[r.length]=String.fromCharCode(((d[i]&15)<<12)|((d[i+1]&63)<<6)|(d[i+2]&63));i+=3;}}
return r.join("");}
function b64arrays(){var b64s='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';b64=new Array();f64=new Array();for(var i=0;i<b64s.length;i++){b64[i]=b64s.charAt(i);f64[b64s.charAt(i)]=i;}}
function b64d2t(d){var r=new Array;var i=0;var dl=d.length;if((dl%3)==1){d[d.length]=0;d[d.length]=0;}
if((dl%3)==2)
d[d.length]=0;while(i<d.length)
{r[r.length]=b64[d[i]>>2];r[r.length]=b64[((d[i]&3)<<4)|(d[i+1]>>4)];r[r.length]=b64[((d[i+1]&15)<<2)|(d[i+2]>>6)];r[r.length]=b64[d[i+2]&63];i+=3;}
if((dl%3)==1)
r[r.length-1]=r[r.length-2]="=";if((dl%3)==2)
r[r.length-1]="=";var t=r.join("");return t;}
function b64t2d(t){var d=new Array;var i=0;t=t.replace(/\n|\r/g,"");t=t.replace(/=/g,"");while(i<t.length)
{d[d.length]=(f64[t.charAt(i)]<<2)|(f64[t.charAt(i+1)]>>4);d[d.length]=(((f64[t.charAt(i+1)]&15)<<4)|(f64[t.charAt(i+2)]>>2));d[d.length]=(((f64[t.charAt(i+2)]&3)<<6)|(f64[t.charAt(i+3)]));i+=4;}
if(t.length%4==2)
d=d.slice(0,d.length-2);if(t.length%4==3)
d=d.slice(0,d.length-1);return d;}
if(typeof(atob)=='undefined'||typeof(btoa)=='undefined')
b64arrays();if(typeof(atob)=='undefined'){b64decode=function(s){return utf8d2t(b64t2d(s));}}else{b64decode=function(s){return decodeURIComponent(escape(atob(s)));}}
if(typeof(btoa)=='undefined'){b64encode=function(s){return b64d2t(utf8t2d(s));}}else{b64encode=function(s){return btoa(unescape(encodeURIComponent(s)));}}
function cnonce(size){var tab="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";var cnonce='';for(var i=0;i<size;i++){cnonce+=tab.charAt(Math.round(Math.random(new Date().getTime())*(tab.length-1)));}
return cnonce;}
function JSJaCJSON(){}
JSJaCJSON.toString=function(obj){var m={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},s={array:function(x){var a=['['],b,f,i,l=x.length,v;for(i=0;i<l;i+=1){v=x[i];f=s[typeof v];if(f){try{v=f(v);if(typeof v=='string'){if(b){a[a.length]=',';}
a[a.length]=v;b=true;}}catch(e){}}}
a[a.length]=']';return a.join('');},'boolean':function(x){return String(x);},'null':function(x){return"null";},number:function(x){return isFinite(x)?String(x):'null';},object:function(x){if(x){if(x instanceof Array){return s.array(x);}
var a=['{'],b,f,i,v;for(i in x){if(x.hasOwnProperty(i)){v=x[i];f=s[typeof v];if(f){try{v=f(v);if(typeof v=='string'){if(b){a[a.length]=',';}
a.push(s.string(i),':',v);b=true;}}catch(e){}}}}
a[a.length]='}';return a.join('');}
return'null';},string:function(x){if(/["\\\x00-\x1f]/.test(x)){x=x.replace(/([\x00-\x1f\\"])/g,function(a,b){var c=m[b];if(c){return c;}
c=b.charCodeAt();return'\\u00'+
Math.floor(c/16).toString(16)+
(c%16).toString(16);});}
return'"'+x+'"';}};switch(typeof(obj)){case'object':return s.object(obj);case'array':return s.array(obj);}};JSJaCJSON.parse=function(str){try{return!(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(str.replace(/"(\\.|[^"\\])*"/g,'')))&&eval('('+str+')');}catch(e){return false;}};function XmlHttp(){}
XmlHttp.create=function(){try{if(window.XMLHttpRequest){var req=new XMLHttpRequest();if(req.readyState===null){req.readyState=1;req.addEventListener("load",function(){req.readyState=4;if(typeof req.onreadystatechange=="function")
req.onreadystatechange();},false);}
return req;}
if(window.ActiveXObject){return new ActiveXObject(XmlHttp.getPrefix()+".XmlHttp");}}
catch(ex){}
throw new Error("Your browser does not support XmlHttp objects");};XmlHttp.getPrefix=function(){if(XmlHttp.prefix)
return XmlHttp.prefix;var prefixes=["MSXML2","Microsoft","MSXML","MSXML3"];var o;for(var i=0;i<prefixes.length;i++){try{o=new ActiveXObject(prefixes[i]+".XmlHttp");return XmlHttp.prefix=prefixes[i];}
catch(ex){}}
throw new Error("Could not find an installed XML parser");};function XmlDocument(){}
XmlDocument.create=function(name,ns){name=name||'foo';ns=ns||'';try{var doc;if(document.implementation&&document.implementation.createDocument){doc=document.implementation.createDocument(ns,name,null);if(doc.readyState===null){doc.readyState=1;doc.addEventListener("load",function(){doc.readyState=4;if(typeof doc.onreadystatechange=="function")
doc.onreadystatechange();},false);}}else if(window.ActiveXObject){doc=new ActiveXObject(XmlDocument.getPrefix()+".DomDocument");}
if(!doc.documentElement||doc.documentElement.tagName!=name||(doc.documentElement.namespaceURI&&doc.documentElement.namespaceURI!=ns)){try{if(ns!=='')
doc.appendChild(doc.createElement(name)).setAttribute('xmlns',ns);else
doc.appendChild(doc.createElement(name));}catch(dex){doc=document.implementation.createDocument(ns,name,null);if(doc.documentElement===null)
doc.appendChild(doc.createElement(name));if(ns!==''&&doc.documentElement.getAttribute('xmlns')!=ns){doc.documentElement.setAttribute('xmlns',ns);}}}
return doc;}
catch(ex){}
throw new Error("Your browser does not support XmlDocument objects");};XmlDocument.getPrefix=function(){if(XmlDocument.prefix)
return XmlDocument.prefix;var prefixes=["MSXML2","Microsoft","MSXML","MSXML3"];var o;for(var i=0;i<prefixes.length;i++){try{o=new ActiveXObject(prefixes[i]+".DomDocument");return XmlDocument.prefix=prefixes[i];}
catch(ex){}}
throw new Error("Could not find an installed XML parser");};if(typeof(Document)!='undefined'&&window.DOMParser){Document.prototype.loadXML=function(s){var doc2=(new DOMParser()).parseFromString(s,"text/xml");while(this.hasChildNodes())
this.removeChild(this.lastChild);for(var i=0;i<doc2.childNodes.length;i++){this.appendChild(this.importNode(doc2.childNodes[i],true));}};}
if(window.XMLSerializer&&window.Node&&Node.prototype&&Node.prototype.__defineGetter__){XMLDocument.prototype.__defineGetter__("xml",function(){return(new XMLSerializer()).serializeToString(this);});Document.prototype.__defineGetter__("xml",function(){return(new XMLSerializer()).serializeToString(this);});Node.prototype.__defineGetter__("xml",function(){return(new XMLSerializer()).serializeToString(this);});}
var JSJaCBuilder={buildNode:function(doc,elementName){var element,ns=arguments[4];if(arguments[2])
if(JSJaCBuilder._isStringOrNumber(arguments[2])||(arguments[2]instanceof Array)){element=this._createElement(doc,elementName,ns);JSJaCBuilder._children(doc,element,arguments[2]);}else{ns=arguments[2]['xmlns']||ns;element=this._createElement(doc,elementName,ns);for(var attr in arguments[2]){if(arguments[2].hasOwnProperty(attr)&&attr!='xmlns')
element.setAttribute(attr,arguments[2][attr]);}}
else
element=this._createElement(doc,elementName,ns);if(arguments[3])
JSJaCBuilder._children(doc,element,arguments[3],ns);return element;},_createElement:function(doc,elementName,ns){try{if(ns)
return doc.createElementNS(ns,elementName);}catch(ex){}
var el=doc.createElement(elementName);if(ns)
el.setAttribute("xmlns",ns);return el;},_text:function(doc,text){return doc.createTextNode(text);},_children:function(doc,element,children,ns){if(typeof children=='object'){for(var i in children){if(children.hasOwnProperty(i)){var e=children[i];if(typeof e=='object'){if(e instanceof Array){var node=JSJaCBuilder.buildNode(doc,e[0],e[1],e[2],ns);element.appendChild(node);}else{element.appendChild(e);}}else{if(JSJaCBuilder._isStringOrNumber(e)){element.appendChild(JSJaCBuilder._text(doc,e));}}}}}else{if(JSJaCBuilder._isStringOrNumber(children)){element.appendChild(JSJaCBuilder._text(doc,children));}}},_attributes:function(attributes){var attrs=[];for(var attribute in attributes)
if(attributes.hasOwnProperty(attribute))
attrs.push(attribute+'="'+attributes[attribute].toString().htmlEnc()+'"');return attrs.join(" ");},_isStringOrNumber:function(param){return(typeof param=='string'||typeof param=='number');}};var NS_DISCO_ITEMS="http://jabber.org/protocol/disco#items";var NS_DISCO_INFO="http://jabber.org/protocol/disco#info";var NS_VCARD="vcard-temp";var NS_AUTH="jabber:iq:auth";var NS_AUTH_ERROR="jabber:iq:auth:error";var NS_REGISTER="jabber:iq:register";var NS_SEARCH="jabber:iq:search";var NS_ROSTER="jabber:iq:roster";var NS_PRIVACY="jabber:iq:privacy";var NS_PRIVATE="jabber:iq:private";var NS_VERSION="jabber:iq:version";var NS_TIME="jabber:iq:time";var NS_TIME_NEW="urn:xmpp:time";var NS_LAST="jabber:iq:last";var NS_XDATA="jabber:x:data";var NS_IQDATA="jabber:iq:data";var NS_DELAY="jabber:x:delay";var NS_DELAY_NEW="urn:xmpp:delay";var NS_EXPIRE="jabber:x:expire";var NS_EVENT="jabber:x:event";var NS_XCONFERENCE="jabber:x:conference";var NS_PING="urn:xmpp:ping";var NS_CHAT_STATES="http://jabber.org/protocol/chatstates";var NS_STATS="http://jabber.org/protocol/stats";var NS_MUC="http://jabber.org/protocol/muc";var NS_MUC_USER="http://jabber.org/protocol/muc#user";var NS_MUC_ADMIN="http://jabber.org/protocol/muc#admin";var NS_MUC_OWNER="http://jabber.org/protocol/muc#owner";var NS_PUBSUB="http://jabber.org/protocol/pubsub";var NS_PUBSUB_EVENT="http://jabber.org/protocol/pubsub#event";var NS_PUBSUB_OWNER="http://jabber.org/protocol/pubsub#owner";var NS_PUBSUB_NMI="http://jabber.org/protocol/pubsub#node-meta-info";var NS_COMMANDS="http://jabber.org/protocol/commands";var NS_STREAM="http://etherx.jabber.org/streams";var NS_CLIENT="jabber:client";var NS_BOSH="http://jabber.org/protocol/httpbind";var NS_XBOSH="urn:xmpp:xbosh";var NS_STANZAS="urn:ietf:params:xml:ns:xmpp-stanzas";var NS_STREAMS="urn:ietf:params:xml:ns:xmpp-streams";var NS_TLS="urn:ietf:params:xml:ns:xmpp-tls";var NS_SASL="urn:ietf:params:xml:ns:xmpp-sasl";var NS_SESSION="urn:ietf:params:xml:ns:xmpp-session";var NS_BIND="urn:ietf:params:xml:ns:xmpp-bind";var NS_FEATURE_IQAUTH="http://jabber.org/features/iq-auth";var NS_FEATURE_IQREGISTER="http://jabber.org/features/iq-register";var NS_FEATURE_COMPRESS="http://jabber.org/features/compress";var NS_COMPRESS="http://jabber.org/protocol/compress";function STANZA_ERROR(code,type,cond){if(window==this)
return new STANZA_ERROR(code,type,cond);this.code=code;this.type=type;this.cond=cond;}
var ERR_BAD_REQUEST=STANZA_ERROR("400","modify","bad-request");var ERR_CONFLICT=STANZA_ERROR("409","cancel","conflict");var ERR_FEATURE_NOT_IMPLEMENTED=STANZA_ERROR("501","cancel","feature-not-implemented");var ERR_FORBIDDEN=STANZA_ERROR("403","auth","forbidden");var ERR_GONE=STANZA_ERROR("302","modify","gone");var ERR_INTERNAL_SERVER_ERROR=STANZA_ERROR("500","wait","internal-server-error");var ERR_ITEM_NOT_FOUND=STANZA_ERROR("404","cancel","item-not-found");var ERR_JID_MALFORMED=STANZA_ERROR("400","modify","jid-malformed");var ERR_NOT_ACCEPTABLE=STANZA_ERROR("406","modify","not-acceptable");var ERR_NOT_ALLOWED=STANZA_ERROR("405","cancel","not-allowed");var ERR_NOT_AUTHORIZED=STANZA_ERROR("401","auth","not-authorized");var ERR_PAYMENT_REQUIRED=STANZA_ERROR("402","auth","payment-required");var ERR_RECIPIENT_UNAVAILABLE=STANZA_ERROR("404","wait","recipient-unavailable");var ERR_REDIRECT=STANZA_ERROR("302","modify","redirect");var ERR_REGISTRATION_REQUIRED=STANZA_ERROR("407","auth","registration-required");var ERR_REMOTE_SERVER_NOT_FOUND=STANZA_ERROR("404","cancel","remote-server-not-found");var ERR_REMOTE_SERVER_TIMEOUT=STANZA_ERROR("504","wait","remote-server-timeout");var ERR_RESOURCE_CONSTRAINT=STANZA_ERROR("500","wait","resource-constraint");var ERR_SERVICE_UNAVAILABLE=STANZA_ERROR("503","cancel","service-unavailable");var ERR_SUBSCRIPTION_REQUIRED=STANZA_ERROR("407","auth","subscription-required");var ERR_UNEXPECTED_REQUEST=STANZA_ERROR("400","wait","unexpected-request");function JSJaCConsoleLogger(level){this.level=level||4;this.start=function(){};this.log=function(msg,level){level=level||0;if(level>this.level)
return;if(typeof(console)=='undefined')
return;try{switch(level){case 0:console.warn(msg);break;case 1:console.error(msg);break;case 2:console.info(msg);break;case 4:console.debug(msg);break;default:console.log(msg);break;}}catch(e){try{console.log(msg);}catch(e){}}};this.setLevel=function(level){this.level=level;return this;};this.getLevel=function(){return this.level;};}
function JSJaCCookie(name,value,secs,domain,path)
{if(window==this)
return new JSJaCCookie(name,value,secs,domain,path);this.name=name;this.value=value;this.secs=secs;this.domain=domain;this.path=path;this.write=function(){var expires;if(this.secs){var date=new Date();date.setTime(date.getTime()+(this.secs*1000));expires="; expires="+date.toGMTString();}else
expires="";var domain=this.domain?"; domain="+this.domain:"";var path=this.path?"; path="+this.path:"; path=/";document.cookie=this.getName()+"="+JSJaCCookie._escape(this.getValue())+
expires+
domain+
path;};this.erase=function(){var c=new JSJaCCookie(this.getName(),"",-1);c.write();};this.getName=function(){return this.name;};this.setName=function(name){this.name=name;return this;};this.getValue=function(){return this.value;};this.setValue=function(value){this.value=value;return this;};this.setDomain=function(domain){this.domain=domain;return this;};this.setPath=function(path){this.path=path;return this;};}
JSJaCCookie.read=function(name){var nameEQ=name+"=";var ca=document.cookie.split(';');for(var i=0;i<ca.length;i++){var c=ca[i];while(c.charAt(0)==' ')c=c.substring(1,c.length);if(c.indexOf(nameEQ)==0)
return new JSJaCCookie(name,JSJaCCookie._unescape(c.substring(nameEQ.length,c.length)));}
throw new JSJaCCookieException("Cookie not found");};JSJaCCookie.get=function(name){return JSJaCCookie.read(name).getValue();};JSJaCCookie.remove=function(name){JSJaCCookie.read(name).erase();};JSJaCCookie._escape=function(str){return str.replace(/;/g,"%3AB");}
JSJaCCookie._unescape=function(str){return str.replace(/%3AB/g,";");}
function JSJaCCookieException(msg){this.message=msg;this.name="CookieException";}
function JSJaCError(code,type,condition){var xmldoc=XmlDocument.create("error","jsjac");xmldoc.documentElement.setAttribute('code',code);xmldoc.documentElement.setAttribute('type',type);if(condition)
xmldoc.documentElement.appendChild(xmldoc.createElement(condition)).setAttribute('xmlns',NS_STANZAS);return xmldoc.documentElement;}
var JSJACJID_FORBIDDEN=['"',' ','&','\'','/',':','<','>','@'];function JSJaCJID(jid){this._node='';this._domain='';this._resource='';if(typeof(jid)=='string'){if(jid.indexOf('@')!=-1){this.setNode(jid.substring(0,jid.indexOf('@')));jid=jid.substring(jid.indexOf('@')+1);}
if(jid.indexOf('/')!=-1){this.setResource(jid.substring(jid.indexOf('/')+1));jid=jid.substring(0,jid.indexOf('/'));}
this.setDomain(jid);}else{this.setNode(jid.node);this.setDomain(jid.domain);this.setResource(jid.resource);}}
JSJaCJID.prototype.getBareJID=function(){return this.getNode()+'@'+this.getDomain();};JSJaCJID.prototype.getNode=function(){return this._node;};JSJaCJID.prototype.getDomain=function(){return this._domain;};JSJaCJID.prototype.getResource=function(){return this._resource;};JSJaCJID.prototype.setNode=function(node){JSJaCJID._checkNodeName(node);this._node=node||'';return this;};JSJaCJID.prototype.setDomain=function(domain){if(!domain||domain==='')
throw new JSJaCJIDInvalidException("domain name missing");JSJaCJID._checkNodeName(domain);this._domain=domain;return this;};JSJaCJID.prototype.setResource=function(resource){this._resource=resource||'';return this;};JSJaCJID.prototype.toString=function(){var jid='';if(this.getNode()&&this.getNode()!=='')
jid=this.getNode()+'@';jid+=this.getDomain();if(this.getResource()&&this.getResource()!=="")
jid+='/'+this.getResource();return jid;};JSJaCJID.prototype.removeResource=function(){return this.setResource();};JSJaCJID.prototype.clone=function(){return new JSJaCJID(this.toString());};JSJaCJID.prototype.isEntity=function(jid){if(typeof jid=='string')
jid=(new JSJaCJID(jid));else
jid=jid.clone();jid.removeResource();return(this.clone().removeResource().toString()===jid.toString());};JSJaCJID._checkNodeName=function(nodeprep){if(!nodeprep||nodeprep==='')
return;for(var i=0;i<JSJACJID_FORBIDDEN.length;i++){if(nodeprep.indexOf(JSJACJID_FORBIDDEN[i])!=-1){throw new JSJaCJIDInvalidException("forbidden char in nodename: "+JSJACJID_FORBIDDEN[i]);}}};function JSJaCJIDInvalidException(message){this.message=message;this.name="JSJaCJIDInvalidException";}
function JSJaCKeys(func,oDbg){var seed=Math.random();this._k=new Array();this._k[0]=seed.toString();if(oDbg)
this.oDbg=oDbg;else{this.oDbg={};this.oDbg.log=function(){};}
if(func){for(var i=1;i<JSJAC_NKEYS;i++){this._k[i]=func(this._k[i-1]);oDbg.log(i+": "+this._k[i],4);}}
this._indexAt=JSJAC_NKEYS-1;this.getKey=function(){return this._k[this._indexAt--];};this.lastKey=function(){return(this._indexAt==0);};this.size=function(){return this._k.length;};this._getSuspendVars=function(){return('_k,_indexAt').split(',');};}
var JSJACPACKET_USE_XMLNS=true;function JSJaCPacket(name){this.name=name;if(typeof(JSJACPACKET_USE_XMLNS)!='undefined'&&JSJACPACKET_USE_XMLNS)
this.doc=XmlDocument.create(name,NS_CLIENT);else
this.doc=XmlDocument.create(name,'');}
JSJaCPacket.prototype.pType=function(){return this.name;};JSJaCPacket.prototype.getDoc=function(){return this.doc;};JSJaCPacket.prototype.getNode=function(){if(this.getDoc()&&this.getDoc().documentElement)
return this.getDoc().documentElement;else
return null;};JSJaCPacket.prototype.setTo=function(to){if(!to||to=='')
this.getNode().removeAttribute('to');else if(typeof(to)=='string')
this.getNode().setAttribute('to',to);else
this.getNode().setAttribute('to',to.toString());return this;};JSJaCPacket.prototype.setFrom=function(from){if(!from||from=='')
this.getNode().removeAttribute('from');else if(typeof(from)=='string')
this.getNode().setAttribute('from',from);else
this.getNode().setAttribute('from',from.toString());return this;};JSJaCPacket.prototype.setID=function(id){if(!id||id=='')
this.getNode().removeAttribute('id');else
this.getNode().setAttribute('id',id);return this;};JSJaCPacket.prototype.setType=function(type){if(!type||type=='')
this.getNode().removeAttribute('type');else
this.getNode().setAttribute('type',type);return this;};JSJaCPacket.prototype.setXMLLang=function(xmllang){if(!xmllang||xmllang=='')
this.getNode().removeAttribute('xml:lang');else
this.getNode().setAttribute('xml:lang',xmllang);return this;};JSJaCPacket.prototype.getTo=function(){return this.getNode().getAttribute('to');};JSJaCPacket.prototype.getFrom=function(){return this.getNode().getAttribute('from');};JSJaCPacket.prototype.getToJID=function(){return new JSJaCJID(this.getTo());};JSJaCPacket.prototype.getFromJID=function(){return new JSJaCJID(this.getFrom());};JSJaCPacket.prototype.getID=function(){return this.getNode().getAttribute('id');};JSJaCPacket.prototype.getType=function(){return this.getNode().getAttribute('type');};JSJaCPacket.prototype.getXMLLang=function(){return this.getNode().getAttribute('xml:lang');};JSJaCPacket.prototype.getXMLNS=function(){return this.getNode().namespaceURI||this.getNode().getAttribute('xmlns');};JSJaCPacket.prototype.getChild=function(name,ns){if(!this.getNode()){return null;}
name=name||'*';ns=ns||'*';if(this.getNode().getElementsByTagNameNS){return this.getNode().getElementsByTagNameNS(ns,name).item(0);}
var nodes=this.getNode().getElementsByTagName(name);if(ns!='*'){for(var i=0;i<nodes.length;i++){if(nodes.item(i).namespaceURI==ns||nodes.item(i).getAttribute('xmlns')==ns){return nodes.item(i);}}}else{return nodes.item(0);}
return null;};JSJaCPacket.prototype.getChildVal=function(name,ns){var node=this.getChild(name,ns);var ret='';if(node&&node.hasChildNodes()){for(var i=0;i<node.childNodes.length;i++)
if(node.childNodes.item(i).nodeValue)
ret+=node.childNodes.item(i).nodeValue;}
return ret;};JSJaCPacket.prototype.clone=function(){return JSJaCPacket.wrapNode(this.getNode());};JSJaCPacket.prototype.isError=function(){return(this.getType()=='error');};JSJaCPacket.prototype.errorReply=function(stanza_error){var rPacket=this.clone();rPacket.setTo(this.getFrom());rPacket.setFrom();rPacket.setType('error');rPacket.appendNode('error',{code:stanza_error.code,type:stanza_error.type},[[stanza_error.cond,{xmlns:NS_STANZAS}]]);return rPacket;};JSJaCPacket.prototype.xml=typeof XMLSerializer!='undefined'?function(){var r=(new XMLSerializer()).serializeToString(this.getNode());if(typeof(r)=='undefined')
r=(new XMLSerializer()).serializeToString(this.doc);return r;}:function(){return this.getDoc().xml;};JSJaCPacket.prototype._getAttribute=function(attr){return this.getNode().getAttribute(attr);};if(document.ELEMENT_NODE==null){document.ELEMENT_NODE=1;document.ATTRIBUTE_NODE=2;document.TEXT_NODE=3;document.CDATA_SECTION_NODE=4;document.ENTITY_REFERENCE_NODE=5;document.ENTITY_NODE=6;document.PROCESSING_INSTRUCTION_NODE=7;document.COMMENT_NODE=8;document.DOCUMENT_NODE=9;document.DOCUMENT_TYPE_NODE=10;document.DOCUMENT_FRAGMENT_NODE=11;document.NOTATION_NODE=12;}
JSJaCPacket.prototype._importNode=function(node,allChildren){switch(node.nodeType){case document.ELEMENT_NODE:var newNode;if(this.getDoc().createElementNS){newNode=this.getDoc().createElementNS(node.namespaceURI,node.nodeName);}else{newNode=this.getDoc().createElement(node.nodeName);}
var i,il;if(node.attributes&&node.attributes.length>0)
for(i=0,il=node.attributes.length;i<il;i++){var attr=node.attributes.item(i);if(attr.nodeName=='xmlns'&&(newNode.getAttribute('xmlns')!==null||newNode.namespaceURI)){continue;}
if(newNode.setAttributeNS&&attr.namespaceURI){newNode.setAttributeNS(attr.namespaceURI,attr.name,attr.value);}else{newNode.setAttribute(attr.name,attr.value);}}
if(allChildren&&node.childNodes&&node.childNodes.length>0){for(i=0,il=node.childNodes.length;i<il;i++){newNode.appendChild(this._importNode(node.childNodes.item(i),allChildren));}}
return newNode;case document.TEXT_NODE:case document.CDATA_SECTION_NODE:case document.COMMENT_NODE:return this.getDoc().createTextNode(node.nodeValue);}};JSJaCPacket.prototype._setChildNode=function(nodeName,nodeValue){var aNode=this.getChild(nodeName);var tNode=this.getDoc().createTextNode(nodeValue);if(aNode)
try{aNode.replaceChild(tNode,aNode.firstChild);}catch(e){}
else{try{aNode=this.getDoc().createElementNS(this.getNode().namespaceURI,nodeName);}catch(ex){aNode=this.getDoc().createElement(nodeName);}
this.getNode().appendChild(aNode);aNode.appendChild(tNode);}
return aNode;};JSJaCPacket.prototype.buildNode=function(elementName){return JSJaCBuilder.buildNode(this.getDoc(),elementName,arguments[1],arguments[2],arguments[3]);};JSJaCPacket.prototype.appendNode=function(element){if(typeof element=='object'){this.getNode().appendChild(element);}else{this.getNode().appendChild(this.buildNode(element,arguments[1],arguments[2],this.getNode().namespaceURI));}
return this;};function JSJaCPresence(){this.base=JSJaCPacket;this.base('presence');}
JSJaCPresence.prototype=new JSJaCPacket;JSJaCPresence.prototype.setStatus=function(status){this._setChildNode("status",status);return this;};JSJaCPresence.prototype.setShow=function(show){if(show=='chat'||show=='away'||show=='xa'||show=='dnd')
this._setChildNode("show",show);return this;};JSJaCPresence.prototype.setPriority=function(prio){this._setChildNode("priority",prio);return this;};JSJaCPresence.prototype.setPresence=function(show,status,prio){if(show)
this.setShow(show);if(status)
this.setStatus(status);if(prio)
this.setPriority(prio);return this;};JSJaCPresence.prototype.getStatus=function(){return this.getChildVal('status');};JSJaCPresence.prototype.getShow=function(){return this.getChildVal('show');};JSJaCPresence.prototype.getPriority=function(){return this.getChildVal('priority');};function JSJaCIQ(){this.base=JSJaCPacket;this.base('iq');}
JSJaCIQ.prototype=new JSJaCPacket;JSJaCIQ.prototype.setIQ=function(to,type,id){if(to)
this.setTo(to);if(type)
this.setType(type);if(id)
this.setID(id);return this;};JSJaCIQ.prototype.setQuery=function(xmlns){var query;try{query=this.getDoc().createElementNS(xmlns,'query');}catch(e){query=this.getDoc().createElement('query');query.setAttribute('xmlns',xmlns);}
this.getNode().appendChild(query);return query;};JSJaCIQ.prototype.getQuery=function(){return this.getNode().getElementsByTagName('query').item(0);};JSJaCIQ.prototype.getQueryXMLNS=function(){if(this.getQuery()){return this.getQuery().namespaceURI||this.getQuery().getAttribute('xmlns');}else{return null;}};JSJaCIQ.prototype.reply=function(payload){var rIQ=this.clone();rIQ.setTo(this.getFrom());rIQ.setFrom();rIQ.setType('result');if(payload){if(typeof payload=='string')
rIQ.getChild().appendChild(rIQ.getDoc().loadXML(payload));else if(payload.constructor==Array){var node=rIQ.getChild();for(var i=0;i<payload.length;i++)
if(typeof payload[i]=='string')
node.appendChild(rIQ.getDoc().loadXML(payload[i]));else if(typeof payload[i]=='object')
node.appendChild(payload[i]);}
else if(typeof payload=='object')
rIQ.getChild().appendChild(payload);}
return rIQ;};function JSJaCMessage(){this.base=JSJaCPacket;this.base('message');}
JSJaCMessage.prototype=new JSJaCPacket;JSJaCMessage.prototype.setBody=function(body){this._setChildNode("body",body);return this;};JSJaCMessage.prototype.setSubject=function(subject){this._setChildNode("subject",subject);return this;};JSJaCMessage.prototype.setThread=function(thread){this._setChildNode("thread",thread);return this;};JSJaCMessage.prototype.getThread=function(){return this.getChildVal('thread');};JSJaCMessage.prototype.getBody=function(){return this.getChildVal('body');};JSJaCMessage.prototype.getSubject=function(){return this.getChildVal('subject');};JSJaCPacket.wrapNode=function(node){var oPacket=null;switch(node.nodeName.toLowerCase()){case'presence':oPacket=new JSJaCPresence();break;case'message':oPacket=new JSJaCMessage();break;case'iq':oPacket=new JSJaCIQ();break;}
if(oPacket){oPacket.getDoc().replaceChild(oPacket._importNode(node,true),oPacket.getNode());}
return oPacket;};function JSJaCConnection(oArg){if(oArg&&oArg.httpbase)
this._httpbase=oArg.httpbase;if(oArg&&oArg.oDbg&&oArg.oDbg.log){this.oDbg=oArg.oDbg;}else{this.oDbg={log:function(){}};}
if(oArg&&oArg.timerval)
this.setPollInterval(oArg.timerval);else
this.setPollInterval(JSJAC_TIMERVAL);if(oArg&&oArg.cookie_prefix)
this._cookie_prefix=oArg.cookie_prefix;else
this._cookie_prefix="";this._connected=false;this._events=[];this._keys=null;this._ID=0;this._inQ=[];this._pQueue=[];this._regIDs=[];this._req=[];this._status='intialized';this._errcnt=0;this._inactivity=JSJAC_INACTIVITY;this._sendRawCallbacks=[];}
JSJaCConnection.prototype.connect=function(oArg){this._setStatus('connecting');if(oArg.authtype!='x-facebook-platform'){this.domain=oArg.domain||'localhost';this.username=oArg.username;this.resource=oArg.resource;this.pass=oArg.password||oArg.pass;this.register=oArg.register;this.authhost=oArg.authhost||oArg.host||oArg.domain;this.authtype=oArg.authtype||'sasl';}else{this.domain='chat.facebook.com';this.authtype=oArg.authtype;if(oArg.facebookApp!==undefined){this._facebookApp=oArg.facebookApp;if(!document.getElementById('fb-root')){var fbDiv=document.createElement('div');fbDiv.id='fb-root';document.body.appendChild(fbDiv);}
if(oArg.facebookApp.getSession()===undefined){this._facebookApp.Login(this,oArg);return;}}else{this.oDbg.log("No Facebook application param specified!",1);return;}}
if(oArg.xmllang&&oArg.xmllang!=='')
this._xmllang=oArg.xmllang;else
this._xmllang='en';if(oArg.allow_plain)
this._allow_plain=oArg.allow_plain;else
this._allow_plain=JSJAC_ALLOW_PLAIN;this.host=oArg.host;this.port=oArg.port||5222;if(oArg.secure)
this.secure='true';else
this.secure='false';this.jid=this.username+'@'+this.domain;this.fulljid=this.jid+'/'+this.resource;this._rid=Math.round(100000.5+(((900000.49999)-(100000.5))*Math.random()));var slot=this._getFreeSlot();this._req[slot]=this._setupRequest(true);var reqstr=this._getInitialRequestString();this.oDbg.log(reqstr,4);this._req[slot].r.onreadystatechange=JSJaC.bind(function(){var r=this._req[slot].r;if(r.readyState==4){this.oDbg.log("async recv: "+r.responseText,4);this._handleInitialResponse(r);}},this);if(typeof(this._req[slot].r.onerror)!='undefined'){this._req[slot].r.onerror=JSJaC.bind(function(e){this.oDbg.log('XmlHttpRequest error',1);},this);}
this._req[slot].r.send(reqstr);};JSJaCConnection.prototype.connected=function(){return this._connected;};JSJaCConnection.prototype.disconnect=function(){this._setStatus('disconnecting');if(!this.connected())
return;this._connected=false;clearInterval(this._interval);clearInterval(this._inQto);if(this._timeout)
clearTimeout(this._timeout);var slot=this._getFreeSlot();this._req[slot]=this._setupRequest(false);var request=this._getRequestString(false,true);this.oDbg.log("Disconnecting: "+request,4);try{this._req[slot].r.send(request);}catch(e){}
this.oDbg.log("disconnected");try{JSJaCCookie.read(this._cookie_prefix+'JSJaC_State').erase();}catch(e){}
this._handleEvent('ondisconnect');};JSJaCConnection.prototype.getPollInterval=function(){return this._timerval;};JSJaCConnection.prototype.registerHandler=function(event){event=event.toLowerCase();var eArg={handler:arguments[arguments.length-1],childName:'*',childNS:'*',type:'*'};if(arguments.length>2)
eArg.childName=arguments[1];if(arguments.length>3)
eArg.childNS=arguments[2];if(arguments.length>4)
eArg.type=arguments[3];if(!this._events[event])
this._events[event]=new Array(eArg);else
this._events[event]=this._events[event].concat(eArg);this._events[event]=this._events[event].sort(function(a,b){var aRank=0;var bRank=0;with(a){if(type=='*')
aRank++;if(childNS=='*')
aRank++;if(childName=='*')
aRank++;}
with(b){if(type=='*')
bRank++;if(childNS=='*')
bRank++;if(childName=='*')
bRank++;}
if(aRank>bRank)
return 1;if(aRank<bRank)
return-1;return 0;});this.oDbg.log("registered handler for event '"+event+"'",2);};JSJaCConnection.prototype.unregisterHandler=function(event,handler){event=event.toLowerCase();if(!this._events[event])
return;var arr=this._events[event],res=[];for(var i=0;i<arr.length;i++)
if(arr[i].handler!=handler)
res.push(arr[i]);if(arr.length!=res.length){this._events[event]=res;this.oDbg.log("unregistered handler for event '"+event+"'",2);}};JSJaCConnection.prototype.registerIQGet=function(childName,childNS,handler){this.registerHandler('iq',childName,childNS,'get',handler);};JSJaCConnection.prototype.registerIQSet=function(childName,childNS,handler){this.registerHandler('iq',childName,childNS,'set',handler);};JSJaCConnection.prototype.resume=function(){try{var json=JSJaCCookie.read(this._cookie_prefix+'JSJaC_State').getValue();this.oDbg.log('read cookie: '+json,2);JSJaCCookie.read(this._cookie_prefix+'JSJaC_State').erase();return this.resumeFromData(JSJaCJSON.parse(json));}catch(e){}
return false;};JSJaCConnection.prototype.resumeFromData=function(data){try{this._setStatus('resuming');for(var i in data)
if(data.hasOwnProperty(i))
this[i]=data[i];if(this._keys){this._keys2=new JSJaCKeys();var u=this._keys2._getSuspendVars();for(var j=0;j<u.length;j++)
this._keys2[u[j]]=this._keys[u[j]];this._keys=this._keys2;}
if(this._connected){this._handleEvent('onresume');setTimeout(JSJaC.bind(this._resume,this),this.getPollInterval());this._interval=setInterval(JSJaC.bind(this._checkQueue,this),JSJAC_CHECKQUEUEINTERVAL);this._inQto=setInterval(JSJaC.bind(this._checkInQ,this),JSJAC_CHECKINQUEUEINTERVAL);}
return(this._connected===true);}catch(e){if(e.message)
this.oDbg.log("Resume failed: "+e.message,1);else
this.oDbg.log("Resume failed: "+e,1);return false;}};JSJaCConnection.prototype.send=function(packet,cb,arg){if(!packet||!packet.pType){this.oDbg.log("no packet: "+packet,1);return false;}
if(!this.connected())
return false;if(cb){if(!packet.getID())
packet.setID('JSJaCID_'+this._ID++);this._registerPID(packet.getID(),cb,arg);}
this._pQueue=this._pQueue.concat(packet.xml());this._handleEvent(packet.pType()+'_out',packet);this._handleEvent("packet_out",packet);return true;};JSJaCConnection.prototype.sendIQ=function(iq,handlers,arg){if(!iq||iq.pType()!='iq'){return false;}
handlers=handlers||{};var error_handler=handlers.error_handler||JSJaC.bind(function(aIq){this.oDbg.log(aIq.xml(),1);},this);var result_handler=handlers.result_handler||JSJaC.bind(function(aIq){this.oDbg.log(aIq.xml(),2);},this);var iqHandler=function(aIq,arg){switch(aIq.getType()){case'error':error_handler(aIq);break;case'result':result_handler(aIq,arg);break;}};return this.send(iq,iqHandler,arg);};JSJaCConnection.prototype.setPollInterval=function(timerval){if(timerval&&!isNaN(timerval))
this._timerval=timerval;return this._timerval;};JSJaCConnection.prototype.status=function(){return this._status;};JSJaCConnection.prototype.suspend=function(){var data=this.suspendToData();try{var c=new JSJaCCookie(this._cookie_prefix+'JSJaC_State',JSJaCJSON.toString(data));this.oDbg.log("writing cookie: "+c.getValue()+"\n"+"(length:"+c.getValue().length+")",2);c.write();var c2=JSJaCCookie.get(this._cookie_prefix+'JSJaC_State');if(c.getValue()!=c2){this.oDbg.log("Suspend failed writing cookie.\nread: "+c2,1);c.erase();return false;}
return true;}catch(e){this.oDbg.log("Failed creating cookie '"+this._cookie_prefix+"JSJaC_State': "+e.message,1);}
return false;};JSJaCConnection.prototype.suspendToData=function(){clearTimeout(this._timeout);clearInterval(this._interval);clearInterval(this._inQto);this._suspend();var u=('_connected,_keys,_ID,_xmllang,_inQ,_pQueue,_regIDs,_errcnt,_inactivity,domain,username,resource,jid,fulljid,_sid,_httpbase,_timerval,_is_polling').split(',');u=u.concat(this._getSuspendVars());var s={};for(var i=0;i<u.length;i++){if(!this[u[i]])continue;var o={};if(this[u[i]]._getSuspendVars){var uo=this[u[i]]._getSuspendVars();for(var j=0;j<uo.length;j++)
o[uo[j]]=this[u[i]][uo[j]];}else
o=this[u[i]];s[u[i]]=o;}
this._connected=false;this._setStatus('suspending');return s;};JSJaCConnection.prototype._abort=function(){clearTimeout(this._timeout);clearInterval(this._inQto);clearInterval(this._interval);this._connected=false;this._setStatus('aborted');this.oDbg.log("Disconnected.",1);this._handleEvent('ondisconnect');this._handleEvent('onerror',JSJaCError('500','cancel','service-unavailable'));};JSJaCConnection.prototype._checkInQ=function(){for(var i=0;i<this._inQ.length&&i<10;i++){var item=this._inQ[0];this._inQ=this._inQ.slice(1,this._inQ.length);var packet=JSJaCPacket.wrapNode(item);if(!packet)
return;this._handleEvent("packet_in",packet);if(packet.pType&&!this._handlePID(packet)){this._handleEvent(packet.pType()+'_in',packet);this._handleEvent(packet.pType(),packet);}}};JSJaCConnection.prototype._checkQueue=function(){if(this._pQueue.length>0)
this._process();return true;};JSJaCConnection.prototype._doAuth=function(){if(this.has_sasl&&this.authtype=='nonsasl')
this.oDbg.log("Warning: SASL present but not used",1);if(!this._doSASLAuth()&&!this._doLegacyAuth()){this.oDbg.log("Auth failed for authtype "+this.authtype,1);this.disconnect();return false;}
return true;};JSJaCConnection.prototype._doInBandReg=function(){if(this.authtype=='saslanon'||this.authtype=='anonymous')
return;var iq=new JSJaCIQ();iq.setType('set');iq.setID('reg1');iq.appendNode("query",{xmlns:NS_REGISTER},[["username",this.username],["password",this.pass]]);this.send(iq,this._doInBandRegDone);};JSJaCConnection.prototype._doInBandRegDone=function(iq){if(iq&&iq.getType()=='error'){this.oDbg.log("registration failed for "+this.username,0);this._handleEvent('onerror',iq.getChild('error'));return;}
this.oDbg.log(this.username+" registered succesfully",0);this._doAuth();};JSJaCConnection.prototype._doLegacyAuth=function(){if(this.authtype!='nonsasl'&&this.authtype!='anonymous')
return false;var iq=new JSJaCIQ();iq.setIQ(null,'get','auth1');iq.appendNode('query',{xmlns:NS_AUTH},[['username',this.username]]);this.send(iq,this._doLegacyAuth2);return true;};JSJaCConnection.prototype._doLegacyAuth2=function(resIq){if(!resIq||resIq.getType()!='result'){if(resIq&&resIq.getType()=='error')
this._handleEvent('onerror',resIq.getChild('error'));this.disconnect();return;}
var use_digest=(resIq.getChild('digest')!==null);var iq=new JSJaCIQ();iq.setIQ(null,'set','auth2');var query=iq.appendNode('query',{xmlns:NS_AUTH},[['username',this.username],['resource',this.resource]]);if(use_digest){query.appendChild(iq.buildNode('digest',{xmlns:NS_AUTH},hex_sha1(this.streamid+this.pass)));}else if(this._allow_plain){query.appendChild(iq.buildNode('password',{xmlns:NS_AUTH},this.pass));}else{this.oDbg.log("no valid login mechanism found",1);this.disconnect();return;}
this.send(iq,this._doLegacyAuthDone);};JSJaCConnection.prototype._doLegacyAuthDone=function(iq){if(iq.getType()!='result'){if(iq.getType()=='error')
this._handleEvent('onerror',iq.getChild('error'));this.disconnect();}else
this._handleEvent('onconnect');};JSJaCConnection.prototype._doSASLAuth=function(){if(this.authtype=='nonsasl'||this.authtype=='anonymous')
return false;if(this.authtype=='saslanon'){if(this.mechs['ANONYMOUS']){this.oDbg.log("SASL using mechanism 'ANONYMOUS'",2);return this._sendRaw("<auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='ANONYMOUS'/>",this._doSASLAuthDone);}
this.oDbg.log("SASL ANONYMOUS requested but not supported",1);}else if(this.authtype=='x-facebook-platform'){if(this.mechs['X-FACEBOOK-PLATFORM']){return this._sendRaw("<auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='X-FACEBOOK-PLATFORM' />",this._doFacebookAuth);}
this.oDbg.log("X-FACEBOOK-PLATFORM requested but not supported",1);}else{if(this.mechs['DIGEST-MD5']){this.oDbg.log("SASL using mechanism 'DIGEST-MD5'",2);return this._sendRaw("<auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='DIGEST-MD5'/>",this._doSASLAuthDigestMd5S1);}else if(this._allow_plain&&this.mechs['PLAIN']){this.oDbg.log("SASL using mechanism 'PLAIN'",2);var authStr=this.username+'@'+
this.domain+String.fromCharCode(0)+
this.username+String.fromCharCode(0)+
this.pass;this.oDbg.log("authenticating with '"+authStr+"'",2);authStr=b64encode(authStr);return this._sendRaw("<auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='PLAIN'>"+authStr+"</auth>",this._doSASLAuthDone);}
this.oDbg.log("No SASL mechanism applied",1);this.authtype='nonsasl';}
return false;};JSJaCConnection.prototype._doSASLAuthDigestMd5S1=function(el){if(el.nodeName!="challenge"){this.oDbg.log("challenge missing",1);this._handleEvent('onerror',JSJaCError('401','auth','not-authorized'));this.disconnect();}else{var challenge=b64decode(el.firstChild.nodeValue);this.oDbg.log("got challenge: "+challenge,2);this._nonce=challenge.substring(challenge.indexOf("nonce=")+7);this._nonce=this._nonce.substring(0,this._nonce.indexOf("\""));this.oDbg.log("nonce: "+this._nonce,2);if(this._nonce===''||this._nonce.indexOf('\"')!=-1){this.oDbg.log("nonce not valid, aborting",1);this.disconnect();return;}
this._digest_uri="xmpp/";this._digest_uri+=this.domain;this._cnonce=cnonce(14);this._nc='00000001';var A1=str_md5(this.username+':'+this.domain+':'+this.pass)+':'+this._nonce+':'+this._cnonce;var A2='AUTHENTICATE:'+this._digest_uri;var response=hex_md5(hex_md5(A1)+':'+this._nonce+':'+this._nc+':'+
this._cnonce+':auth:'+hex_md5(A2));var rPlain='username="'+this.username+'",realm="'+this.domain+'",nonce="'+this._nonce+'",cnonce="'+this._cnonce+'",nc="'+this._nc+'",qop=auth,digest-uri="'+this._digest_uri+'",response="'+response+'",charset="utf-8"';this.oDbg.log("response: "+rPlain,2);this._sendRaw("<response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>"+
binb2b64(str2binb(rPlain))+"</response>",this._doSASLAuthDigestMd5S2);}};JSJaCConnection.prototype._doSASLAuthDigestMd5S2=function(el){if(el.nodeName=='failure'){if(el.xml)
this.oDbg.log("auth error: "+el.xml,1);else
this.oDbg.log("auth error",1);this._handleEvent('onerror',JSJaCError('401','auth','not-authorized'));this.disconnect();return;}
var response=b64decode(el.firstChild.nodeValue);this.oDbg.log("response: "+response,2);var rspauth=response.substring(response.indexOf("rspauth=")+8);this.oDbg.log("rspauth: "+rspauth,2);var A1=str_md5(this.username+':'+this.domain+':'+this.pass)+':'+this._nonce+':'+this._cnonce;var A2=':'+this._digest_uri;var rsptest=hex_md5(hex_md5(A1)+':'+this._nonce+':'+this._nc+':'+
this._cnonce+':auth:'+hex_md5(A2));this.oDbg.log("rsptest: "+rsptest,2);if(rsptest!=rspauth){this.oDbg.log("SASL Digest-MD5: server repsonse with wrong rspauth",1);this.disconnect();return;}
if(el.nodeName=='success'){this._reInitStream(JSJaC.bind(this._doStreamBind,this));}else{this._sendRaw("<response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>",this._doSASLAuthDone);}};JSJaCConnection.prototype._doSASLAuthDone=function(el){if(el.nodeName!='success'){this.oDbg.log("auth failed",1);this._handleEvent('onerror',JSJaCError('401','auth','not-authorized'));this.disconnect();}else{this._reInitStream(JSJaC.bind(this._doStreamBind,this));}};JSJaCConnection.prototype._doFacebookAuth=function(el){if(el.nodeName!="challenge"){this.oDbg.log("challenge missing",1);this._handleEvent('onerror',JSJaCError('401','auth','not-authorized'));this.disconnect();}else{var challenge=b64decode(el.firstChild.nodeValue);this.oDbg.log("got challenge: "+challenge,2);var parts=challenge.split('&');var vars=Array();for(var i=0;i<parts.length;i++){var tmp=parts[i].split('=');vars[tmp[0]]=tmp[1];}
if(vars['nonce']!=''){var fbSession=this._facebookApp.getSession();var response={'api_key':this._facebookApp.getApiKey(),'call_id':new Date().getTime(),'method':vars['method'],'nonce':vars['nonce'],'session_key':fbSession['session_key'],'v':'1.0'};response['sig']='api_key='+response['api_key']+'call_id='+response['call_id']+'method='+response['method']+'nonce='+response['nonce']+'session_key='+response['session_key']+'v='+response['v'];response['sig']=hex_md5(response['sig']+this._facebookApp.getApiSecret());response='api_key='+response['api_key']+'&'+'call_id='+response['call_id']+'&'+'method='+response['method']+'&'+'nonce='+response['nonce']+'&'+'session_key='+response['session_key']+'&'+'v='+response['v']+'&'+'sig='+response['sig'];response=b64encode(response);return this._sendRaw("<response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>"+response+"</response>",this._doFacebookAuthDone);}else{this.oDbg.log("nonce missing",1);this._handleEvent('onerror',JSJaCError('401','auth','not-authorized'));this.disconnect();}}};JSJaCConnection.prototype._doFacebookAuthDone=function(el){if(el.nodeName!='success'){this.oDbg.log("auth failed",1);this._handleEvent('onerror',JSJaCError('401','auth','not-authorized'));this.disconnect();}else{this._reInitStream(JSJaC.bind(this._doStreamBind,this));}};JSJaCConnection.prototype._doStreamBind=function(){var iq=new JSJaCIQ();iq.setIQ(null,'set','bind_1');iq.appendNode("bind",{xmlns:NS_BIND},[["resource",this.resource]]);this.oDbg.log(iq.xml());this.send(iq,this._doXMPPSess);};JSJaCConnection.prototype._doXMPPSess=function(iq){if(iq.getType()!='result'||iq.getType()=='error'){this.disconnect();if(iq.getType()=='error')
this._handleEvent('onerror',iq.getChild('error'));return;}
this.fulljid=iq.getChildVal("jid");this.jid=this.fulljid.substring(0,this.fulljid.lastIndexOf('/'));iq=new JSJaCIQ();iq.setIQ(null,'set','sess_1');iq.appendNode("session",{xmlns:NS_SESSION},[]);this.oDbg.log(iq.xml());this.send(iq,this._doXMPPSessDone);};JSJaCConnection.prototype._doXMPPSessDone=function(iq){if(iq.getType()!='result'||iq.getType()=='error'){this.disconnect();if(iq.getType()=='error')
this._handleEvent('onerror',iq.getChild('error'));return;}else
this._handleEvent('onconnect');};JSJaCConnection.prototype._handleEvent=function(event,arg){event=event.toLowerCase();this.oDbg.log("incoming event '"+event+"'",3);if(!this._events[event])
return;this.oDbg.log("handling event '"+event+"'",2);for(var i=0;i<this._events[event].length;i++){var aEvent=this._events[event][i];if(typeof aEvent.handler=='function'){if(arg){if(arg.pType){if((!arg.getNode().hasChildNodes()&&aEvent.childName!='*')||(arg.getNode().hasChildNodes()&&!arg.getChild(aEvent.childName,aEvent.childNS)))
continue;if(aEvent.type!='*'&&arg.getType()!=aEvent.type)
continue;this.oDbg.log(aEvent.childName+"/"+aEvent.childNS+"/"+aEvent.type+" => match for handler "+aEvent.handler,3);}
if(aEvent.handler(arg)){break;}}else if(aEvent.handler()){break;}}}};JSJaCConnection.prototype._handlePID=function(aJSJaCPacket){if(!aJSJaCPacket.getID())
return false;for(var i in this._regIDs){if(this._regIDs.hasOwnProperty(i)&&this._regIDs[i]&&i==aJSJaCPacket.getID()){var pID=aJSJaCPacket.getID();this.oDbg.log("handling "+pID,3);if(this._regIDs[i].cb.call(this,aJSJaCPacket,this._regIDs[i].arg)===false){return false;}else{this._unregisterPID(pID);return true;}}}
return false;};JSJaCConnection.prototype._handleResponse=function(req){var rootEl=this._parseResponse(req);if(!rootEl)
return;for(var i=0;i<rootEl.childNodes.length;i++){if(this._sendRawCallbacks.length){var cb=this._sendRawCallbacks[0];this._sendRawCallbacks=this._sendRawCallbacks.slice(1,this._sendRawCallbacks.length);cb.fn.call(this,rootEl.childNodes.item(i),cb.arg);continue;}
this._inQ=this._inQ.concat(rootEl.childNodes.item(i));}};JSJaCConnection.prototype._parseStreamFeatures=function(doc){if(!doc){this.oDbg.log("nothing to parse ... aborting",1);return false;}
var errorTag;if(doc.getElementsByTagNameNS){errorTag=doc.getElementsByTagNameNS(NS_STREAM,"error").item(0);}else{var errors=doc.getElementsByTagName("error");for(var i=0;i<errors.length;i++)
if(errors.item(i).namespaceURI==NS_STREAM||errors.item(i).getAttribute('xmlns')==NS_STREAM){errorTag=errors.item(i);break;}}
if(errorTag){this._setStatus("internal_server_error");clearTimeout(this._timeout);clearInterval(this._interval);clearInterval(this._inQto);this._handleEvent('onerror',JSJaCError('503','cancel','session-terminate'));this._connected=false;this.oDbg.log("Disconnected.",1);this._handleEvent('ondisconnect');return false;}
this.mechs={};var lMec1=doc.getElementsByTagName("mechanisms");if(!lMec1.length)return false;this.has_sasl=false;for(var i=0;i<lMec1.length;i++)
if(lMec1.item(i).getAttribute("xmlns")==NS_SASL){this.has_sasl=true;var lMec2=lMec1.item(i).getElementsByTagName("mechanism");for(var j=0;j<lMec2.length;j++)
this.mechs[lMec2.item(j).firstChild.nodeValue]=true;break;}
if(this.has_sasl)
this.oDbg.log("SASL detected",2);else{this.oDbg.log("No support for SASL detected",2);return true;}
return true;};JSJaCConnection.prototype._process=function(timerval){if(!this.connected()){this.oDbg.log("Connection lost ...",1);if(this._interval)
clearInterval(this._interval);return;}
this.setPollInterval(timerval);if(this._timeout)
clearTimeout(this._timeout);var slot=this._getFreeSlot();if(slot<0)
return;if(typeof(this._req[slot])!='undefined'&&typeof(this._req[slot].r)!='undefined'&&this._req[slot].r.readyState!=4){this.oDbg.log("Slot "+slot+" is not ready");return;}
if(!this.isPolling()&&this._pQueue.length===0&&this._req[(slot+1)%2]&&this._req[(slot+1)%2].r.readyState!=4){this.oDbg.log("all slots busy, standby ...",2);return;}
if(!this.isPolling())
this.oDbg.log("Found working slot at "+slot,2);this._req[slot]=this._setupRequest(true);this._req[slot].r.onreadystatechange=JSJaC.bind(function(){if(!this.connected())
return;if(this._req[slot].r.readyState==4){this.oDbg.log("async recv: "+this._req[slot].r.responseText,4);this._handleResponse(this._req[slot]);this._setStatus('processing');if(this._pQueue.length){this._timeout=setTimeout(JSJaC.bind(this._process,this),100);}else{this.oDbg.log("scheduling next poll in "+
this.getPollInterval()+" msec",4);this._timeout=setTimeout(JSJaC.bind(this._process,this),this.getPollInterval());}}},this);try{this._req[slot].r.onerror=JSJaC.bind(function(){if(!this.connected())
return;this._errcnt++;this.oDbg.log('XmlHttpRequest error ('+this._errcnt+')',1);if(this._errcnt>JSJAC_ERR_COUNT){this._abort();return;}
this._setStatus('onerror_fallback');setTimeout(JSJaC.bind(this._repeat,this),JSJAC_RETRYDELAY);return;},this);}catch(e){}
var reqstr=this._getRequestString();if(typeof(this._rid)!='undefined')
this._req[slot].rid=this._rid;this.oDbg.log("sending: "+reqstr,4);this._req[slot].r.send(reqstr);};JSJaCConnection.prototype._registerPID=function(pID,cb,arg){if(!pID||!cb)
return false;this._regIDs[pID]={};this._regIDs[pID].cb=cb;if(arg)
this._regIDs[pID].arg=arg;this.oDbg.log("registered "+pID,3);return true;};JSJaCConnection.prototype._prepSendEmpty=function(cb,ctx){return function(){ctx._sendEmpty(JSJaC.bind(cb,ctx));};};JSJaCConnection.prototype._sendEmpty=function(cb){var slot=this._getFreeSlot();this._req[slot]=this._setupRequest(true);this._req[slot].r.onreadystatechange=JSJaC.bind(function(){if(this._req[slot].r.readyState==4){this.oDbg.log("async recv: "+this._req[slot].r.responseText,4);cb(this._req[slot].r);}},this);if(typeof(this._req[slot].r.onerror)!='undefined'){this._req[slot].r.onerror=JSJaC.bind(function(e){this.oDbg.log('XmlHttpRequest error',1);},this);}
var reqstr=this._getRequestString();this.oDbg.log("sending: "+reqstr,4);this._req[slot].r.send(reqstr);};JSJaCConnection.prototype._sendRaw=function(xml,cb,arg){if(cb)
this._sendRawCallbacks.push({fn:cb,arg:arg});this._pQueue.push(xml);this._process();return true;};JSJaCConnection.prototype._setStatus=function(status){if(!status||status==='')
return;if(status!=this._status){this._status=status;this._handleEvent('onstatuschanged',status);this._handleEvent('status_changed',status);}};JSJaCConnection.prototype._unregisterPID=function(pID){if(!this._regIDs[pID])
return false;this._regIDs[pID]=null;this.oDbg.log("unregistered "+pID,3);return true;};function JSJaCHttpBindingConnection(oArg){this.base=JSJaCConnection;this.base(oArg);this._hold=JSJACHBC_MAX_HOLD;this._inactivity=0;this._last_requests={};this._last_rid=0;this._min_polling=0;this._pause=0;this._wait=oArg.wait||JSJACHBC_MAX_WAIT;}
JSJaCHttpBindingConnection.prototype=new JSJaCConnection();JSJaCHttpBindingConnection.prototype.inherit=function(oArg){if(oArg.jid){var oJid=new JSJaCJID(oArg.jid);this.domain=oJid.getDomain();this.username=oJid.getNode();this.resource=oJid.getResource();}else{this.domain=oArg.domain||'localhost';this.username=oArg.username;this.resource=oArg.resource;}
this._sid=oArg.sid;this._rid=oArg.rid;this._min_polling=oArg.polling;this._inactivity=oArg.inactivity;this._setHold(oArg.requests-1);this.setPollInterval(this._timerval);if(oArg.wait)
this._wait=oArg.wait;this._connected=true;this._handleEvent('onconnect');this._interval=setInterval(JSJaC.bind(this._checkQueue,this),JSJAC_CHECKQUEUEINTERVAL);this._inQto=setInterval(JSJaC.bind(this._checkInQ,this),JSJAC_CHECKINQUEUEINTERVAL);this._timeout=setTimeout(JSJaC.bind(this._process,this),this.getPollInterval());};JSJaCHttpBindingConnection.prototype.setPollInterval=function(timerval){if(timerval&&!isNaN(timerval)){if(!this.isPolling())
this._timerval=100;else if(this._min_polling&&timerval<this._min_polling*1000)
this._timerval=this._min_polling*1000;else if(this._inactivity&&timerval>this._inactivity*1000)
this._timerval=this._inactivity*1000;else
this._timerval=timerval;}
return this._timerval;};JSJaCHttpBindingConnection.prototype.isPolling=function(){return(this._hold===0);};JSJaCHttpBindingConnection.prototype._getFreeSlot=function(){for(var i=0;i<this._hold+1;i++)
if(typeof(this._req[i])=='undefined'||typeof(this._req[i].r)=='undefined'||this._req[i].r.readyState==4)
return i;return-1;};JSJaCHttpBindingConnection.prototype._getHold=function(){return this._hold;};JSJaCHttpBindingConnection.prototype._getRequestString=function(raw,last){raw=raw||'';var reqstr='';if(this._rid<=this._last_rid&&typeof(this._last_requests[this._rid])!='undefined')
reqstr=this._last_requests[this._rid].xml;else{var xml='';while(this._pQueue.length){var curNode=this._pQueue[0];xml+=curNode;this._pQueue=this._pQueue.slice(1,this._pQueue.length);}
reqstr="<body rid='"+this._rid+"' sid='"+this._sid+"' xmlns='http://jabber.org/protocol/httpbind' ";if(JSJAC_HAVEKEYS){reqstr+="key='"+this._keys.getKey()+"' ";if(this._keys.lastKey()){this._keys=new JSJaCKeys(hex_sha1,this.oDbg);reqstr+="newkey='"+this._keys.getKey()+"' ";}}
if(last)
reqstr+="type='terminate'";else if(this._reinit){if(JSJACHBC_USE_BOSH_VER)
reqstr+="xml:lang='"+this._xmllang+"' xmpp:restart='true' xmlns:xmpp='urn:xmpp:xbosh' to='"+this.domain+"'";this._reinit=false;}
if(xml!=''||raw!=''){reqstr+=">"+raw+xml+"</body>";}else{reqstr+="> </body>";}
this._last_requests[this._rid]={};this._last_requests[this._rid].xml=reqstr;this._last_rid=this._rid;for(var i in this._last_requests)
if(this._last_requests.hasOwnProperty(i)&&i<this._rid-this._hold)
delete(this._last_requests[i]);}
return reqstr;};JSJaCHttpBindingConnection.prototype._getInitialRequestString=function(){var reqstr="<body content='text/xml; charset=utf-8' hold='"+this._hold+"' xmlns='http://jabber.org/protocol/httpbind' to='"+this.authhost+"' wait='"+this._wait+"' rid='"+this._rid+"'";if(this.host&&this.port)
reqstr+=" route='xmpp:"+this.host+":"+this.port+"'";if(this.secure)
reqstr+=" secure='"+this.secure+"'";if(JSJAC_HAVEKEYS){this._keys=new JSJaCKeys(hex_sha1,this.oDbg);var key=this._keys.getKey();reqstr+=" newkey='"+key+"'";}
reqstr+=" xml:lang='"+this._xmllang+"'";if(JSJACHBC_USE_BOSH_VER){reqstr+=" ver='"+JSJACHBC_BOSH_VERSION+"'";reqstr+=" xmlns:xmpp='urn:xmpp:xbosh'";if(this.authtype=='sasl'||this.authtype=='saslanon'||this.authtype=='x-facebook-platform')
reqstr+=" xmpp:version='1.0'";}
reqstr+="/>";return reqstr;};JSJaCHttpBindingConnection.prototype._getStreamID=function(req){this.oDbg.log(req.responseText,4);if(!req.responseXML||!req.responseXML.documentElement){this._handleEvent('onerror',JSJaCError('503','cancel','service-unavailable'));return;}
var body=req.responseXML.documentElement;if(body.getAttribute('type')=='terminate'){this._handleEvent('onerror',JSJaCError('503','cancel','service-unavailable'));return;}
if(body.getAttribute('authid')){this.streamid=body.getAttribute('authid');this.oDbg.log("got streamid: "+this.streamid,2);}
if(!this._parseStreamFeatures(body)){this._sendEmpty(JSJaC.bind(this._getStreamID,this));return;}
this._timeout=setTimeout(JSJaC.bind(this._process,this),this.getPollInterval());if(this.register)
this._doInBandReg();else
this._doAuth();};JSJaCHttpBindingConnection.prototype._getSuspendVars=function(){return('host,port,secure,_rid,_last_rid,_wait,_min_polling,_inactivity,_hold,_last_requests,_pause').split(',');};JSJaCHttpBindingConnection.prototype._handleInitialResponse=function(req){try{this.oDbg.log(req.getAllResponseHeaders(),4);this.oDbg.log(req.responseText,4);}catch(ex){this.oDbg.log("No response",4);}
if(req.status!=200||!req.responseXML){this.oDbg.log("initial response broken (status: "+req.status+")",1);this._handleEvent('onerror',JSJaCError('503','cancel','service-unavailable'));return;}
var body=req.responseXML.documentElement;if(!body||body.tagName!='body'||body.namespaceURI!=NS_BOSH){this.oDbg.log("no body element or incorrect body in initial response",1);this._handleEvent("onerror",JSJaCError("500","wait","internal-service-error"));return;}
if(body.getAttribute("type")=="terminate"){this.oDbg.log("invalid response:\n"+req.responseText,1);clearTimeout(this._timeout);this._connected=false;this.oDbg.log("Disconnected.",1);this._handleEvent('ondisconnect');this._handleEvent('onerror',JSJaCError('503','cancel','service-unavailable'));return;}
this._sid=body.getAttribute('sid');this.oDbg.log("got sid: "+this._sid,2);if(body.getAttribute('polling'))
this._min_polling=body.getAttribute('polling');if(body.getAttribute('inactivity'))
this._inactivity=body.getAttribute('inactivity');if(body.getAttribute('requests'))
this._setHold(body.getAttribute('requests')-1);this.oDbg.log("set hold to "+this._getHold(),2);if(body.getAttribute('ver'))
this._bosh_version=body.getAttribute('ver');if(body.getAttribute('maxpause'))
this._pause=Number.min(body.getAttribute('maxpause'),JSJACHBC_MAXPAUSE);this.setPollInterval(this._timerval);this._connected=true;this._inQto=setInterval(JSJaC.bind(this._checkInQ,this),JSJAC_CHECKINQUEUEINTERVAL);this._interval=setInterval(JSJaC.bind(this._checkQueue,this),JSJAC_CHECKQUEUEINTERVAL);this._getStreamID(req);};JSJaCHttpBindingConnection.prototype._parseResponse=function(req){if(!this.connected()||!req)
return null;var r=req.r;try{if(r.status==404||r.status==403){this._abort();return null;}
if(r.status!=200||!r.responseXML){this._errcnt++;var errmsg="invalid response ("+r.status+"):\n"+r.getAllResponseHeaders()+"\n"+r.responseText;if(!r.responseXML)
errmsg+="\nResponse failed to parse!";this.oDbg.log(errmsg,1);if(this._errcnt>JSJAC_ERR_COUNT){this._abort();return null;}
if(this.connected()){this.oDbg.log("repeating ("+this._errcnt+")",1);this._setStatus('proto_error_fallback');setTimeout(JSJaC.bind(this._repeat,this),this.getPollInterval());}
return null;}}catch(e){this.oDbg.log("XMLHttpRequest error: status not available",1);this._errcnt++;if(this._errcnt>JSJAC_ERR_COUNT){this._abort();}else{if(this.connected()){this.oDbg.log("repeating ("+this._errcnt+")",1);this._setStatus('proto_error_fallback');setTimeout(JSJaC.bind(this._repeat,this),this.getPollInterval());}}
return null;}
var body=r.responseXML.documentElement;if(!body||body.tagName!='body'||body.namespaceURI!=NS_BOSH){this.oDbg.log("invalid response:\n"+r.responseText,1);clearTimeout(this._timeout);clearInterval(this._interval);clearInterval(this._inQto);this._connected=false;this.oDbg.log("Disconnected.",1);this._handleEvent('ondisconnect');this._setStatus('internal_server_error');this._handleEvent('onerror',JSJaCError('500','wait','internal-server-error'));return null;}
if(typeof(req.rid)!='undefined'&&this._last_requests[req.rid]){if(this._last_requests[req.rid].handled){this.oDbg.log("already handled "+req.rid,2);return null;}else
this._last_requests[req.rid].handled=true;}
if(body.getAttribute("type")=="terminate"){var condition=body.getAttribute('condition');this.oDbg.log("session terminated:\n"+r.responseText,1);clearTimeout(this._timeout);clearInterval(this._interval);clearInterval(this._inQto);try{JSJaCCookie.read(this._cookie_prefix+'JSJaC_State').erase();}catch(e){}
this._connected=false;if(condition=="remote-stream-error"){if(body.getElementsByTagName("conflict").length>0)
this._setStatus("session-terminate-conflict");else
this._setStatus('terminated');}else{this._setStatus('terminated');}
if(condition===null)
condition='session-terminate';this._handleEvent('onerror',JSJaCError('503','cancel',condition));this.oDbg.log("Aborting remaining connections",4);for(var i=0;i<this._hold+1;i++){try{if(this._req[i]&&this._req[i]!=req)
this._req[i].r.abort();}catch(e){this.oDbg.log(e,1);}}
this.oDbg.log("parseResponse done with terminating",3);this.oDbg.log("Disconnected.",1);this._handleEvent('ondisconnect');return null;}
this._errcnt=0;return r.responseXML.documentElement;};JSJaCHttpBindingConnection.prototype._reInitStream=function(cb){this._reinit=true;this._sendEmpty(this._prepReInitStreamWait(cb));};JSJaCHttpBindingConnection.prototype._prepReInitStreamWait=function(cb){return JSJaC.bind(function(req){this._reInitStreamWait(req,cb);},this);};JSJaCHttpBindingConnection.prototype._reInitStreamWait=function(req,cb){this.oDbg.log("checking for stream features");var doc=req.responseXML.documentElement,features,bind;this.oDbg.log(doc);if(doc.getElementsByTagNameNS){this.oDbg.log("checking with namespace");features=doc.getElementsByTagNameNS(NS_STREAM,'features').item(0);if(features){bind=features.getElementsByTagNameNS(NS_BIND,'bind').item(0);}}else{var featuresNL=doc.getElementsByTagName('stream:features'),i,l;for(i=0,l=featuresNL.length;i<l;i++){if(featuresNL.item(i).namespaceURI==NS_STREAM||featuresNL.item(i).getAttribute('xmlns')==NS_STREAM){features=featuresNL.item(i);break;}}
if(features){bind=features.getElementsByTagName('bind');for(i=0,l=bind.length;i<l;i++){if(bind.item(i).namespaceURI==NS_BIND||bind.item(i).getAttribute('xmlns')==NS_BIND){bind=bind.item(i);break;}}}}
this.oDbg.log(features);this.oDbg.log(bind);if(features){if(bind){cb();}else{this.oDbg.log("no bind feature - giving up",1);this._handleEvent('onerror',JSJaCError('503','cancel',"service-unavailable"));this._connected=false;this.oDbg.log("Disconnected.",1);this._handleEvent('ondisconnect');}}else{this._sendEmpty(this._prepReInitStreamWait(cb));}};JSJaCHttpBindingConnection.prototype._repeat=function(){if(this._rid>=this._last_rid)
this._rid=this._last_rid-1;this._process();};JSJaCHttpBindingConnection.prototype._resume=function(){if(this._pause===0)
this._repeat();else
this._process();};JSJaCHttpBindingConnection.prototype._setHold=function(hold){if(!hold||isNaN(hold)||hold<0)
hold=0;else if(hold>JSJACHBC_MAX_HOLD)
hold=JSJACHBC_MAX_HOLD;this._hold=hold;return this._hold;};JSJaCHttpBindingConnection.prototype._setupRequest=function(async){var req={};var r=XmlHttp.create();try{r.open("POST",this._httpbase,async);r.setRequestHeader('Content-Type','text/xml; charset=utf-8');}catch(e){this.oDbg.log(e,1);}
req.r=r;this._rid++;req.rid=this._rid;return req;};JSJaCHttpBindingConnection.prototype._suspend=function(){if(this._pause===0)
return;var slot=this._getFreeSlot();this._req[slot]=this._setupRequest(false);var reqstr="<body pause='"+this._pause+"' xmlns='http://jabber.org/protocol/httpbind' sid='"+this._sid+"' rid='"+this._rid+"'";if(JSJAC_HAVEKEYS){reqstr+=" key='"+this._keys.getKey()+"'";if(this._keys.lastKey()){this._keys=new JSJaCKeys(hex_sha1,this.oDbg);reqstr+=" newkey='"+this._keys.getKey()+"'";}}
reqstr+=">";while(this._pQueue.length){var curNode=this._pQueue[0];reqstr+=curNode;this._pQueue=this._pQueue.slice(1,this._pQueue.length);}
reqstr+="</body>";this.oDbg.log("Disconnecting: "+reqstr,4);this._req[slot].r.send(reqstr);};function JSJaCWebSocketConnection(oArg){this.base=JSJaCConnection;this.base(oArg);this._ws=null;this.registerHandler('onerror',JSJaC.bind(this._cleanupWebSocket,this));}
JSJaCWebSocketConnection.prototype=new JSJaCConnection();JSJaCWebSocketConnection.prototype._cleanupWebSocket=function(){if(this._ws!==null){this._ws.onclose=null;this._ws.onerror=null;this._ws.onopen=null;this._ws.onmessage=null;this._ws.close();this._ws=null;}};JSJaCWebSocketConnection.prototype.connect=function(oArg){this._setStatus('connecting');this.domain=oArg.domain||'localhost';this.username=oArg.username;this.resource=oArg.resource;this.pass=oArg.password||oArg.pass;this.register=oArg.register;this.authhost=oArg.authhost||this.domain;this.authtype=oArg.authtype||'sasl';this.jid=this.username+'@'+this.domain;this.fulljid=this.jid+'/'+this.resource;if(oArg.allow_plain){this._allow_plain=oArg.allow_plain;}else{this._allow_plain=JSJAC_ALLOW_PLAIN;}
if(oArg.xmllang&&oArg.xmllang!==''){this._xmllang=oArg.xmllang;}else{this._xmllang='en';}
if(typeof WebSocket==='undefined'){this._handleEvent('onerror',JSJaCError('503','cancel','service-unavailable'));return;}
this._ws=new WebSocket(this._httpbase,'xmpp');this._ws.onclose=JSJaC.bind(this._onclose,this);this._ws.onerror=JSJaC.bind(this._onerror,this);this._ws.onopen=JSJaC.bind(this._onopen,this);};JSJaCWebSocketConnection.prototype._onopen=function(){var reqstr=this._getInitialRequestString();this.oDbg.log(reqstr,4);this._ws.onmessage=JSJaC.bind(this._handleOpenStream,this);this._ws.send(reqstr);};JSJaCWebSocketConnection.prototype._handleOpenStream=function(event){var open,stream;this.oDbg.log(event.data,4);open=event.data;open=open.substr(open.indexOf('<stream:stream'));if(open.substr(-2)!=='/>'&&open.substr(-16)!=='</stream:stream>'){open+='</stream:stream>';}
stream=this._parseXml(open);if(!stream){this._handleEvent('onerror',JSJaCError('503','cancel','service-unavailable'));return;}
this.streamid=stream.getAttribute('id');this.oDbg.log('got streamid: '+this.streamid,2);this._ws.onmessage=JSJaC.bind(this._handleInitialResponse,this);};JSJaCWebSocketConnection.prototype._handleInitialResponse=function(event){var doc=this._parseXml(event.data);if(!this._parseStreamFeatures(doc)){this._handleEvent('onerror',JSJaCError('503','cancel','service-unavailable'));return;}
this._connected=true;if(this.register){this._doInBandReg();}else{this._doAuth();}};JSJaCWebSocketConnection.prototype.disconnect=function(){this._setStatus('disconnecting');if(!this.connected()){return;}
this._connected=false;this.oDbg.log('Disconnecting',4);this._sendRaw('</stream:stream>',JSJaC.bind(this._cleanupWebSocket,this));this.oDbg.log('Disconnected',2);this._handleEvent('ondisconnect');};JSJaCWebSocketConnection.prototype._onclose=function(){this.oDbg.log('websocket closed',2);if(this._status!=='disconnecting'){this._connected=false;this._handleEvent('onerror',JSJaCError('503','cancel','service-unavailable'));}};JSJaCWebSocketConnection.prototype._onerror=function(){this.oDbg.log('websocket error',1);this._connected=false;this._handleEvent('onerror',JSJaCError('503','cancel','service-unavailable'));};JSJaCWebSocketConnection.prototype._onmessage=function(event){var stanza,node,packet;stanza=event.data;this._setStatus('processing');if(!stanza||stanza===''){return;}
node=this._parseXml(stanza);if(node.namespaceURI===NS_STREAM&&node.localName==='error'){if(node.getElementsByTagNameNS(NS_STREAMS,'conflict').length>0){this._setStatus('session-terminate-conflict');}
this._connected=false;this._handleEvent('onerror',JSJaCError('503','cancel','remote-stream-error'));return;}
packet=JSJaCPacket.wrapNode(node);if(!packet){return;}
this.oDbg.log('async recv: '+event.data,4);this._handleEvent('packet_in',packet);if(packet.pType&&!this._handlePID(packet)){this._handleEvent(packet.pType()+'_in',packet);this._handleEvent(packet.pType(),packet);}};JSJaCWebSocketConnection.prototype._parseXml=function(s){var doc;this.oDbg.log('Parsing: '+s,4);try{doc=XmlDocument.create('stream',NS_STREAM);if(s.indexOf('<stream:stream')===-1){doc.loadXML("<stream:stream xmlns:stream='"+NS_STREAM+"' xmlns='jabber:client'>"+s+"</stream:stream>");return doc.documentElement.firstChild;}else{doc.loadXML(s);return doc.documentElement;}}catch(e){this.oDbg.log('Error: '+e);this._connected=false;this._handleEvent('onerror',JSJaCError('500','wait','internal-service-error'));}
return null;};JSJaCWebSocketConnection.prototype._getInitialRequestString=function(){var streamto,reqstr;streamto=this.domain;if(this.authhost){streamto=this.authhost;}
reqstr='<stream:stream to="'+streamto+'" xmlns="jabber:client" xmlns:stream="'+NS_STREAM+'"';if(this.authtype==='sasl'||this.authtype==='saslanon'){reqstr+=' version="1.0"';}
reqstr+='>';return reqstr;};JSJaCWebSocketConnection.prototype.send=function(packet,cb,arg){this._ws.onmessage=JSJaC.bind(this._onmessage,this);if(!packet||!packet.pType){this.oDbg.log('no packet: '+packet,1);return false;}
if(!this.connected()){return false;}
if(cb){if(!packet.getID()){packet.setID('JSJaCID_'+this._ID++);}
this._registerPID(packet.getID(),cb,arg);}
try{this._handleEvent(packet.pType()+'_out',packet);this._handleEvent('packet_out',packet);this._ws.send(packet.xml());}catch(e){this.oDbg.log(e.toString(),1);return false;}
return true;};JSJaCWebSocketConnection.prototype.resume=function(){return false;};JSJaCWebSocketConnection.prototype.suspend=function(){return false;};JSJaCWebSocketConnection.prototype._doSASLAuthDigestMd5S1=function(event){var el=this._parseXml(event.data);return JSJaC.bind(JSJaCConnection.prototype._doSASLAuthDigestMd5S1,this)(el);};JSJaCWebSocketConnection.prototype._doSASLAuthDigestMd5S2=function(event){var el=this._parseXml(event.data);return JSJaC.bind(JSJaCConnection.prototype._doSASLAuthDigestMd5S2,this)(el);};JSJaCWebSocketConnection.prototype._doSASLAuthDone=function(event){var el=this._parseXml(event.data);return JSJaC.bind(JSJaCConnection.prototype._doSASLAuthDone,this)(el);};JSJaCWebSocketConnection.prototype._reInitStream=function(cb){var reqstr,streamto=this.domain;if(this.authhost){streamto=this.authhost;}
reqstr='<stream:stream xmlns:stream="'+NS_STREAM+'" xmlns="jabber:client" to="'+streamto+'" version="1.0">';this._sendRaw(reqstr,cb);};JSJaCWebSocketConnection.prototype._sendRaw=function(xml,cb,arg){if(!this._ws){return false;}
if(cb){this._ws.onmessage=JSJaC.bind(cb,this,arg);}
this._ws.send(xml);return true;};function JSJaCFBApplication(oArg){if(oArg&&oArg.appID)
this._appID=oArg.appID;if(oArg&&oArg.apiKey)
this._apiKey=oArg.apiKey;if(oArg&&oArg.apiSecret)
this._apiSecret=oArg.apiSecret;this._perms='';this._session=undefined;};JSJaCFBApplication.prototype.Login=function(conn,oArg){var me=this;FB.init({appId:this._appID,status:true});FB.login(function(response){if(response.session){if(response.perms){me._perms=response.perms;me._session=response.session;conn.connect(oArg);}}},{perms:'xmpp_login'});};JSJaCFBApplication.prototype.getAppID=function(){return this._appID;};JSJaCFBApplication.prototype.getApiKey=function(){return this._apiKey;};JSJaCFBApplication.prototype.getApiSecret=function(){return this._apiSecret;};JSJaCFBApplication.prototype.getSession=function(){return this._session;};var JSJaC={Version:'1.4',require:function(libraryName){document.write('<script type="text/javascript" src="'+libraryName+'"></script>');},load:function(){var includes=['xmlextras','jsextras','crypt','JSJaCConfig','JSJaCConstants','JSJaCCookie','JSJaCJSON','JSJaCJID','JSJaCBuilder','JSJaCPacket','JSJaCError','JSJaCKeys','JSJaCConnection','JSJaCHttpPollingConnection','JSJaCHttpBindingConnection','JSJaCConsoleLogger','JSJaCFBApplication','JSJaCWebSocketConnection'];var scripts=document.getElementsByTagName("script");var path='./',i;for(i=0;i<scripts.length;i++){if(scripts.item(i).src&&scripts.item(i).src.match(/JSJaC\.js$/)){path=scripts.item(i).src.replace(/JSJaC.js$/,'');break;}}
for(i=0;i<includes.length;i++)
this.require(path+includes[i]+'.js');},bind:function(fn,obj,optArg){return function(arg){return fn.apply(obj,[arg,optArg]);};}};if(typeof JSJaCConnection=='undefined')
JSJaC.load();// Version: 3.5.0
(function(){
var n=null,r=!1;function t(){return function(){}}
window.JSON&&window.JSON.stringify||function(){function a(){try{return this.valueOf()}catch(a){return n}}function c(a){d.lastIndex=0;return d.test(a)?'"'+a.replace(d,function(a){var b=q[a];return"string"===typeof b?b:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function b(d,G){var h,i,l,j,m,q=e,f=G[d];f&&"object"===typeof f&&(f=a.call(f));"function"===typeof k&&(f=k.call(G,d,f));switch(typeof f){case "string":return c(f);case "number":return isFinite(f)?String(f):"null";case "boolean":case "null":return String(f);
case "object":if(!f)return"null";e+=s;m=[];if("[object Array]"===Object.prototype.toString.apply(f)){j=f.length;for(h=0;h<j;h+=1)m[h]=b(h,f)||"null";l=0===m.length?"[]":e?"[\n"+e+m.join(",\n"+e)+"\n"+q+"]":"["+m.join(",")+"]";e=q;return l}if(k&&"object"===typeof k){j=k.length;for(h=0;h<j;h+=1)i=k[h],"string"===typeof i&&(l=b(i,f))&&m.push(c(i)+(e?": ":":")+l)}else for(i in f)Object.hasOwnProperty.call(f,i)&&(l=b(i,f))&&m.push(c(i)+(e?": ":":")+l);l=0===m.length?"{}":e?"{\n"+e+m.join(",\n"+e)+"\n"+
q+"}":"{"+m.join(",")+"}";e=q;return l}}window.JSON||(window.JSON={});var d=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,e,s,q={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},k;"function"!==typeof JSON.stringify&&(JSON.stringify=function(a,c,d){var i;s=e="";if("number"===typeof d)for(i=0;i<d;i+=1)s+=" ";else"string"===typeof d&&(s=d);if((k=c)&&"function"!==typeof c&&("object"!==typeof c||"number"!==
typeof c.length))throw Error("JSON.stringify");return b("",{"":a})});"function"!==typeof JSON.parse&&(JSON.parse=function(a){return eval("("+a+")")})}();var aa=1,v=r,ba=[],w="-pnpres",z=1E3,da="/",ea="&",ha=/{([\w\-]+)}/g;function D(){return"x"+ ++aa+""+ +new Date}function F(){return+new Date}var H,ia=Math.floor(20*Math.random());H=function(a,c){return 0<a.indexOf("pubsub.")&&a.replace("pubsub","ps"+(c?ja().split("-")[0]:20>++ia?ia:ia=1))||a};
function ka(a,c){var b=a.join(da),d=[];if(!c)return b;M(c,function(a,b){d.push(a+"="+N(b))});return b+="?"+d.join(ea)}function la(a,c){function b(){e+c>F()?(clearTimeout(d),d=setTimeout(b,c)):(e=F(),a())}var d,e=0;return b}function ma(a,c){var b=[];M(a||[],function(a){c(a)&&b.push(a)});return b}function na(a,c){return a.replace(ha,function(a,d){return c[d]||a})}
function ja(a){var c="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(a){var c=16*Math.random()|0;return("x"==a?c:c&3|8).toString(16)});a&&a(c);return c}function M(a,c){if(a&&c)if("undefined"!=typeof a[0])for(var b=0,d=a.length;b<d;)c.call(a[b],a[b],b++);else for(b in a)a.hasOwnProperty&&a.hasOwnProperty(b)&&c.call(a[b],b,a[b])}function P(a,c){var b=[];M(a||[],function(a,e){b.push(c(a,e))});return b}
function N(a){return P(encodeURIComponent(a).split(""),function(a){return 0>"-_.!~*'()".indexOf(a)?a:"%"+a.charCodeAt(0).toString(16).toUpperCase()}).join("")}function oa(a){var c=[];M(a,function(a,d){d.j&&c.push(a)});return c.sort()}function pa(){setTimeout(function(){v||(v=1,M(ba,function(a){a()}))},z)}
if(!window.PUBNUB){var Q=function(a){return document.getElementById(a)},qa=function(a){console.error(a)},ra=function(a,c){var b=[];M(a.split(/\s+/),function(a){M((c||document).getElementsByTagName(a),function(a){b.push(a)})});return b},R=function(a,c,b){M(a.split(","),function(a){function e(a){a||(a=window.event);b(a)||(a.cancelBubble=!0,a.returnValue=r,a.preventDefault&&a.preventDefault(),a.stopPropagation&&a.stopPropagation())}c.addEventListener?c.addEventListener(a,e,r):c.attachEvent?c.attachEvent("on"+
a,e):c["on"+a]=e})},sa=function(){return ra("head")[0]},S=function(a,c,b){if(b)a.setAttribute(c,b);else return a&&a.getAttribute&&a.getAttribute(c)},ua=function(a,c){for(var b in c)if(c.hasOwnProperty(b))try{a.style[b]=c[b]+(0<"|width|height|top|left|".indexOf(b)&&"number"==typeof c[b]?"px":"")}catch(d){}},va=function(a){return document.createElement(a)},wa=function(){return T||U()?0:D()},ya=function(a){function c(a,b){O||(O=1,f.onerror=n,clearTimeout(u),a||!b||X(b),setTimeout(function(){a&&Y();var b=
Q(x),c=b&&b.parentNode;c&&c.removeChild(b)},z))}if(T||U()){a:{var b,d,e=function(){if(!q){q=1;clearTimeout(g);try{d=JSON.parse(b.responseText)}catch(a){return j(1)}s=1;i(d)}},s=0,q=0,k=a.timeout||1E4,g=setTimeout(function(){j(1)},k),G=a.b||t(),h=a.data||{},i=a.c||t(),l="undefined"===typeof a.g,j=function(a){s||(s=1,clearTimeout(g),b&&(b.onerror=b.onload=n,b.abort&&b.abort(),b=n),a&&G())};try{b=U()||window.XDomainRequest&&new XDomainRequest||new XMLHttpRequest;b.onerror=b.onabort=function(){j(1)};
b.onload=b.onloadend=e;l&&(b.timeout=k);h.pnsdk=xa;var m=ka(a.url,h);b.open("GET",m,l);b.send()}catch(L){j(0);T=0;a=ya(a);break a}a=j}return a}var f=va("script"),e=a.a,x=D(),O=0,u=setTimeout(function(){c(1)},a.timeout||1E4),Y=a.b||t(),k=a.data||{},X=a.c||t();window[e]=function(a){c(0,a)};a.g||(f[za]=za);f.onerror=function(){c(1)};k.pnsdk=xa;f.src=ka(a.url,k);S(f,"id",x);sa().appendChild(f);return c},Aa=function(){return!("onLine"in navigator)?1:navigator.onLine},U=function(){if(!Ba||!Ba.get)return 0;
var a={id:U.id++,send:t(),abort:function(){a.id={}},open:function(c,b){U[a.id]=a;Ba.get(a.id,b)}};return a},za="async",xa="PubNub-JS-Web/3.5.0",T=-1==navigator.userAgent.indexOf("MSIE 6");window.console||(window.console=window.console||{});console.log||(console.log=console.error=(window.opera||{}).postError||t());var Ca,V=window.localStorage;Ca={get:function(a){try{return V?V.getItem(a):-1==document.cookie.indexOf(a)?n:((document.cookie||"").match(RegExp(a+"=([^;]+)"))||[])[1]||n}catch(c){}},set:function(a,
c){try{if(V)return V.setItem(a,c)&&0;document.cookie=a+"="+c+"; expires=Thu, 1 Aug 2030 20:00:00 UTC; path=/"}catch(b){}}};var W={list:{},unbind:function(a){W.list[a]=[]},bind:function(a,c){(W.list[a]=W.list[a]||[]).push(c)},fire:function(a,c){M(W.list[a]||[],function(a){a(c)})}},Z=Q("pubnub")||0,Da=function(a){function c(){}function b(){I&&I();I=n}function d(){y.time(function(a){a||b();setTimeout(d,i)})}function e(){fa()||b();setTimeout(e,z)}function s(a){var b=0;M(oa(A),function(c){if(c=A[c])b++,
(a||t())(c)});return b}function q(a){a&&(u.h=0);!u.h&&u.length&&(u.h=1,B(u.shift()))}a.jsonp&&(T=0);var k=a.subscribe_key||"";a.uuid||Ca.get(k+"uuid");a.xdr=ya;a.db=Ca;a.error=qa;a._is_online=Aa;a.jsonp_cb=wa;var g,G=+a.windowing||10,h=(+a.timeout||310)*z,i=(+a.keepalive||3600)*z,l=a.publish_key||"",j=a.subscribe_key||"",m=a.auth_key||"",L=a.ssl?"s":"",f="http"+L+"://"+(a.origin||"pubsub.pubnub.com"),x=H(f),O=H(f),u=[],Y=0,X=0,I=0,ca=0,J=0,A={},B=a.xdr,p=a.error||t(),fa=a._is_online||function(){return 1},
E=a.jsonp_cb||function(){return 0},K=a.db||{get:t(),set:t()},C=a.uuid||K&&K.get(j+"uuid")||"",y={LEAVE:function(a,b){var c={uuid:C,auth:m},d=H(f),e=E();0<a.indexOf(w)||("0"!=e&&(c.callback=e),B({g:b||L,timeout:2E3,a:e,data:c,url:[d,"v2","presence","sub_key",j,"channel",N(a),"leave"]}))},history:function(a,b){var b=a.callback||b,c=a.count||a.limit||100,d=a.reverse||"false",e=a.error||t(),f=a.channel,g=a.start,i=a.end,h={},l=E();if(!f)return p("Missing Channel");if(!b)return p("Missing Callback");if(!j)return p("Missing Subscribe Key");
h.stringtoken="true";h.count=c;h.reverse=d;h.auth=m;l&&(h.callback=l);g&&(h.start=g);i&&(h.end=i);B({a:l,data:h,c:function(a){b(a)},b:e,url:[x,"v2","history","sub-key",j,"channel",N(f)]})},replay:function(a){var b=b||a.callback||t(),c=a.source,d=a.destination,e=a.stop,f=a.start,h=a.end,g=a.reverse,a=a.limit,i=E(),k={};if(!c)return p("Missing Source Channel");if(!d)return p("Missing Destination Channel");if(!l)return p("Missing Publish Key");if(!j)return p("Missing Subscribe Key");"0"!=i&&(k.callback=
i);e&&(k.stop="all");g&&(k.reverse="true");f&&(k.start=f);h&&(k.end=h);a&&(k.count=a);k.auth=m;B({a:i,c:function(a){b(a)},b:function(){b([0,"Disconnected"])},url:[x,"v1","replay",l,j,c,d],data:k})},auth:function(a){m=a;c()},time:function(a){var b=E();B({a:b,data:{uuid:C,auth:m},timeout:5*z,url:[x,"time",b],c:function(b){a(b[0])},b:function(){a(0)}})},publish:function(a,b){var b=b||a.callback||t(),c=a.message,d=a.channel,e=E();if(!c)return p("Missing Message");if(!d)return p("Missing Channel");if(!l)return p("Missing Publish Key");
if(!j)return p("Missing Subscribe Key");c=JSON.stringify(c);d=[x,"publish",l,j,0,N(d),e,N(c)];u.push({a:e,timeout:5*z,url:d,data:{uuid:C,auth:m},c:function(a){b(a);q(1)},b:function(){b([0,"Failed",c]);q(1)}});q()},unsubscribe:function(a){a=a.channel;J=0;ca=1;a=P((a.join?a.join(","):""+a).split(","),function(a){return a+","+a+w}).join(",");M(a.split(","),function(a){v&&y.LEAVE(a,0);A[a]=0});c()},subscribe:function(a,d){function e(a){a?setTimeout(c,z):(x=H(f,1),O=H(f,1),setTimeout(function(){y.time(e)},
z));s(function(b){if(a&&b.d)return b.d=0,b.m(b.name);!a&&!b.d&&(b.d=1,b.l(b.name))})}function i(){var a=E(),d=oa(A).join(",");d&&(b(),I=B({timeout:Fa,a:a,b:function(){I=n;y.time(e)},data:{uuid:C,auth:m},url:[O,"subscribe",j,N(d),a,J],c:function(a){I=n;if(!a)return setTimeout(c,ga);J=!J&&ca&&K.get(j)||a[1];s(function(a){a.f||(a.f=1,a.k(a.name))});ta&&(J=1E4,ta=0);K.set(j,a[1]);var b,d=(2<a.length?a[2]:P(A,function(b){return P(Array(a[0].length).join(",").split(","),function(){return b})}).join(",")).split(",");
b=function(){var a=d.shift()||X;return[(A[a]||{}).a||Y,a.split(w)[0]]};M(a[0],function(c){var d=b();d[0](c,a,d[1])});setTimeout(i,ga)}}))}var g=a.channel,d=(d=d||a.callback)||a.message,k=a.connect||t(),l=a.reconnect||t(),q=a.disconnect||t(),u=a.presence||0,L=a.noheresync||0,ta=a.backfill||0,fa=a.timetoken||0,Fa=a.timeout||h,ga=a.windowing||G;ca=a.restore;J=fa;if(!g)return p("Missing Channel");if(!d)return p("Missing Callback");if(!j)return p("Missing Subscribe Key");M((g.join?g.join(","):""+g).split(","),
function(a){var b=A[a]||{};A[X=a]={name:a,f:b.f,d:b.d,j:1,a:Y=d,k:k,l:q,m:l};u&&(y.subscribe({channel:a+w,callback:u}),!b.j&&!L&&y.here_now({channel:a,callback:function(b){M("uuids"in b?b.uuids:[],function(c){u({action:"join",uuid:c,timestamp:F(),occupancy:b.occupancy||1},b,a)})}}))});c=function(){b();setTimeout(i,ga)};if(!v)return ba.push(c);c()},here_now:function(a,b){var b=a.callback||b,c=a.error||t(),d=a.channel,e=E(),f={uuid:C,auth:m};if(!d)return p("Missing Channel");if(!b)return p("Missing Callback");
if(!j)return p("Missing Subscribe Key");"0"!=e&&(f.callback=e);B({a:e,data:f,c:function(a){b(a)},b:c,url:[x,"v2","presence","sub_key",j,"channel",N(d)]})},xdr:B,ready:pa,db:K,uuid:ja,map:P,each:M,"each-channel":s,grep:ma,offline:b,supplant:na,now:F,unique:D,updater:la};C||(C=y.uuid());K.set(j+"uuid",C);setTimeout(e,z);setTimeout(d,i);y.time(t());g=y;g.css=ua;g.$=Q;g.create=va;g.bind=R;g.head=sa;g.search=ra;g.attr=S;g.events=W;g.init=Da;R("beforeunload",window,function(){g["each-channel"](function(a){g.LEAVE(a.name,
1)});return!0});if(a.notest)return g;R("offline",window,g.offline);R("offline",document,g.offline);return g};R("load",window,function(){setTimeout(pa,0)});var $=Z||{};PUBNUB=Da({notest:1,publish_key:S($,"pub-key"),subscribe_key:S($,"sub-key"),ssl:!document.location.href.indexOf("https")||"on"==S($,"ssl"),origin:S($,"origin"),uuid:S($,"uuid")});window.jQuery&&(window.jQuery.PUBNUB=PUBNUB);"undefined"!==typeof module&&(module.exports=PUBNUB)&&pa();var Ba=Q("pubnubs")||0;if(Z){ua(Z,{position:"absolute",
top:-z});if("opera"in window||S(Z,"flash"))Z.innerHTML="<object id=pubnubs data=https://pubnub.a.ssl.fastly.net/pubnub.swf><param name=movie value=https://pubnub.a.ssl.fastly.net/pubnub.swf><param name=allowscriptaccess value=always></object>";PUBNUB.rdx=function(a,c){if(!c)return U[a].onerror();U[a].responseText=unescape(c);U[a].onload()};U.id=z}}
var Ea=PUBNUB.ws=function(a,c){if(!(this instanceof Ea))return new Ea(a,c);var b=this,a=b.url=a||"";b.protocol=c||"Sec-WebSocket-Protocol";var d=a.split("/"),d={ssl:"wss:"===d[0],origin:d[2],publish_key:d[3],subscribe_key:d[4],channel:d[5]};b.CONNECTING=0;b.OPEN=1;b.CLOSING=2;b.CLOSED=3;b.CLOSE_NORMAL=1E3;b.CLOSE_GOING_AWAY=1001;b.CLOSE_PROTOCOL_ERROR=1002;b.CLOSE_UNSUPPORTED=1003;b.CLOSE_TOO_LARGE=1004;b.CLOSE_NO_STATUS=1005;b.CLOSE_ABNORMAL=1006;b.onclose=b.onerror=b.onmessage=b.onopen=b.onsend=
t();b.binaryType="";b.extensions="";b.bufferedAmount=0;b.trasnmitting=r;b.buffer=[];b.readyState=b.CONNECTING;if(!a)return b.readyState=b.CLOSED,b.onclose({code:b.CLOSE_ABNORMAL,reason:"Missing URL",wasClean:!0}),b;b.e=PUBNUB.init(d);b.e.i=d;b.i=d;b.e.subscribe({restore:r,channel:d.channel,disconnect:b.onerror,reconnect:b.onopen,error:function(){b.onclose({code:b.CLOSE_ABNORMAL,reason:"Missing URL",wasClean:r})},callback:function(a){b.onmessage({data:a})},connect:function(){b.readyState=b.OPEN;b.onopen()}})};
Ea.prototype.send=function(a){var c=this;c.e.publish({channel:c.e.i.channel,message:a,callback:function(a){c.onsend({data:a})}})};
})();
/*!
 * Pusher JavaScript Library v2.0.5
 * http://pusherapp.com/
 *
 * Copyright 2013, Pusher
 * Released under the MIT licence.
 */

(function(){function b(a,h){var e=this;this.options=h||{};this.key=a;this.channels=new b.Channels;this.global_emitter=new b.EventsDispatcher;this.sessionID=Math.floor(Math.random()*1E9);c(this.key);this.connection=new b.ConnectionManager(this.key,b.Util.extend({getStrategy:function(a){return b.StrategyBuilder.build(b.getDefaultStrategy(),b.Util.extend({},e.options,a))},getTimeline:function(){return new b.Timeline(e.key,e.sessionID,{features:b.Util.getClientFeatures(),params:e.options.timelineParams||
{},limit:50,level:b.Timeline.INFO,version:b.VERSION})},getTimelineSender:function(a,d){return e.options.disableStats?null:new b.TimelineSender(a,{encrypted:e.isEncrypted()||!!d.encrypted,host:b.stats_host,path:"/timeline"})},activityTimeout:b.activity_timeout,pongTimeout:b.pong_timeout,unavailableTimeout:b.unavailable_timeout},this.options,{encrypted:this.isEncrypted()}));this.connection.bind("connected",function(){e.subscribeAll()});this.connection.bind("message",function(a){var d=a.event.indexOf("pusher_internal:")===
0;if(a.channel){var b=e.channel(a.channel);b&&b.emit(a.event,a.data)}d||e.global_emitter.emit(a.event,a.data)});this.connection.bind("disconnected",function(){e.channels.disconnect()});this.connection.bind("error",function(a){b.warn("Error",a)});b.instances.push(this);b.isReady&&e.connect()}function c(a){(a===null||a===void 0)&&b.warn("Warning","You must pass your app key when you instantiate Pusher.")}var a=b.prototype;b.instances=[];b.isReady=!1;b.debug=function(){b.log&&b.log(b.Util.stringify.apply(this,
arguments))};b.warn=function(){var a=b.Util.stringify.apply(this,arguments);window.console&&(window.console.warn?window.console.warn(a):window.console.log&&window.console.log(a));b.log&&b.log(a)};b.ready=function(){b.isReady=!0;for(var a=0,c=b.instances.length;a<c;a++)b.instances[a].connect()};a.channel=function(a){return this.channels.find(a)};a.connect=function(){this.connection.connect()};a.disconnect=function(){this.connection.disconnect()};a.bind=function(a,b){this.global_emitter.bind(a,b);return this};
a.bind_all=function(a){this.global_emitter.bind_all(a);return this};a.subscribeAll=function(){for(var a in this.channels.channels)this.channels.channels.hasOwnProperty(a)&&this.subscribe(a)};a.subscribe=function(a){var b=this,c=this.channels.add(a,this);this.connection.state==="connected"&&c.authorize(this.connection.socket_id,this.options,function(f,g){f?c.emit("pusher:subscription_error",g):b.send_event("pusher:subscribe",{channel:a,auth:g.auth,channel_data:g.channel_data})});return c};a.unsubscribe=
function(a){this.channels.remove(a);this.connection.state==="connected"&&this.send_event("pusher:unsubscribe",{channel:a})};a.send_event=function(a,b,c){return this.connection.send_event(a,b,c)};a.isEncrypted=function(){return b.Util.getDocumentLocation().protocol==="https:"?!0:!!this.options.encrypted};this.Pusher=b}).call(this);
(function(){Pusher.Util={now:function(){return Date.now?Date.now():(new Date).valueOf()},extend:function(b){for(var c=1;c<arguments.length;c++){var a=arguments[c],d;for(d in a)b[d]=a[d]&&a[d].constructor&&a[d].constructor===Object?Pusher.Util.extend(b[d]||{},a[d]):a[d]}return b},stringify:function(){for(var b=["Pusher"],c=0;c<arguments.length;c++)typeof arguments[c]==="string"?b.push(arguments[c]):window.JSON===void 0?b.push(arguments[c].toString()):b.push(JSON.stringify(arguments[c]));return b.join(" : ")},
arrayIndexOf:function(b,c){var a=Array.prototype.indexOf;if(b===null)return-1;if(a&&b.indexOf===a)return b.indexOf(c);for(var a=0,d=b.length;a<d;a++)if(b[a]===c)return a;return-1},keys:function(b){var c=[],a;for(a in b)Object.prototype.hasOwnProperty.call(b,a)&&c.push(a);return c},apply:function(b,c){for(var a=0;a<b.length;a++)c(b[a],a,b)},objectApply:function(b,c){for(var a in b)Object.prototype.hasOwnProperty.call(b,a)&&c(b[a],a,b)},map:function(b,c){for(var a=[],d=0;d<b.length;d++)a.push(c(b[d],
d,b,a));return a},mapObject:function(b,c){var a={},d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(a[d]=c(b[d]));return a},filter:function(b,c){for(var c=c||function(a){return!!a},a=[],d=0;d<b.length;d++)c(b[d],d,b,a)&&a.push(b[d]);return a},filterObject:function(b,c){var c=c||function(a){return!!a},a={},d;for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&c(b[d],d,b,a)&&(a[d]=b[d]);return a},flatten:function(b){var c=[],a;for(a in b)Object.prototype.hasOwnProperty.call(b,a)&&c.push([a,
b[a]]);return c},any:function(b,c){for(var a=0;a<b.length;a++)if(c(b[a],a,b))return!0;return!1},all:function(b,c){for(var a=0;a<b.length;a++)if(!c(b[a],a,b))return!1;return!0},method:function(b){var c=Array.prototype.slice.call(arguments,1);return function(a){return a[b].apply(a,c.concat(arguments))}},getDocument:function(){return document},getDocumentLocation:function(){return Pusher.Util.getDocument().location},getLocalStorage:function(){return window.localStorage},getClientFeatures:function(){return Pusher.Util.keys(Pusher.Util.filterObject({ws:Pusher.WSTransport,
flash:Pusher.FlashTransport},function(b){return b.isSupported()}))}}}).call(this);
(function(){Pusher.VERSION="2.0.5";Pusher.PROTOCOL=6;Pusher.host="ws.pusherapp.com";Pusher.ws_port=80;Pusher.wss_port=443;Pusher.sockjs_host="sockjs.pusher.com";Pusher.sockjs_http_port=80;Pusher.sockjs_https_port=443;Pusher.sockjs_path="/pusher";Pusher.stats_host="stats.pusher.com";Pusher.channel_auth_endpoint="/pusher/auth";Pusher.cdn_http="http://js.pusher.com/";Pusher.cdn_https="https://d3dy5gmtp8yhk7.cloudfront.net/";Pusher.dependency_suffix=".min";Pusher.channel_auth_transport="ajax";Pusher.activity_timeout=
12E4;Pusher.pong_timeout=3E4;Pusher.unavailable_timeout=1E4;Pusher.getDefaultStrategy=function(){return[[":def","ws_options",{hostUnencrypted:Pusher.host+":"+Pusher.ws_port,hostEncrypted:Pusher.host+":"+Pusher.wss_port}],[":def","sockjs_options",{hostUnencrypted:Pusher.sockjs_host+":"+Pusher.sockjs_http_port,hostEncrypted:Pusher.sockjs_host+":"+Pusher.sockjs_https_port}],[":def","timeouts",{loop:!0,timeout:15E3,timeoutLimit:6E4}],[":def","ws_manager",[":transport_manager",{lives:2}]],[":def_transport",
"ws","ws",3,":ws_options",":ws_manager"],[":def_transport","flash","flash",2,":ws_options",":ws_manager"],[":def_transport","sockjs","sockjs",1,":sockjs_options"],[":def","ws_loop",[":sequential",":timeouts",":ws"]],[":def","flash_loop",[":sequential",":timeouts",":flash"]],[":def","sockjs_loop",[":sequential",":timeouts",":sockjs"]],[":def","strategy",[":cached",18E5,[":first_connected",[":if",[":is_supported",":ws"],[":best_connected_ever",":ws_loop",[":delayed",2E3,[":sockjs_loop"]]],[":if",[":is_supported",
":flash"],[":best_connected_ever",":flash_loop",[":delayed",2E3,[":sockjs_loop"]]],[":sockjs_loop"]]]]]]]}}).call(this);(function(){function b(b){var a=function(a){Error.call(this,a);this.name=b};Pusher.Util.extend(a.prototype,Error.prototype);return a}Pusher.Errors={UnsupportedTransport:b("UnsupportedTransport"),UnsupportedStrategy:b("UnsupportedStrategy"),TransportPriorityTooLow:b("TransportPriorityTooLow"),TransportClosed:b("TransportClosed")}}).call(this);
(function(){function b(a){this.callbacks=new c;this.global_callbacks=[];this.failThrough=a}function c(){this._callbacks={}}var a=b.prototype;a.bind=function(a,b){this.callbacks.add(a,b);return this};a.bind_all=function(a){this.global_callbacks.push(a);return this};a.unbind=function(a,b){this.callbacks.remove(a,b);return this};a.emit=function(a,b){var c;for(c=0;c<this.global_callbacks.length;c++)this.global_callbacks[c](a,b);var f=this.callbacks.get(a);if(f&&f.length>0)for(c=0;c<f.length;c++)f[c](b);
else this.failThrough&&this.failThrough(a,b);return this};c.prototype.get=function(a){return this._callbacks[this._prefix(a)]};c.prototype.add=function(a,b){var c=this._prefix(a);this._callbacks[c]=this._callbacks[c]||[];this._callbacks[c].push(b)};c.prototype.remove=function(a,b){if(this.get(a)){var c=Pusher.Util.arrayIndexOf(this.get(a),b);if(c!==-1){var f=this._callbacks[this._prefix(a)].slice(0);f.splice(c,1);this._callbacks[this._prefix(a)]=f}}};c.prototype._prefix=function(a){return"_"+a};Pusher.EventsDispatcher=
b}).call(this);
(function(){function b(a){this.options=a;this.loading={};this.loaded={}}function c(a,d){Pusher.Util.getDocument().addEventListener?a.addEventListener("load",d,!1):a.attachEvent("onreadystatechange",function(){(a.readyState==="loaded"||a.readyState==="complete")&&d()})}function a(a,d){var b=Pusher.Util.getDocument(),g=b.getElementsByTagName("head")[0],b=b.createElement("script");b.setAttribute("src",a);b.setAttribute("type","text/javascript");b.setAttribute("async",!0);c(b,function(){setTimeout(d,0)});
g.appendChild(b)}var d=b.prototype;d.load=function(d,b){var c=this;this.loaded[d]?b():(this.loading[d]||(this.loading[d]=[]),this.loading[d].push(b),this.loading[d].length>1||a(this.getPath(d),function(){for(var a=0;a<c.loading[d].length;a++)c.loading[d][a]();delete c.loading[d];c.loaded[d]=!0}))};d.getRoot=function(a){var d=Pusher.Util.getDocumentLocation().protocol;return(a&&a.encrypted||d==="https:"?this.options.cdn_https:this.options.cdn_http).replace(/\/*$/,"")+"/"+this.options.version};d.getPath=
function(a,d){return this.getRoot(d)+"/"+a+this.options.suffix+".js"};Pusher.DependencyLoader=b}).call(this);
(function(){function b(){Pusher.ready()}function c(a){document.body?a():setTimeout(function(){c(a)},0)}function a(){c(b)}Pusher.Dependencies=new Pusher.DependencyLoader({cdn_http:Pusher.cdn_http,cdn_https:Pusher.cdn_https,version:Pusher.VERSION,suffix:Pusher.dependency_suffix});if(!window.WebSocket&&window.MozWebSocket)window.WebSocket=window.MozWebSocket;window.JSON?a():Pusher.Dependencies.load("json2",a)})();
(function(){function b(a,d){var b=this;this.timeout=setTimeout(function(){if(b.timeout!==null)d(),b.timeout=null},a)}var c=b.prototype;c.isRunning=function(){return this.timeout!==null};c.ensureAborted=function(){if(this.timeout)clearTimeout(this.timeout),this.timeout=null};Pusher.Timer=b}).call(this);
(function(){for(var b=String.fromCharCode,c=0;c<64;c++)"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(c);var a=function(a){var d=a.charCodeAt(0);return d<128?a:d<2048?b(192|d>>>6)+b(128|d&63):b(224|d>>>12&15)+b(128|d>>>6&63)+b(128|d&63)},d=function(a){var d=[0,2,1][a.length%3],a=a.charCodeAt(0)<<16|(a.length>1?a.charCodeAt(1):0)<<8|(a.length>2?a.charCodeAt(2):0);return["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a>>>18),"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a>>>
12&63),d>=2?"=":"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a>>>6&63),d>=1?"=":"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(a&63)].join("")},h=window.btoa||function(a){return a.replace(/[\s\S]{1,3}/g,d)};Pusher.Base64={encode:function(d){return h(d.replace(/[^\x00-\x7F]/g,a))}}}).call(this);
(function(){function b(a){this.options=a}function c(a){return Pusher.Util.mapObject(a,function(a){typeof a==="object"&&(a=JSON.stringify(a));return encodeURIComponent(Pusher.Base64.encode(a.toString()))})}b.send=function(a,b){var c=new Pusher.JSONPRequest({url:a.url,receiver:a.receiverName,tagPrefix:a.tagPrefix}),f=a.receiver.register(function(a,d){c.cleanup();b(a,d)});return c.send(f,a.data,function(b){var c=a.receiver.unregister(f);c&&c(b)})};var a=b.prototype;a.send=function(a,b,e){if(this.script)return!1;
var f=this.options.tagPrefix||"_pusher_jsonp_",b=Pusher.Util.extend({},b,{receiver:this.options.receiver}),b=Pusher.Util.map(Pusher.Util.flatten(c(Pusher.Util.filterObject(b,function(a){return a!==void 0}))),Pusher.Util.method("join","=")).join("&");this.script=document.createElement("script");this.script.id=f+a;this.script.src=this.options.url+"/"+a+"?"+b;this.script.type="text/javascript";this.script.charset="UTF-8";this.script.onerror=this.script.onload=e;if(this.script.async===void 0&&document.attachEvent&&
/opera/i.test(navigator.userAgent))f=this.options.receiver||"Pusher.JSONP.receive",this.errorScript=document.createElement("script"),this.errorScript.text=f+"("+a+", true);",this.script.async=this.errorScript.async=!1;var g=this;this.script.onreadystatechange=function(){g.script&&/loaded|complete/.test(g.script.readyState)&&e(!0)};a=document.getElementsByTagName("head")[0];a.insertBefore(this.script,a.firstChild);this.errorScript&&a.insertBefore(this.errorScript,this.script.nextSibling);return!0};
a.cleanup=function(){if(this.script&&this.script.parentNode)this.script.parentNode.removeChild(this.script),this.script=null;if(this.errorScript&&this.errorScript.parentNode)this.errorScript.parentNode.removeChild(this.errorScript),this.errorScript=null};Pusher.JSONPRequest=b}).call(this);
(function(){function b(){this.lastId=0;this.callbacks={}}var c=b.prototype;c.register=function(a){this.lastId++;var d=this.lastId;this.callbacks[d]=a;return d};c.unregister=function(a){if(this.callbacks[a]){var d=this.callbacks[a];delete this.callbacks[a];return d}else return null};c.receive=function(a,d,b){(a=this.unregister(a))&&a(d,b)};Pusher.JSONPReceiver=b;Pusher.JSONP=new b}).call(this);
(function(){function b(a,b,c){this.key=a;this.session=b;this.events=[];this.options=c||{};this.uniqueID=this.sent=0}var c=b.prototype;b.ERROR=3;b.INFO=6;b.DEBUG=7;c.log=function(a,b){if(this.options.level===void 0||a<=this.options.level)this.events.push(Pusher.Util.extend({},b,{timestamp:Pusher.Util.now(),level:a})),this.options.limit&&this.events.length>this.options.limit&&this.events.shift()};c.error=function(a){this.log(b.ERROR,a)};c.info=function(a){this.log(b.INFO,a)};c.debug=function(a){this.log(b.DEBUG,
a)};c.isEmpty=function(){return this.events.length===0};c.send=function(a,b){var c=this,e={};this.sent===0&&(e=Pusher.Util.extend({key:this.key,features:this.options.features,version:this.options.version},this.options.params||{}));e.session=this.session;e.timeline=this.events;e=Pusher.Util.filterObject(e,function(a){return a!==void 0});this.events=[];a(e,function(a,e){a||c.sent++;b(a,e)});return!0};c.generateUniqueID=function(){this.uniqueID++;return this.uniqueID};Pusher.Timeline=b}).call(this);
(function(){function b(a,b){this.timeline=a;this.options=b||{}}var c=b.prototype;c.send=function(a){if(!this.timeline.isEmpty()){var b=this.options,c="http"+(this.isEncrypted()?"s":"")+"://";this.timeline.send(function(a,f){return Pusher.JSONPRequest.send({data:a,url:c+b.host+b.path,receiver:Pusher.JSONP},f)},a)}};c.isEncrypted=function(){return!!this.options.encrypted};Pusher.TimelineSender=b}).call(this);
(function(){function b(a){this.strategies=a}function c(a,b,c){var h=Pusher.Util.map(a,function(a,d,h,e){return a.connect(b,c(d,e))});return{abort:function(){Pusher.Util.apply(h,d)},forceMinPriority:function(a){Pusher.Util.apply(h,function(b){b.forceMinPriority(a)})}}}function a(a){return Pusher.Util.all(a,function(a){return Boolean(a.error)})}function d(a){if(!a.error&&!a.aborted)a.abort(),a.aborted=!0}var h=b.prototype;h.isSupported=function(){return Pusher.Util.any(this.strategies,Pusher.Util.method("isSupported"))};
h.connect=function(b,d){return c(this.strategies,b,function(b,c){return function(h,e){(c[b].error=h)?a(c)&&d(!0):(Pusher.Util.apply(c,function(a){a.forceMinPriority(e.transport.priority)}),d(null,e))}})};Pusher.BestConnectedEverStrategy=b}).call(this);
(function(){function b(a,b,c){this.strategy=a;this.transports=b;this.ttl=c.ttl||18E5;this.timeline=c.timeline}function c(){var a=Pusher.Util.getLocalStorage();return a&&a.pusherTransport?JSON.parse(a.pusherTransport):null}var a=b.prototype;a.isSupported=function(){return this.strategy.isSupported()};a.connect=function(a,b){var e=c(),f=[this.strategy];if(e&&e.timestamp+this.ttl>=Pusher.Util.now()){var g=this.transports[e.transport];g&&(this.timeline.info({cached:!0,transport:e.transport}),f.push(new Pusher.SequentialStrategy([g],
{timeout:e.latency*2,failFast:!0})))}var i=Pusher.Util.now(),j=f.pop().connect(a,function k(c,e){if(c){var g=Pusher.Util.getLocalStorage();if(g&&g.pusherTransport)try{delete g.pusherTransport}catch(q){g.pusherTransport=void 0}f.length>0?(i=Pusher.Util.now(),j=f.pop().connect(a,k)):b(c)}else{var g=Pusher.Util.now()-i,p=e.transport.name,o=Pusher.Util.getLocalStorage();if(o)try{o.pusherTransport=JSON.stringify({timestamp:Pusher.Util.now(),transport:p,latency:g})}catch(r){}b(null,e)}});return{abort:function(){j.abort()},
forceMinPriority:function(b){a=b;j&&j.forceMinPriority(b)}}};Pusher.CachedStrategy=b}).call(this);
(function(){function b(a,b){this.strategy=a;this.options={delay:b.delay}}var c=b.prototype;c.isSupported=function(){return this.strategy.isSupported()};c.connect=function(a,b){var c=this.strategy,e,f=new Pusher.Timer(this.options.delay,function(){e=c.connect(a,b)});return{abort:function(){f.ensureAborted();e&&e.abort()},forceMinPriority:function(b){a=b;e&&e.forceMinPriority(b)}}};Pusher.DelayedStrategy=b}).call(this);
(function(){function b(a){this.strategy=a}var c=b.prototype;c.isSupported=function(){return this.strategy.isSupported()};c.connect=function(a,b){var c=this.strategy.connect(a,function(a,f){f&&c.abort();b(a,f)});return c};Pusher.FirstConnectedStrategy=b}).call(this);
(function(){function b(a,b,c){this.test=a;this.trueBranch=b;this.falseBranch=c}var c=b.prototype;c.isSupported=function(){return(this.test()?this.trueBranch:this.falseBranch).isSupported()};c.connect=function(a,b){return(this.test()?this.trueBranch:this.falseBranch).connect(a,b)};Pusher.IfStrategy=b}).call(this);
(function(){function b(a,b){this.strategies=a;this.loop=Boolean(b.loop);this.failFast=Boolean(b.failFast);this.timeout=b.timeout;this.timeoutLimit=b.timeoutLimit}var c=b.prototype;c.isSupported=function(){return Pusher.Util.any(this.strategies,Pusher.Util.method("isSupported"))};c.connect=function(a,b){var c=this,e=this.strategies,f=0,g=this.timeout,i=null,j=function(m,k){k?b(null,k):(f+=1,c.loop&&(f%=e.length),f<e.length?(g&&(g*=2,c.timeoutLimit&&(g=Math.min(g,c.timeoutLimit))),i=c.tryStrategy(e[f],
a,{timeout:g,failFast:c.failFast},j)):b(!0))},i=this.tryStrategy(e[f],a,{timeout:g,failFast:this.failFast},j);return{abort:function(){i.abort()},forceMinPriority:function(b){a=b;i&&i.forceMinPriority(b)}}};c.tryStrategy=function(a,b,c,e){var f=null,g=null,g=a.connect(b,function(a,b){if(!a||!f||!f.isRunning()||c.failFast)f&&f.ensureAborted(),e(a,b)});c.timeout>0&&(f=new Pusher.Timer(c.timeout,function(){g.abort();e(!0)}));return{abort:function(){f&&f.ensureAborted();g.abort()},forceMinPriority:function(a){g.forceMinPriority(a)}}};
Pusher.SequentialStrategy=b}).call(this);
(function(){function b(a,b,c,f){this.name=a;this.priority=b;this.transport=c;this.options=f||{}}function c(a,b){new Pusher.Timer(0,function(){b(a)});return{abort:function(){},forceMinPriority:function(){}}}var a=b.prototype;a.isSupported=function(){return this.transport.isSupported({disableFlash:!!this.options.disableFlash})};a.connect=function(a,b){if(this.transport.isSupported()){if(this.priority<a)return c(new Pusher.Errors.TransportPriorityTooLow,b)}else return c(new Pusher.Errors.UnsupportedStrategy,b);
var e=this,f=!1,g=this.transport.createConnection(this.name,this.priority,this.options.key,this.options),i=null,j=function(){g.unbind("initialized",j);g.connect()},m=function(){i=new Pusher.Handshake(g,function(a){f=!0;n();b(null,a)})},k=function(a){n();b(a)},l=function(){n();b(new Pusher.Errors.TransportClosed(g))},n=function(){g.unbind("initialized",j);g.unbind("open",m);g.unbind("error",k);g.unbind("closed",l)};g.bind("initialized",j);g.bind("open",m);g.bind("error",k);g.bind("closed",l);g.initialize();
return{abort:function(){f||(n(),i?i.close():g.close())},forceMinPriority:function(a){f||e.priority<a&&(i?i.close():g.close())}}};Pusher.TransportStrategy=b}).call(this);
(function(){function b(a,b,c,f){Pusher.EventsDispatcher.call(this);this.name=a;this.priority=b;this.key=c;this.state="new";this.timeline=f.timeline;this.id=this.timeline.generateUniqueID();this.options={encrypted:Boolean(f.encrypted),hostUnencrypted:f.hostUnencrypted,hostEncrypted:f.hostEncrypted}}function c(a){return typeof a==="string"?a:typeof a==="object"?Pusher.Util.mapObject(a,function(a){var b=typeof a;return b==="object"||b=="function"?b:a}):typeof a}var a=b.prototype;Pusher.Util.extend(a,
Pusher.EventsDispatcher.prototype);b.isSupported=function(){return!1};a.supportsPing=function(){return!1};a.initialize=function(){this.timeline.info(this.buildTimelineMessage({transport:this.name+(this.options.encrypted?"s":"")}));this.timeline.debug(this.buildTimelineMessage({method:"initialize"}));this.changeState("initialized")};a.connect=function(){var a=this.getURL(this.key,this.options);this.timeline.debug(this.buildTimelineMessage({method:"connect",url:a}));if(this.socket||this.state!=="initialized")return!1;
try{this.socket=this.createSocket(a)}catch(b){var c=this;new Pusher.Timer(0,function(){c.onError(b);c.changeState("closed")});return!1}this.bindListeners();Pusher.debug("Connecting",{transport:this.name,url:a});this.changeState("connecting");return!0};a.close=function(){this.timeline.debug(this.buildTimelineMessage({method:"close"}));return this.socket?(this.socket.close(),!0):!1};a.send=function(a){this.timeline.debug(this.buildTimelineMessage({method:"send",data:a}));if(this.state==="open"){var b=
this;setTimeout(function(){b.socket.send(a)},0);return!0}else return!1};a.requestPing=function(){this.emit("ping_request")};a.onOpen=function(){this.changeState("open");this.socket.onopen=void 0};a.onError=function(a){this.emit("error",{type:"WebSocketError",error:a});this.timeline.error(this.buildTimelineMessage({error:c(a)}))};a.onClose=function(a){this.changeState("closed",a);this.socket=void 0};a.onMessage=function(a){this.timeline.debug(this.buildTimelineMessage({message:a.data}));this.emit("message",
a)};a.bindListeners=function(){var a=this;this.socket.onopen=function(){a.onOpen()};this.socket.onerror=function(b){a.onError(b)};this.socket.onclose=function(b){a.onClose(b)};this.socket.onmessage=function(b){a.onMessage(b)}};a.createSocket=function(){return null};a.getScheme=function(){return this.options.encrypted?"wss":"ws"};a.getBaseURL=function(){var a;a=this.options.encrypted?this.options.hostEncrypted:this.options.hostUnencrypted;return this.getScheme()+"://"+a};a.getPath=function(){return"/app/"+
this.key};a.getQueryString=function(){return"?protocol="+Pusher.PROTOCOL+"&client=js&version="+Pusher.VERSION};a.getURL=function(){return this.getBaseURL()+this.getPath()+this.getQueryString()};a.changeState=function(a,b){this.state=a;this.timeline.info(this.buildTimelineMessage({state:a,params:b}));this.emit(a,b)};a.buildTimelineMessage=function(a){return Pusher.Util.extend({cid:this.id},a)};Pusher.AbstractTransport=b}).call(this);
(function(){function b(a,b,c,e){Pusher.AbstractTransport.call(this,a,b,c,e)}var c=b.prototype;Pusher.Util.extend(c,Pusher.AbstractTransport.prototype);b.createConnection=function(a,c,h,e){return new b(a,c,h,e)};b.isSupported=function(a){if(a&&a.disableFlash)return!1;try{return Boolean(new ActiveXObject("ShockwaveFlash.ShockwaveFlash"))}catch(b){return Boolean(navigator&&navigator.mimeTypes&&navigator.mimeTypes["application/x-shockwave-flash"]!==void 0)}};c.initialize=function(){var a=this;this.timeline.info(this.buildTimelineMessage({transport:this.name+
(this.options.encrypted?"s":"")}));this.timeline.debug(this.buildTimelineMessage({method:"initialize"}));this.changeState("initializing");if(window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR===void 0)window.WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR=!0;window.WEB_SOCKET_SWF_LOCATION=Pusher.Dependencies.getRoot()+"/WebSocketMain.swf";Pusher.Dependencies.load("flashfallback",function(){a.changeState("initialized")})};c.createSocket=function(a){return new FlashWebSocket(a)};c.getQueryString=function(){return Pusher.AbstractTransport.prototype.getQueryString.call(this)+
"&flash=true"};Pusher.FlashTransport=b}).call(this);
(function(){function b(a,b,c,e){Pusher.AbstractTransport.call(this,a,b,c,e);this.options.ignoreNullOrigin=e.ignoreNullOrigin}var c=b.prototype;Pusher.Util.extend(c,Pusher.AbstractTransport.prototype);b.createConnection=function(a,c,h,e){return new b(a,c,h,e)};b.isSupported=function(){return!0};c.initialize=function(){var a=this;this.timeline.info(this.buildTimelineMessage({transport:this.name+(this.options.encrypted?"s":"")}));this.timeline.debug(this.buildTimelineMessage({method:"initialize"}));this.changeState("initializing");
Pusher.Dependencies.load("sockjs",function(){a.changeState("initialized")})};c.supportsPing=function(){return!0};c.createSocket=function(a){return new SockJS(a,null,{js_path:Pusher.Dependencies.getPath("sockjs",{encrypted:this.options.encrypted}),ignore_null_origin:this.options.ignoreNullOrigin})};c.getScheme=function(){return this.options.encrypted?"https":"http"};c.getPath=function(){return"/pusher"};c.getQueryString=function(){return""};c.onOpen=function(){this.socket.send(JSON.stringify({path:Pusher.AbstractTransport.prototype.getPath.call(this)+
Pusher.AbstractTransport.prototype.getQueryString.call(this)}));this.changeState("open");this.socket.onopen=void 0};Pusher.SockJSTransport=b}).call(this);
(function(){function b(a,b,c,e){Pusher.AbstractTransport.call(this,a,b,c,e)}var c=b.prototype;Pusher.Util.extend(c,Pusher.AbstractTransport.prototype);b.createConnection=function(a,c,h,e){return new b(a,c,h,e)};b.isSupported=function(){return window.WebSocket!==void 0||window.MozWebSocket!==void 0};c.createSocket=function(a){return new (window.WebSocket||window.MozWebSocket)(a)};c.getQueryString=function(){return Pusher.AbstractTransport.prototype.getQueryString.call(this)+"&flash=false"};Pusher.WSTransport=
b}).call(this);
(function(){function b(a,b,c){this.manager=a;this.transport=b;this.minPingDelay=c.minPingDelay||1E4;this.maxPingDelay=c.maxPingDelay||Pusher.activity_timeout;this.pingDelay=null}var c=b.prototype;c.createConnection=function(a,b,c,e){var f=this.transport.createConnection(a,b,c,e),g=this,i=null,j=null,m=function(){f.unbind("open",m);i=Pusher.Util.now();g.pingDelay&&(j=setInterval(function(){j&&f.requestPing()},g.pingDelay));f.bind("closed",k)},k=function(a){f.unbind("closed",k);j&&(clearInterval(j),j=
null);if(!a.wasClean&&i&&(a=Pusher.Util.now()-i,a<2*g.maxPingDelay))g.manager.reportDeath(),g.pingDelay=Math.max(a/2,g.minPingDelay)};f.bind("open",m);return f};c.isSupported=function(a){return this.manager.isAlive()&&this.transport.isSupported(a)};Pusher.AssistantToTheTransportManager=b}).call(this);
(function(){function b(a){this.options=a||{};this.livesLeft=this.options.lives||Infinity}var c=b.prototype;c.getAssistant=function(a){return new Pusher.AssistantToTheTransportManager(this,a,{minPingDelay:this.options.minPingDelay,maxPingDelay:this.options.maxPingDelay})};c.isAlive=function(){return this.livesLeft>0};c.reportDeath=function(){this.livesLeft-=1};Pusher.TransportManager=b}).call(this);
(function(){function b(a){return function(b){return[a.apply(this,arguments),b]}}function c(a,b){if(a.length===0)return[[],b];var e=d(a[0],b),h=c(a.slice(1),e[1]);return[[e[0]].concat(h[0]),h[1]]}function a(a,b){if(typeof a[0]==="string"&&a[0].charAt(0)===":"){var e=b[a[0].slice(1)];if(a.length>1){if(typeof e!=="function")throw"Calling non-function "+a[0];var h=[Pusher.Util.extend({},b)].concat(Pusher.Util.map(a.slice(1),function(a){return d(a,Pusher.Util.extend({},b))[0]}));return e.apply(this,h)}else return[e,
b]}else return c(a,b)}function d(b,c){if(typeof b==="string"){var d;if(typeof b==="string"&&b.charAt(0)===":"){d=c[b.slice(1)];if(d===void 0)throw"Undefined symbol "+b;d=[d,c]}else d=[b,c];return d}else if(typeof b==="object"&&b instanceof Array&&b.length>0)return a(b,c);return[b,c]}var h={ws:Pusher.WSTransport,flash:Pusher.FlashTransport,sockjs:Pusher.SockJSTransport},e={def:function(a,b,c){if(a[b]!==void 0)throw"Redefining symbol "+b;a[b]=c;return[void 0,a]},def_transport:function(a,b,c,d,e,k){var l=
h[c];if(!l)throw new Pusher.Errors.UnsupportedTransport(c);c=Pusher.Util.extend({},{key:a.key,encrypted:a.encrypted,timeline:a.timeline,disableFlash:a.disableFlash,ignoreNullOrigin:a.ignoreNullOrigin},e);k&&(l=k.getAssistant(l));d=new Pusher.TransportStrategy(b,d,l,c);k=a.def(a,b,d)[1];k.transports=a.transports||{};k.transports[b]=d;return[void 0,k]},transport_manager:b(function(a,b){return new Pusher.TransportManager(b)}),sequential:b(function(a,b){var c=Array.prototype.slice.call(arguments,2);return new Pusher.SequentialStrategy(c,
b)}),cached:b(function(a,b,c){return new Pusher.CachedStrategy(c,a.transports,{ttl:b,timeline:a.timeline})}),first_connected:b(function(a,b){return new Pusher.FirstConnectedStrategy(b)}),best_connected_ever:b(function(){var a=Array.prototype.slice.call(arguments,1);return new Pusher.BestConnectedEverStrategy(a)}),delayed:b(function(a,b,c){return new Pusher.DelayedStrategy(c,{delay:b})}),"if":b(function(a,b,c,d){return new Pusher.IfStrategy(b,c,d)}),is_supported:b(function(a,b){return function(){return b.isSupported()}})};
Pusher.StrategyBuilder={build:function(a,b){var c=Pusher.Util.extend({},e,b);return d(a,c)[1].strategy}}}).call(this);
(function(){Protocol={decodeMessage:function(b){try{var c=JSON.parse(b.data);if(typeof c.data==="string")try{c.data=JSON.parse(c.data)}catch(a){if(!(a instanceof SyntaxError))throw a;}return c}catch(d){throw{type:"MessageParseError",error:d,data:b.data};}},encodeMessage:function(b){return JSON.stringify(b)},processHandshake:function(b){b=this.decodeMessage(b);if(b.event==="pusher:connection_established")return{action:"connected",id:b.data.socket_id};else if(b.event==="pusher:error")return{action:this.getCloseAction(b.data),
error:this.getCloseError(b.data)};else throw"Invalid handshake";},getCloseAction:function(b){return b.code<4E3?b.code>=1002&&b.code<=1004?"backoff":null:b.code===4E3?"ssl_only":b.code<4100?"refused":b.code<4200?"backoff":b.code<4300?"retry":"refused"},getCloseError:function(b){return b.code!==1E3&&b.code!==1001?{type:"PusherError",data:{code:b.code,message:b.reason||b.message}}:null}};Pusher.Protocol=Protocol}).call(this);
(function(){function b(a,b){Pusher.EventsDispatcher.call(this);this.id=a;this.transport=b;this.bindListeners()}var c=b.prototype;Pusher.Util.extend(c,Pusher.EventsDispatcher.prototype);c.supportsPing=function(){return this.transport.supportsPing()};c.send=function(a){return this.transport.send(a)};c.send_event=function(a,b,c){a={event:a,data:b};if(c)a.channel=c;Pusher.debug("Event sent",a);return this.send(Pusher.Protocol.encodeMessage(a))};c.close=function(){this.transport.close()};c.bindListeners=
function(){var a=this,b=function(b){var c;try{c=Pusher.Protocol.decodeMessage(b)}catch(d){a.emit("error",{type:"MessageParseError",error:d,data:b.data})}if(c!==void 0){Pusher.debug("Event recd",c);switch(c.event){case "pusher:error":a.emit("error",{type:"PusherError",data:c.data});break;case "pusher:ping":a.emit("ping");break;case "pusher:pong":a.emit("pong")}a.emit("message",c)}},c=function(){a.emit("ping_request")},e=function(b){a.emit("error",{type:"WebSocketError",error:b})},f=function(g){a.transport.unbind("closed",
f);a.transport.unbind("error",e);a.transport.unbind("ping_request",c);a.transport.unbind("message",b);g&&g.code&&a.handleCloseEvent(g);a.transport=null;a.emit("closed")};a.transport.bind("message",b);a.transport.bind("ping_request",c);a.transport.bind("error",e);a.transport.bind("closed",f)};c.handleCloseEvent=function(a){var b=Pusher.Protocol.getCloseAction(a);(a=Pusher.Protocol.getCloseError(a))&&this.emit("error",a);b&&this.emit(b)};Pusher.Connection=b}).call(this);
(function(){function b(a,b){this.transport=a;this.callback=b;this.bindListeners()}var c=b.prototype;c.close=function(){this.unbindListeners();this.transport.close()};c.bindListeners=function(){var a=this;a.onMessage=function(b){a.unbindListeners();try{var c=Pusher.Protocol.processHandshake(b);c.action==="connected"?a.finish("connected",{connection:new Pusher.Connection(c.id,a.transport)}):(a.finish(c.action,{error:c.error}),a.transport.close())}catch(e){a.finish("error",{error:e}),a.transport.close()}};
a.onClosed=function(b){a.unbindListeners();var c=Pusher.Protocol.getCloseAction(b)||"backoff",b=Pusher.Protocol.getCloseError(b);a.finish(c,{error:b})};a.transport.bind("message",a.onMessage);a.transport.bind("closed",a.onClosed)};c.unbindListeners=function(){this.transport.unbind("message",this.onMessage);this.transport.unbind("closed",this.onClosed)};c.finish=function(a,b){this.callback(Pusher.Util.extend({transport:this.transport,action:a},b))};Pusher.Handshake=b}).call(this);
(function(){function b(a,b){Pusher.EventsDispatcher.call(this);this.key=a;this.options=b||{};this.state="initialized";this.connection=null;this.encrypted=!!b.encrypted;this.timeline=this.options.getTimeline();this.connectionCallbacks=this.buildConnectionCallbacks();this.errorCallbacks=this.buildErrorCallbacks();this.handshakeCallbacks=this.buildHandshakeCallbacks(this.errorCallbacks);var c=this;Pusher.Network.bind("online",function(){c.timeline.info({netinfo:"online"});c.state==="unavailable"&&c.connect()});
Pusher.Network.bind("offline",function(){c.timeline.info({netinfo:"offline"});c.shouldRetry()&&(c.disconnect(),c.updateState("unavailable"))});var e=function(){c.timelineSender&&c.timelineSender.send(function(){})};this.bind("connected",e);setInterval(e,6E4);this.updateStrategy()}var c=b.prototype;Pusher.Util.extend(c,Pusher.EventsDispatcher.prototype);c.connect=function(){var a=this;if(!a.connection&&a.state!=="connecting")if(a.strategy.isSupported())if(Pusher.Network.isOnline()===!1)a.updateState("unavailable");
else{a.updateState("connecting");a.timelineSender=a.options.getTimelineSender(a.timeline,{encrypted:a.encrypted},a);var b=function(c,e){c?a.runner=a.strategy.connect(0,b):(a.runner.abort(),a.handshakeCallbacks[e.action](e))};a.runner=a.strategy.connect(0,b);a.setUnavailableTimer()}else a.updateState("failed")};c.send=function(a){return this.connection?this.connection.send(a):!1};c.send_event=function(a,b,c){return this.connection?this.connection.send_event(a,b,c):!1};c.disconnect=function(){this.runner&&
this.runner.abort();this.clearRetryTimer();this.clearUnavailableTimer();this.stopActivityCheck();this.updateState("disconnected");this.connection&&(this.connection.close(),this.abandonConnection())};c.updateStrategy=function(){this.strategy=this.options.getStrategy({key:this.key,timeline:this.timeline,encrypted:this.encrypted})};c.retryIn=function(a){var b=this;b.timeline.info({action:"retry",delay:a});b.retryTimer=new Pusher.Timer(a||0,function(){b.disconnect();b.connect()})};c.clearRetryTimer=function(){this.retryTimer&&
this.retryTimer.ensureAborted()};c.setUnavailableTimer=function(){var a=this;a.unavailableTimer=new Pusher.Timer(a.options.unavailableTimeout,function(){a.updateState("unavailable")})};c.clearUnavailableTimer=function(){this.unavailableTimer&&this.unavailableTimer.ensureAborted()};c.resetActivityCheck=function(){this.stopActivityCheck();if(!this.connection.supportsPing()){var a=this;a.activityTimer=new Pusher.Timer(a.options.activityTimeout,function(){a.send_event("pusher:ping",{});a.activityTimer=
new Pusher.Timer(a.options.pongTimeout,function(){a.connection.close()})})}};c.stopActivityCheck=function(){this.activityTimer&&this.activityTimer.ensureAborted()};c.buildConnectionCallbacks=function(){var a=this;return{message:function(b){a.resetActivityCheck();a.emit("message",b)},ping:function(){a.send_event("pusher:pong",{})},ping_request:function(){a.send_event("pusher:ping",{})},error:function(b){a.emit("error",{type:"WebSocketError",error:b})},closed:function(){a.abandonConnection();a.shouldRetry()&&
a.retryIn(1E3)}}};c.buildHandshakeCallbacks=function(a){var b=this;return Pusher.Util.extend({},a,{connected:function(a){b.clearUnavailableTimer();b.setConnection(a.connection);b.socket_id=b.connection.id;b.updateState("connected")}})};c.buildErrorCallbacks=function(){function a(a){return function(c){c.error&&b.emit("error",{type:"WebSocketError",error:c.error});a(c)}}var b=this;return{ssl_only:a(function(){b.encrypted=!0;b.updateStrategy();b.retryIn(0)}),refused:a(function(){b.disconnect()}),backoff:a(function(){b.retryIn(1E3)}),
retry:a(function(){b.retryIn(0)})}};c.setConnection=function(a){this.connection=a;for(var b in this.connectionCallbacks)this.connection.bind(b,this.connectionCallbacks[b]);this.resetActivityCheck()};c.abandonConnection=function(){if(this.connection){for(var a in this.connectionCallbacks)this.connection.unbind(a,this.connectionCallbacks[a]);this.connection=null}};c.updateState=function(a,b){var c=this.state;this.state=a;c!==a&&(Pusher.debug("State changed",c+" -> "+a),this.timeline.info({state:a}),
this.emit("state_change",{previous:c,current:a}),this.emit(a,b))};c.shouldRetry=function(){return this.state==="connecting"||this.state==="connected"};Pusher.ConnectionManager=b}).call(this);
(function(){function b(){Pusher.EventsDispatcher.call(this);var b=this;window.addEventListener!==void 0&&(window.addEventListener("online",function(){b.emit("online")},!1),window.addEventListener("offline",function(){b.emit("offline")},!1))}Pusher.Util.extend(b.prototype,Pusher.EventsDispatcher.prototype);b.prototype.isOnline=function(){return window.navigator.onLine===void 0?!0:window.navigator.onLine};Pusher.NetInfo=b;Pusher.Network=new b}).call(this);
(function(){Pusher.Channels=function(){this.channels={}};Pusher.Channels.prototype={add:function(b,a){var d=this.find(b);d||(d=Pusher.Channel.factory(b,a),this.channels[b]=d);return d},find:function(b){return this.channels[b]},remove:function(b){delete this.channels[b]},disconnect:function(){for(var b in this.channels)this.channels[b].disconnect()}};Pusher.Channel=function(b,a){var d=this;Pusher.EventsDispatcher.call(this,function(a){Pusher.debug("No callbacks on "+b+" for "+a)});this.pusher=a;this.name=
b;this.subscribed=!1;this.bind("pusher_internal:subscription_succeeded",function(a){d.onSubscriptionSucceeded(a)})};Pusher.Channel.prototype={init:function(){},disconnect:function(){this.subscribed=!1;this.emit("pusher_internal:disconnected")},onSubscriptionSucceeded:function(){this.subscribed=!0;this.emit("pusher:subscription_succeeded")},authorize:function(b,a,d){return d(!1,{})},trigger:function(b,a){return this.pusher.send_event(b,a,this.name)}};Pusher.Util.extend(Pusher.Channel.prototype,Pusher.EventsDispatcher.prototype);
Pusher.Channel.PrivateChannel={authorize:function(b,a,d){var h=this;return(new Pusher.Channel.Authorizer(this,Pusher.channel_auth_transport,a)).authorize(b,function(a,b){a||h.emit("pusher_internal:authorized",b);d(a,b)})}};Pusher.Channel.PresenceChannel={init:function(){this.members=new b(this)},onSubscriptionSucceeded:function(){this.subscribed=!0}};var b=function(b){var a=this,d=null,h=function(){a._members_map={};a.count=0;d=a.me=null};h();var e=function(e){a._members_map=e.presence.hash;a.count=
e.presence.count;a.me=a.get(d.user_id);b.emit("pusher:subscription_succeeded",a)};b.bind("pusher_internal:authorized",function(a){d=JSON.parse(a.channel_data);b.bind("pusher_internal:subscription_succeeded",e)});b.bind("pusher_internal:member_added",function(d){a.get(d.user_id)===null&&a.count++;a._members_map[d.user_id]=d.user_info;b.emit("pusher:member_added",a.get(d.user_id))});b.bind("pusher_internal:member_removed",function(d){var e=a.get(d.user_id);e&&(delete a._members_map[d.user_id],a.count--,
b.emit("pusher:member_removed",e))});b.bind("pusher_internal:disconnected",function(){h();b.unbind("pusher_internal:subscription_succeeded",e)})};b.prototype={each:function(b){for(var a in this._members_map)b(this.get(a))},get:function(b){return this._members_map.hasOwnProperty(b)?{id:b,info:this._members_map[b]}:null}};Pusher.Channel.factory=function(b,a){var d=new Pusher.Channel(b,a);b.indexOf("private-")===0?Pusher.Util.extend(d,Pusher.Channel.PrivateChannel):b.indexOf("presence-")===0&&(Pusher.Util.extend(d,
Pusher.Channel.PrivateChannel),Pusher.Util.extend(d,Pusher.Channel.PresenceChannel));d.init();return d}}).call(this);
(function(){Pusher.Channel.Authorizer=function(b,a,d){this.channel=b;this.type=a;this.authOptions=(d||{}).auth||{}};Pusher.Channel.Authorizer.prototype={composeQuery:function(b){var b="&socket_id="+encodeURIComponent(b)+"&channel_name="+encodeURIComponent(this.channel.name),a;for(a in this.authOptions.params)b+="&"+encodeURIComponent(a)+"="+encodeURIComponent(this.authOptions.params[a]);return b},authorize:function(b,a){return Pusher.authorizers[this.type].call(this,b,a)}};var b=1;Pusher.auth_callbacks=
{};Pusher.authorizers={ajax:function(b,a){var d;d=Pusher.XHR?new Pusher.XHR:window.XMLHttpRequest?new window.XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP");d.open("POST",Pusher.channel_auth_endpoint,!0);d.setRequestHeader("Content-Type","application/x-www-form-urlencoded");for(var h in this.authOptions.headers)d.setRequestHeader(h,this.authOptions.headers[h]);d.onreadystatechange=function(){if(d.readyState==4)if(d.status==200){var b,c=!1;try{b=JSON.parse(d.responseText),c=!0}catch(g){a(!0,
"JSON returned from webapp was invalid, yet status code was 200. Data was: "+d.responseText)}c&&a(!1,b)}else Pusher.warn("Couldn't get auth info from your webapp",d.status),a(!0,d.status)};d.send(this.composeQuery(b));return d},jsonp:function(c,a){this.authOptions.headers!==void 0&&Pusher.warn("Warn","To send headers with the auth request, you must use AJAX, rather than JSONP.");var d=b.toString();b++;var h=document.createElement("script");Pusher.auth_callbacks[d]=function(b){a(!1,b)};h.src=Pusher.channel_auth_endpoint+
"?callback="+encodeURIComponent("Pusher.auth_callbacks['"+d+"']")+this.composeQuery(c);d=document.getElementsByTagName("head")[0]||document.documentElement;d.insertBefore(h,d.firstChild)}}}).call(this);
/**
 * Client of the SimpleSignaling protocol
 * @constructor
 * @param {Object} configuration Configuration of the connection
 */
function SimpleSignaling(configuration)
{
    var self = this;

    /**
     * UUID generator
     */
    var UUIDv4 = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)};

    var uid = (configuration.uid != undefined) ? configuration.uid : UUIDv4();

    var websocket = new WebSocket(configuration.ws_uri);
        websocket.onopen = function()
        {
            // Message received
            websocket.onmessage = function(message)
            {
                message = JSON.parse(message.data);

                var orig = message[0];
                var room = message[1];
                var data = message[2];

                if(self.onmessage)
                   self.onmessage(data, orig, room);
            };

            // Send our UID
            websocket.send(JSON.stringify([uid, configuration.room]));

            // Set signaling as open
            if(self.onopen)
                self.onopen();
        };

    /**
     * Compose and send message
     * @param message Data to be send
     * @param {String|undefined} uid Identifier of the remote peer. If null,
     * message is send by broadcast to all connected peers
     */
    this.send = function(message, dest, room)
    {
        websocket.send(JSON.stringify([dest, room, message]), function(error)
        {
            if(error && self.onerror)
                self.onerror(error);
        });
    };

    /**
     * Get the current UID
     * @returns {String}
     */
    this.uid = function()
    {
        return uid;
    };
}/**
 * @classdesc Manager of the communications with the other peers
 * @constructor
 * @param {String} [stun_server="stun.l.google.com:19302"] URL of the server
 * used for the STUN communications.
 */
function PeersManager(handshake_servers_file, stun_server)
{
  //Fallbacks for vendor-specific variables until the spec is finalized.
  var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;

  // Set a default STUN server if none is specified
  if(stun_server == undefined)
     stun_server = 'stun.l.google.com:19302';

  var peers = {};

  var self = this;


  /**
   * UUID generator
   */
  var UUIDv4 = function b(a)
  {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
  };

  this.uid = UUIDv4();


  /**
   * Create a new RTCPeerConnection
   * @param {UUID} id Identifier of the other peer so later can be accessed.
   * @return {RTCPeerConnection}
   */
  function createPeerConnection(uid, incomingChannel, cb)
  {
    var pc = peers[uid] = new RTCPeerConnection(
    {
      iceServers: [{url: 'stun:'+stun_server}]
    },
    {
      optional: [{RtpDataChannels: true}]
    });

    pc.onicecandidate = function(event)
    {
      if(event.candidate)
        incomingChannel.sendCandidate(uid, event.candidate);
    }
    pc.onstatechange = function(event)
    {
      console.warn("PeerConnection "+event.target.readyState)
      console.warn("PeerConnection "+event.target.iceConnectionState)

      // Remove the peer from the list of peers when gets closed
      if(event.target.readyState == 'closed')
        delete peers[uid];
    };

    pc._channels2 = {}

    var dispatchEvent = pc.dispatchEvent;
    pc.dispatchEvent = function(event)
    {
      var channel = event.channel

      if(event.type == 'datachannel' && channel.label == 'webp2p')
        initDataChannel(pc, channel, uid)

      else
      {
        pc._channels2[channel.label] = channel
        dispatchEvent.call(this, event)
      }
    };

    pc.channels = function()
    {
      return pc._channels2
    }

//    pc.onopen = function(event)
    {
      var event = document.createEvent("Event");
          event.initEvent('peerconnection',true,true);
          event.peerconnection = pc
          event.uid = uid

      self.dispatchEvent(event);
    }

    if(cb)
      pc.onerror = function(event)
      {
        cb({uid: uid, peer:pc});
      };

    return pc;
  }

  /**
   * Initialize a {RTCDataChannel} when gets open and notify it
   * @param {RTCPeerConnection} pc PeerConnection owner of the DataChannel.
   * @param {RTCDataChannel} channel Communication channel with the other peer.
   */
  function initDataChannel(pc, channel, uid)
  {
    pc._routing = channel;

    channel.addEventListener('close', function(event)
    {
      delete pc._routing;

      pc.close();
    });

    channel.uid = uid;
    Transport_Routing_init(channel, self);
  }


  /**
   * Process the offer to connect to a new peer
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Session Description Protocol data of the other peer.
   * @return {RTCPeerConnection} The (newly created) peer.
   */
  this.onoffer = function(uid, sdp, incomingChannel, cb)
  {
    // Search the peer between the list of currently connected peers
    var peer = peers[uid];

    // Peer is not connected, create a new channel
    if(!peer)
      peer = createPeerConnection(uid, incomingChannel, cb);

    // Process offer
    peer.setRemoteDescription(new RTCSessionDescription(
    {
      sdp: sdp,
      type: 'offer'
    }));

    return peer;
  };

  /**
   * Process the answer received while attempting to connect to the other peer
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Session Description Protocol data of the other peer.
   * @param {Function} onerror Callback called if we don't have previously
   * wanted to connect to the other peer.
   */
  this.onanswer = function(uid, sdp, onerror)
  {
    // Search the peer on the list of currently connected peers
    var peer = peers[uid];
    if(peer)
      peer.setRemoteDescription(new RTCSessionDescription(
      {
        sdp: sdp,
        type: 'answer'
      }));
    else if(onerror)
      onerror(uid);
  };

  this.oncandidate = function(uid, candidate, onerror)
  {
    // Search the peer on the list of currently connected peers
    var peer = peers[uid];
    if(peer)
      peer.addIceCandidate(new RTCIceCandidate(candidate));
    else if(onerror)
      onerror(uid);
  }


  // Init handshake manager
  var handshakeManager = new HandshakeManager(handshake_servers_file, this);
  handshakeManager.onerror = function(error)
  {
    console.error(error);
    alert(error);
  };
  handshakeManager.onopen = function()
  {
    var event = document.createEvent("Event");
        event.initEvent('handshake.open',true,true);
        event.uid = self.uid

    self.dispatchEvent(event);

//    // Restart downloads
//    db.files_getAll(null, function(error, filelist)
//    {
//      if(error)
//        console.error(error)
//
//      else if(filelist.length)
//        policy(function()
//        {
//          for(var i=0, fileentry; fileentry=filelist[i]; i++)
//            if(fileentry.bitmap)
//              self.transfer_query(fileentry)
//        })
//    })
  };

  /**
   * Connects to another peer based on its UID. If we are already connected,
   * it does nothing.
   * @param {UUID} uid Identifier of the other peer to be connected.
   * @param {MessageChannel} incomingChannel Optional channel where to
   * @param {Function(error, channel)} cb Callback
   * send the offer. If not defined send it to all connected peers.
   */
  this.connectTo = function(uid, incomingChannel, cb)
  {
    // Search the peer between the list of currently connected peers
    var peer = peers[uid];

    // Peer is not connected, create a new channel
    if(!peer)
    {
      // Create PeerConnection
      peer = createPeerConnection(uid, incomingChannel, cb);

      var channel = peer.createDataChannel('webp2p');
      initDataChannel(peer, channel, uid);

      var channel = peer.createDataChannel('shareit');
      peer._channels2[channel.label] = channel

      var event = document.createEvent("Event");
          event.initEvent('datachannel',true,true);
          event.channel = channel
      peer.dispatchEvent(event);

      if(cb)
      {
        channel.addEventListener('open', function(event)
        {
          cb(null, uid);
        });
        channel.onerror = function(event)
        {
          cb({uid: uid, peer:peer, channel:channel});
        };
      }

      // Send offer to new PeerConnection
      peer.createOffer(function(offer)
      {
        console.log("[createOffer]: "+uid+"\n"+offer.sdp);

        // Send the offer only for the incoming channel
        if(incomingChannel)
           incomingChannel.sendOffer(uid, offer.sdp);

        // Send the offer throught all the peers
        else
        {
          var channels = self.getChannels();

          // Send the connection offer to the other connected peers
          for(var channel_id in channels)
            channels[channel_id].sendOffer(uid, offer.sdp);
        }

        // Set the peer local description
        peer.setLocalDescription(offer);
      });
    }

//    // PeerConnection is connected but channel not created
//    else if(!peer._channel)
//      cb('PeerConnection is connected but channel not created, please wait '+
//         'some more seconds')

    // Channel is created and we have defined an 'onsucess' callback
    else if(cb)
    {
      var channel = peer._channels2['shareit']

      // Channel is open
      if(channel.readyState == 'open')
        cb(null, uid);

      // Channel is not ready, call the callback when it's opened
      else
        channel.addEventListener('open', function(event)
        {
          cb(null, uid);
        })
    }
  };

  this.getPeers = function()
  {
    return peers
  }

  /**
   * Get the channels of all the connected peers and handshake servers
   */
  this.getChannels = function()
  {
    var channels = {};

    // Peers channels
    for(var uid in peers)
    {
      var channel = peers[uid]._channel;
      if(channel)
        channels[uid] = channel;
    }

    // Handshake servers channels
    var handshakeChannels = handshakeManager.getChannels();

    for(var uid in handshakeChannels)
      if(handshakeChannels.hasOwnProperty(uid))
        channels[uid] = handshakeChannels[uid];

      return channels;
  };


  this.handshakeDisconnected = function()
  {
    if(!Object.keys(peers).length)
    {
      var event = document.createEvent("Event");
          event.initEvent('error.noPeers',true,true);

      this.dispatchEvent(event);
    }
  };
}
PeersManager.prototype = new EventTarget();

exports.PeersManager = PeersManager;function Transport_Presence_init(transport, peersManager, max_connections)
{
  Transport_Routing_init(transport, peersManager);

  // Count the maximum number of pending connections allowed to be
  // done with this handshake server (undefined == unlimited)
  transport.connections = 0
  transport.max_connections = max_connections

  /**
   * Handle the presence of other new peers
   */
  transport.addEventListener('presence', function(event)
  {
    var from = event.from;

    // Check if we should ignore this new peer to increase entropy in
    // the network mesh

    // Do the connection with the new peer
    peersManager.connectTo(from, transport, function(error, uid)
    {
      if(error)
        console.error(from, peer, transport);

      else
        // Increase the number of connections reached throught
        // this handshake server
        transport.connections++;

      // Close connection with handshake server if we got its
      // quota of peers
      if(transport.connections == transport.max_connections)
        transport.close();
    });
  })

  transport.onerror = function(error)
  {
    console.error(error);

    // Close the channel (and try with the next one)
    transport.close();
  };
}


/**
 * Manage the handshake channel using several servers
 * @constructor
 * @param {String} json_uri URI of the handshake servers configuration.
 */
function HandshakeManager(json_uri, peersManager)
{
  EventTarget.call(this);

  var self = this;

  var channels = {};
  var status = 'disconnected';


  function nextHandshake(configuration)
  {
    // Remove the configuration from the poll
    configuration.splice(index, 1);

    // If there are more pending configurations, go to the next one
    if(configuration.length)
      getRandomHandshake(configuration);

    // There are no more pending configurations and all channels have been
    // closed, set as disconnected and notify to the PeersManager
    else if(!Object.keys(channels).length)
    {
      status = 'disconnected';

      peersManager.handshakeDisconnected();
    }
  }


  /**
   * Get a random handshake channel or test for the next one
   * @param {Object} configuration Handshake servers configuration.
   */
  function getRandomHandshake(configuration)
  {
    var index = Math.floor(Math.random() * configuration.length);
    var index = 0;  // Forced until servers interoperation works

    var type = configuration[index][0];
    var conf = configuration[index][1];

    conf.uid = peersManager.uid;

    var channelConstructor = HandshakeManager.handshakeServers[type];

    // Check if channel constructor is from a valid handshake server
    if(!channelConstructor)
    {
        console.error("Invalidad handshake server type '" + type + "'");

        // Try to get an alternative handshake channel
        nextHandshake();
    }

    var channel = new channelConstructor(conf);

    Transport_Presence_init(channel, peersManager, conf.max_connections)

    channel.uid = type;
    channels[type] = channel;

    channel.addEventListener('open', function(event)
    {
      status = 'connected';

      var event = document.createEvent("Event");
          event.initEvent('open',true,true);

      self.dispatchEvent(event);
    });
    channel.addEventListener('close', function(event)
    {
      status = 'connecting';

      // Delete the channel from the current ones
      delete channels[channel.uid];

      // Try to get an alternative handshake channel
      nextHandshake(configuration);
    });
  }


  /**
   * Get the channels of all the connected peers and handshake servers
   */
  this.getChannels = function()
  {
    return channels;
  };


  // Request the handshake servers configuration file
  var http_request = new XMLHttpRequest();

  http_request.open('GET', json_uri);
  http_request.onload = function()
  {
    if(this.status == 200)
    {
      status = 'connecting';

      var configuration = JSON.parse(http_request.response);

      if(configuration.length)
        getRandomHandshake(configuration);

      else
      {
        status = 'disconnected';

        if(self.onerror)
           self.onerror('Handshake servers configuration is empty');
      }
    }

    else if(self.onerror)
      self.onerror('Unable to fetch handshake servers configuration');
  };
  http_request.onerror = function()
  {
    if(self.onerror)
       self.onerror('Unable to fetch handshake servers configuration');
  };

  http_request.send();
}

HandshakeManager.handshakeServers = {}
HandshakeManager.registerConstructor = function(type, constructor)
{
  HandshakeManager.handshakeServers[type] = constructor
}/**
 * Handshake channel connector for PubNub (adapter to Message Channel interface)
 * @param {Object} configuration Configuration object.
 */
HandshakeManager.registerConstructor('PubNub',
function(configuration)
{
  EventTarget.call(this);

  this.isPubsub = true;

  var self = this;

  // Connect a handshake channel to the PubNub server
  var pubnub = PUBNUB.init(configuration);


  pubnub.subscribe(
  {
    channel: configuration.channel,


    /**
     * Receive messages
     */
    callback: function(message)
    {
      var event = JSON.parse(message)

      // Don't try to connect to ourselves
      if(event.from == configuration.uid)
        return

      self.dispatchEvent(event);
    },

    /**
     * Handle the connection to the handshake server
     */
    connect: function()
    {
      // Notify our presence
      self.send({type: 'presence', from: configuration.uid});

      // Notify that the connection to this handshake server is open
      var event = document.createEvent("Event");
          event.initEvent('open',true,true);

      self.dispatchEvent(event);
    },


    /**
     * Handle errors on the connection
     */
    error: function(error)
    {
      if(self.onerror)
         self.onerror(error)
    }
  });


  /**
   * Send a message to a peer
   */
  this.send = function(data, uid)
  {
    data.from = configuration.uid
    data.to = uid

    pubnub.publish(
    {
      channel: configuration.channel,
      message: JSON.stringify(data)
    });
  };


  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    pubnub.unsubscribe(
    {
      channel: configuration.channel
    });
  }
})/**
 * Handshake channel connector for SimpleSignaling
 * @param {Object} configuration Configuration object.
 */
HandshakeManager.registerConstructor('SimpleSignaling',
function(configuration)
{
  EventTarget.call(this);

  this.isPubsub = true;

  var self = this;

  // Connect a handshake channel to the SimpleSignaling server
  var connection = new SimpleSignaling(configuration);


  /**
   * Receive messages
   */
  connection.onmessage = function(message)
  {
    var event = JSON.parse(message.data);

    // Don't try to connect to ourselves
    if(event.from == configuration.uid)
      return

    this.dispatchEvent(event);
  };


  /**
   * Handle the connection to the handshake server
   */
  connection.onopen = function()
  {
    // Notify our presence
    send({type: 'presence', from: configuration.uid});

    // Notify that the connection to this handshake server is open
    var event = document.createEvent("Event");
        event.initEvent('open',true,true);

    self.dispatchEvent(event);
  };


  /**
   * Handle errors on the connection
   */
  connection.onerror = function(error)
  {
    if(self.onerror)
       self.onerror(error);
  };


  /**
   * Send a message to a peer
   */
  this.send = function(data, uid)
  {
    data.from = configuration.uid
    data.to = uid

    connection.send(JSON.stringify(data));
  }


  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    connection.close()
  }
})/**
 * Signaling channel connector for XMPP
 * @param {Object} configuration Configuration object
 */
HandshakeManager.registerConstructor('XMPP',
function(configuration)
{
  EventTarget.call(this);

  var self = this

//  configuration.oDbg = new JSJaCConsoleLogger(1)

  // Connect a handshake channel to the XMPP server
  var connection = new JSJaCHttpBindingConnection(configuration);
      connection.connect(configuration);  // Ugly hack to have only one config object


  /**
   * Receive messages
   */
  connection.registerHandler('message', function(message)
  {
    var from = message.getFromJID().getResource()

    // Don't try to connect to ourselves
    if(from == configuration.uid)
      return

    var body = message.getBody()
    if(body == "")
      return

    var event = JSON.parse(body)

    event.from = from

    self.dispatchEvent(event);
  })


  /**
   * Handle the connection to the handshake server
   */
  connection.registerHandler('onconnect', function()
  {
    // Notify our presence
    var presence = new JSJaCPresence();
        presence.setTo(configuration.room+"/"+configuration.uid);

    connection.send(presence);


    // Ugly hack so we can ignore presence messages from previous peers
    setTimeout(function()
    {
      /**
       * Handle the presence of other new peers
       */
      connection.registerHandler('presence', function(presence)
      {
        var from = presence.getFromJID().getResource()

        // Only notify new connections
        if(from != configuration.uid
        && !presence.getType()
        && !presence.getShow())
        {
          var event = document.createEvent("Event");
              event.initEvent('presence',true,true);

              event.from = from

          self.dispatchEvent(event);
        }
      });
    }, 1000)


    // Notify that the connection to this handshake server is open
    var event = document.createEvent("Event");
        event.initEvent('open',true,true);

    self.dispatchEvent(event);
  });


  /**
   * Handle errors on the connection
   */
  connection.registerHandler('onerror', function(error)
  {
    if(self.onerror)
       self.onerror(error)
  });


  /**
   * Send a message to a peer
   */
  this.send = function(data, uid)
  {
    var oMsg = new JSJaCMessage();
        oMsg.setTo(configuration.room+"/"+uid);
        oMsg.setBody(JSON.stringify(data));

    connection.send(oMsg);
  }


  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    connection.disconnect()
  }
});function Transport_Routing_init(transport, peersManager)
{
  /**
   * Receive and process an 'offer' message
   */
  transport.addEventListener('offer', function(event)
  {
    var from  = event.from;
    var sdp   = event.sdp;
    var route = event.route;

//    // If a message have been already routed by this peer, ignore it
//    for(var i = 0, uid; uid = route[i]; i++)
//      if(uid == peersManager.uid)
//        return;

//    // Offer is for us
//    if(dest == peersManager.uid)
//    {

      // Create PeerConnection
      var pc = peersManager.onoffer(from, sdp, function(uid, event)
      {
        console.error('Error creating DataChannel with peer ' + uid);
        console.error(event);
      });

      // Send answer
      pc.createAnswer(function(answer)
      {
        console.log("[createAnswer]: "+from+"\n"+answer.sdp);

        transport.sendAnswer(from, answer.sdp, route);

        pc.setLocalDescription(new RTCSessionDescription(
        {
          sdp: answer.sdp,
          type: 'answer'
        }));
      });

//    }
//
//    // Offer is not for us, route it over the other connected peers
//    else
//    {
//      // Add the transport where it was received to the route path
//      route.push(transport.uid);
//
//      // Search the peer between the list of currently connected peers
//      var channels = peersManager.getChannels();
//      var channel = channels[dest];
//
//      // Requested peer is one of the connected, notify directly to it
//      if(channel)
//         channel.sendOffer(from, sdp, route);
//
//      // Requested peer is not one of the directly connected, broadcast it
//      else for(var uid in channels)
//      {
//        // Ignore peers already on the route path
//        var routed = false;
//        for(var i = 0, peer; peer = route[i]; i++)
//          if(peer == uid)
//          {
//            routed = true;
//            break;
//          }
//
//          // Notify the offer request to the other connected peers
//          if(!routed)
//            channels[uid].sendOffer(dest, sdp, route);
//      }
//    }
  });

  /**
   * Receive and process an 'answer' message
   */
  transport.addEventListener('answer', function(event)
  {
    var from = event.from;
    var sdp = event.sdp;
    var route = event.route;

//    // Answer is from ourselves or we don't know where it goes, ignore it
//    if(orig == peersManager.uid
//    || !route.length)
//      return;
//
//    // Answer is for us
//    if(route[0] == peersManager.uid)
      peersManager.onanswer(from, sdp, function(uid)
      {
        console.error("[routing.answer] PeerConnection '" + uid + "' not found");
      });

//    // Answer is not for us but we know where it goes, search peers on route
//    // where we could send it
//    else if(route.length > 1)
//    {
//      var routed = false;
//
//      var channels = peersManager.getChannels();
//
//      // Run over all the route peers looking for possible "shortcuts"
//      for(var i = 0, uid; uid = route[i]; i++)
//      {
//        var channel = channels[uid];
//        if(channel)
//        {
//          channel.sendAnswer(from, sdp, route.slice(0, i - 1));
//
//          // Currently is sending the message to all the shortcuts, but maybe it
//          // would be necessary only the first one so some band-width could be
//          // saved?
//          routed = true;
//        }
//      }
//
//      // Answer couldn't be routed (maybe a peer was disconnected?), try to find
//      // the connection request initiator peer by broadcast
//      if(!routed)
//        for(var uid in channels)
//          if(uid != transport.uid)
//            channels[uid].sendAnswer(orig, sdp, route);
//    }
  });


  /**
   * Receive and process a 'candidate' message
   */
  transport.addEventListener('candidate', function(event)
  {
    var from      = event.from;
    var candidate = event.candidate;
    var route     = event.route;

    peersManager.oncandidate(from, candidate, function(uid)
    {
      console.error("[routing.candidate] PeerConnection '" + uid + "' not found");
    });
  })


  /**
   * Send a RTCPeerConnection answer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this answer have circulated.
   */
  transport.sendAnswer = function(orig, sdp, route)
  {
    var data = {type: 'answer',
                sdp:  sdp}
    if(route)
      data.route = route;

//    // Run over all the route peers looking for possible "shortcuts"
//    for(var i = 0, uid; uid = route[i]; i++)
//      if(uid == transport.uid)
//      {
//        route.length = i;
//        break;
//      }

    transport.send(data, orig);
  };


  /**
   * Send a RTCPeerConnection offer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this offer have circulated.
   */
  transport.sendCandidate = function(dest, candidate, route)
  {
    var data = {type: 'candidate',
                candidate:  candidate}
    if(route)
      data.route = route;

    transport.send(data, dest);
  };


  /**
   * Send a RTCPeerConnection offer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this offer have circulated.
   */
  transport.sendOffer = function(dest, sdp, route)
  {
    var data = {type: 'offer',
                sdp:  sdp}
    if(route)
      data.route = route;

    transport.send(data, dest);
  };
}
})(this);
