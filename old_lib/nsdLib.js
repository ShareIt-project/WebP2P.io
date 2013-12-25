/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Jean-Claude Dufourd
 * This code was developed with the Coltram project, funded by the French ANR.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * This notice must stay in all subsequent versions of this code.
 */
"use strict";

var NSDPlusPlus = {};

(function () {
    var conn = null;
    var eventValues = [];
    //noinspection UnnecessaryLocalVariableJS
    var discoveredServices = [];
    NSDPlusPlus.discoveredServices = discoveredServices;
    //noinspection UnnecessaryLocalVariableJS
    var connectedCallbacks = [];
    NSDPlusPlus.connectedCallbacks = connectedCallbacks;
    //noinspection UnnecessaryLocalVariableJS
    var initializedCallbacks = [];
    NSDPlusPlus.initializedCallbacks = initializedCallbacks;
    NSDPlusPlus.initialized = false;

    var serviceImplementations = [];

    //
    // add function to Array, to remove the first occurence of obj in the array
    //
    Array.prototype.remove = function (obj) {
        var i = this.indexOf(obj);
        if (i >= 0) {
            this.splice(i, 1);
        }
    };

    NSDPlusPlus.isDiscovered = function (service) {
        if (service == null) {
            throw "testing null service for past discovery";
        }
        for (var i = 0; i < discoveredServices.length; i++) {
            if (discoveredServices[i].id == service.id) {
                return true;
            }
        }
        return false;
    };

    //
    // add NSD fields not present in Java
    //
    NSDPlusPlus.addDiscoveredService = function (serviceFromJava) {
        if (serviceFromJava == null) {
            throw "service received from agent is null";
        }
        discoveredServices.push(serviceFromJava);
    };

    /////////////////////////////////////////////////////
    //// Objects ////////////////////////////////////////
    /////////////////////////////////////////////////////

    //
    // class Action
    //
    //noinspection JSUnusedLocalSymbols
    function Action(name, args) {
        this.name = name;
        this.args = args;
    }

    //
    // class Argument
    //
    //noinspection JSUnusedLocalSymbols
    function Argument(name, relatedStateVar, direction) {
        this.name = name;
        //noinspection JSUnusedGlobalSymbols
        this.relatedStateVariable = relatedStateVar;
        this.dir = direction;
    }

    NSDPlusPlus.ServiceImplementation = function () {
    };

    //NSDPlusPlus.nbOfServiceImplementations = function () {
    //    return serviceImplementations.length;
    //};
    
    NSDPlusPlus.getImplementation = function (implementationId) {
    	//console.log("getImplementation", serviceImplementations, implementationId);
        return serviceImplementations[implementationId];
    };

    /////////////////////////////////////////////////////
    //// Connect ////////////////////////////////////////
    /////////////////////////////////////////////////////

    function errorFunction(msg) {
        NSDPlusPlus.logger("Error " + msg);
        for (var i in msg) {
            //noinspection JSUnfilteredForInLoop
            if (!(typeof msg[i] == 'function')) {
                //noinspection JSUnfilteredForInLoop
                NSDPlusPlus.logger(">" + i + ":" + msg[i]);
            }
        }
    }

    //
    // first call to lib: connection to the proxy
    //
    NSDPlusPlus.connect = function (host) {
        NSDPlusPlus.logger("connecting to " + host);
        if (conn) {
        	var defered = function() {
        		if (!webSocketConnected) {
        			setTimeout(function() {
        				defered();
        			}, 100);
        		} else {
        			socketConnected();
        		}
        	};
        	defered();
        	return;
        }
        try {
            conn = new WebSocket(host == null ? "ws://localhost:56797/" : "ws://" + host + ":56797/");
        } catch (e) {
            NSDPlusPlus.logger("error creating WebSocket " + e);
            NSDPlusPlus.logger("cannot continue...");
            return;
        }
        conn.onopen = socketConnected;
        conn.onmessage = msgHandler;
        conn.onclose = socketClosed;
        conn.onerror = errorFunction;
    };

    var webSocketConnected = false;
    //
    // internal: when a socket is connected
    //
    function socketConnected() {
        //
        // then call the connected callbacks
        //
        if (connectedCallbacks.length > 0) {
            for (var i = 0; i < connectedCallbacks.length; i++) {
            	connectedCallbacks[i]();
            	NSDPlusPlus.removeEventListener("connected", connectedCallbacks[i]);
            }
        }
        webSocketConnected = true;
    }

    //
    // internal: message handler
    //
    function msgHandler(e) {
        var obj;
        try {
            // obj = JSON.parse(e.data);
            eval('obj = ' + e.data); // works better on long strings ?
            //Coltram.logger(e.data);
        } catch (error) {
            NSDPlusPlus.logger("+------+");
            NSDPlusPlus.logger("|" + error + " " + e.data);
            NSDPlusPlus.logger("+------+");
        }
        // NSDPlusPlus.resetLog();
        // NSDPlusPlus.logger(obj.purpose+" "+(e.data+"").substr(0, 400));
        messageHandlers[obj.purpose](obj);
    }

    //
    // internal: msg handling functions
    //
    var messageHandlers = {};

    //
    // allow to define message handlers from outside the module
    //
    NSDPlusPlus.addMessageHandler = function (name, func) {
        messageHandlers[name] = func;
    };

    //
    // internal: when a socket is closed
    //
    function socketClosed() {
        NSDPlusPlus.logger("Disconnected");
    }

    //noinspection JSUnusedLocalSymbols
    NSDPlusPlus.logger = function (s) {};

    NSDPlusPlus.resetLog = function () {};

    // allows to keep a unique reference to the server service object
    var exposeduniqueSequence = 1;
    var exposeduniqueTimestamp = new Date().getTime();
    var getExposedUniqueId = function(type, protocol) {
    	var id = type + "_" + protocol + "_" + exposeduniqueTimestamp + "_" + (exposeduniqueSequence++);
    	return id;
    };
    
    /////////////////////////////////////////////////////
    //// Expose  ////////////////////////////////////////
    /////////////////////////////////////////////////////
    //
    // expose a service
    //
    NSDPlusPlus.expose = function (type, protocol, serviceImplementation) {
        if (arguments.length < 3) {
            throw "NSDPlusPlus.expose called with not enough parameters";
        }
        var obj = {};
        obj.purpose = "exposeService";
        obj.localService = {};
        obj.localService.uniqueId = getExposedUniqueId(type, protocol);
        obj.localService.type = type;
        obj.localService.protocol = protocol;
        obj.localService.actionList = computeServiceDescriptionFromImplementation(serviceImplementation);
        obj.localService.eventList = null;
        if (serviceImplementation.EVENTS) {
            obj.localService.eventList = serviceImplementation.EVENTS;
            for (var i = 0; i < serviceImplementation.EVENTS.length; i++) {
                eventValues[serviceImplementation.EVENTS[i]] = null;
            }
        }
        //
        // assumption for the moment:
        // - max one service per atom
        // - the developer has to create a NSDPlusPlus.ServiceImplementation object to implement the actions
        // - the interface specification is in the manifest
        //
        serviceImplementation.service = obj.localService;
        serviceImplementations.push(serviceImplementation);
        obj.serviceImplementation = "" + (serviceImplementations.length - 1);
        conn.send(JSON.stringify(obj));
        
        return obj.localService.uniqueId;
    };
    NSDPlusPlus.unexpose = function (uniqueId) {
    	//console.log("unexpose: ", uniqueId);
		
		var obj = {};
		obj.purpose = "unexposeService";
		obj.localService = {};
		obj.localService.uniqueId = uniqueId;
		conn.send(JSON.stringify(obj));
    };

    //
    //
    //
    function computeServiceDescriptionFromImplementation(implementation) {
        var result = [];
        for (var f in implementation) {
            try {
                if (implementation.hasOwnProperty(f) && typeof implementation[f] == 'function') {
                    // create the action
                    var action = {};
                    action.name = f;
                    action.args = [];
                    result.push(action);
                    var source = implementation[f].toString();
                    //Coltram.logger(f + " :" + source);
                    // find the IN args
                    var beginArgs = source.indexOf('(');
                    var endArgs = source.indexOf(')');
                    // if there are in args (no () )
                    if (endArgs > beginArgs + 1) {
                        var args = source.substring(beginArgs + 1, endArgs).split(',');
                        for (var i = 0; i < args.length; i++) {
                            var arg = {};
                            arg.name = args[i].trim();
                            arg.dir = "IN";
                            action.args.push(arg);
                        }
                    }
                    // find the OUT args
                    var out = source.indexOf("return");
                    // if there is a return
                    if (out >= 0) {
                        var outbrace = source.indexOf('{', out);
                        var outcolon = source.indexOf(';', out);
                        // and if there is a {} before the ;, so there are OUT args
                        if (outbrace < outcolon) {
                            var outargs = source.substring(outbrace + 1, source.indexOf('}', outbrace + 1)).split(',');
                            // this is like the inside of a JSON object
                            for (var j = 0; j < outargs.length; j++) {
                                var arg1 = {}, k = outargs[j].split(':');
                                arg1.name = k[0].trim();
                                arg1.dir = "OUT";
                                action.args.push(arg1);
                            }
                        }
                    }
                }
            } catch (error) {
                throw "error parsing service implementation at " + f + " :" + error;
            }
        }
        return result;
    }

    /////////////////////////////////////////////////////
    //// updateEvent ////////////////////////////////////
    /////////////////////////////////////////////////////
    NSDPlusPlus.updateEvent = function (eventName, eventValue) {
        // propagate the value to the agent
        if (eventValues[eventName] != eventValue) {
            var obj = {};
            obj.purpose = "updateEvent";
            obj.eventName = eventName;
            obj.eventValue = JSON.stringify(eventValue);
            conn.send(JSON.stringify(obj));
        }
    };

    /////////////////////////////////////////////////////
    //// Bind    ////////////////////////////////////////
    /////////////////////////////////////////////////////
    function getServiceByServiceId(serviceId) {
        for (var i = 0; i < discoveredServices.length; i++) {
            if (discoveredServices[i].id == serviceId) {
                return discoveredServices[i];
            }
        }
        return null;
    }

    //
    // bind service, creating a proxy object with one function per action
    //
    NSDPlusPlus.bindServiceMappedArguments = function (serviceId) {
        var service = getServiceByServiceId(serviceId);
        if (service == null) {
            NSDPlusPlus.logger("service with id " + serviceId + " not found in bindServiceMappedArguments");
            return null;
        }
        // create proxy object
        var proxy = {};
        for (var i = 0; i < service.actionList.length; i++) {
            proxy[service.actionList[i].name] = createMappedProxyFunction(serviceId, service.actionList[i].name);
        }
        // todo events
        return proxy;
    };

    function createMappedProxyFunction(serviceId, actionName) {
        return function (args, replyCallBack) {
            var obj = {};
            obj.purpose = "callAction2";
            obj.serviceId = serviceId;
            obj.actionName = actionName;
            for (var i in args) {
                if (args.hasOwnProperty(i) && typeof args[i] != 'string') {
                    args[i] = "" + args[i];
                    NSDPlusPlus.logger("call argument " + i + " of " + actionName + " should be a string");
                }
            }
            obj["arguments"] = args;
            obj.replyCallBack = getTokenForCallBack(replyCallBack);
            var s = JSON.stringify(obj);
            //NSDPlusPlus.logger(s);
            conn.send(s);
        };
    }

    var callBackTable = [];

    function getTokenForCallBack(callBack) {
        callBackTable.push(callBack);
        return (callBackTable.length - 1) + "";
    }

    function getCallBackFromToken(token) {
        return callBackTable[+token];
    }

    //
    // bind service, creating a proxy object with one function per action
    //
    NSDPlusPlus.bindService = function (serviceId) {
        var service = getServiceByServiceId(serviceId);
        if (service == null) {
            NSDPlusPlus.logger("service with id " + serviceId + " not found in bindService");
            return null;
        } //else {
            //Coltram.logger("service "+serviceId);
            //for (var i = 0; i < service.eventList.length; i++) {
            //    Coltram.logger(service.eventList[i]);
            //}
        //}
        if (service.actionList == null) {
            NSDPlusPlus.logger("trying to bind to a service with no actionList: serviceId="+serviceId);
            return null;
        }
        // create proxy object
        var proxy = {};
        for (var i = 0; i < service.actionList.length; i++) {
            proxy[service.actionList[i].name] = createProxyFunction(serviceId, service.actionList[i].name, service.actionList[i].args);
        }
        if (service.eventList) {
            proxy.subscribe = function (eventList, serviceId, conn) {
                return function (eventName, callback) {
                    if (typeof callback != 'string') {
                        NSDPlusPlus.logger("callback "+callback+" should be a string in subscribe");
                        throw "callback "+callback+" should be a string in subscribe";
                    }
                    if (eventList.indexOf(eventName) >= 0) {
                        var obj = {};
                        obj.purpose = "subscribe";
                        obj.serviceId = serviceId;
                        obj.eventName = eventName;
                        obj.callback = callback;
                        var s = JSON.stringify(obj);
                        //Coltram.logger(s);
                        conn.send(s);
                    } else {
                        NSDPlusPlus.logger("event "+eventName+" is not part of the interface of this service");
                        throw "event "+eventName+" is not part of the interface of this service";
                    }
                }
            }(service.eventList, serviceId, conn);
            proxy.unsubscribe = function (eventList, serviceId, conn) {
                return function (eventName, callback) {
                    if (eventList.indexOf(eventName) >= 0) {
                        var obj = {};
                        obj.purpose = "unsubscribe";
                        obj.serviceId = serviceId;
                        obj.eventName = eventName;
                        obj.callback = callback;
                        var s = JSON.stringify(obj);
                        //Coltram.logger(s);
                        conn.send(s);
                    } else {
                        NSDPlusPlus.logger("event "+eventName+" is not part of the interface of this service");
                        throw "event "+eventName+" is not part of the interface of this service";
                    }
                }
            }(service.eventList, serviceId, conn);
        } else {
            proxy.subscribe = function () {
                NSDPlusPlus.logger("this service does not have events");
                throw "this service does not have events";
            };
            proxy.unsubscribe = function () {
                NSDPlusPlus.logger("this service does not have events");
                throw "this service does not have events";
            };
        }
        return proxy;
    };

    // version without eval
    function createProxyFunction(serviceId, actionName, args) {
        return function () {
            var obj = {};
            obj.purpose = 'callAction';
            obj.serviceId = serviceId;
            obj.actionName = actionName;
            obj["arguments"] = {};
            var j = 0;
            for (var i = 0; i < args.length; i++) {
                if (args[i].dir.toLowerCase() == "in") {
                    if (j >= arguments.length) {
                        NSDPlusPlus.logger("not enough arguments provided to a proxy function: " + actionName);
                        return;
                    }
                    obj["arguments"][args[i].name] = JSON.stringify(arguments[j++]);
                }
            }
            // if all arguments have been consumed, no replyCallBack
            if (j < arguments.length) {
                if (j < arguments.length - 1) {
                    NSDPlusPlus.logger("too many arguments provided to a proxy function: " +
                            actionName + " " + (arguments.length - 1 - j));
                    return;
                }
                obj.replyCallBack = getTokenForCallBack(arguments[arguments.length - 1]);
            }
            var s = JSON.stringify(obj);
            conn.send(s);
        };
    }

    /////////////////////////////////////////////////////
    //// Messages from Agent ////////////////////////////
    /////////////////////////////////////////////////////

    messageHandlers.updateEvent = function(obj) {
        window[obj.callback].call(null, JSON.parse(obj.eventValue));
    }


    //
    // message sent by the agent to inform the atom about ids and names
    //
    messageHandlers.initialize = function (obj) {
        NSDPlusPlus.hostName = obj.hostName;
        NSDPlusPlus.agentHostName = obj.agentHostName;
        //
        // then call the initialized callbacks
        //
        if (initializedCallbacks.length > 0) {
            for (var i = 0; i < initializedCallbacks.length; i++) {
                initializedCallbacks[i]();
            }
            initializedCallbacks = []; // initialized call backs are called once only
        }
        NSDPlusPlus.initialized = true;
    };

    //
    // message sent by the agent getting a reply after having called an action onto a service outside
    // variant with reply arguments mapped to attributes of an object
    //
    messageHandlers.mappedReply = function (obj) {
        var fun = getCallBackFromToken(obj.callBack);
        if (typeof fun == 'function') {
            fun.call(this, obj);
        }
        else {
            NSDPlusPlus.logger("reply with an unknown callback token: " + obj.callBack);
        }
    };

    //
    // message sent by the agent getting a reply to a callAction
    // variant with reply arguments as individual parameters to a function
    //
    messageHandlers.reply = function (obj) {
        var fun = getCallBackFromToken(obj.callBack);
        if (typeof fun == 'function') {
            var service = getServiceByServiceId(obj.serviceId);
            if (service == null) {
                NSDPlusPlus.logger("reply from an unknown service " + obj.serviceId + " " + obj.actionName);
                return;
            }
            for (var i = 0; i < service.actionList.length; i++) {
                if (service.actionList[i].name == obj.actionName) {
                    var replyArgs = [];
                    var al = service.actionList[i].args;
                    for (var j = 0; j < al.length; j++) {
                        // one path to here has arguments directly in obj, the other in obj.arguments
                        var property = obj[al[j].name];
                        if (property) {
                            replyArgs.push(property);
                        } else if (obj["arguments"]) {
                            property = obj["arguments"][al[j].name];
                            if (property) {
                                replyArgs.push(property);
                            }
                        }
                    }
                    fun.apply(obj, replyArgs);
                    return;
                }
            }
            NSDPlusPlus.logger("reply with an unknown actionName " + obj.actionName + " " + obj.serviceId);
        }
        else {
            NSDPlusPlus.logger("reply with an unknown callback token: " + obj.callBack);
        }
    };

    //
    // message sent by the agent when someone else calls an action of a service exposed by this atom
    //
    messageHandlers.serviceAction = function (obj) {
        var impl = serviceImplementations[parseInt(obj.implementation)];
        serviceActionInternal(obj, impl, obj);
    };

    function serviceActionInternal(obj, impl, args2) {
        if (typeof impl[obj.actionName] == 'function') {
            // prepare the arguments from the service action description, one arg per argument described as 'in'
            var args = [];
            for (var i = 0; i < impl.service.actionList.length; i++) {
                var action = impl.service.actionList[i];
                if (action.name == obj.actionName) {
                    for (var j in action.args) {
                        if (action.args.hasOwnProperty(j)) {
                            var arg = action.args[j];
                            if (arg.dir.toLowerCase() == "in") {
                                args.push(JSON.parse(args2[arg.name]));
                            }
                        }
                    }
                }
            }
            var result = impl[obj.actionName].apply(obj, args);
            if (typeof result != 'undefined') {
                processResult(result, obj);
            }
        }
        else {
            NSDPlusPlus.logger("unimplemented action " + obj.actionName + " in locally exposed service");
        }
    }

    //
    // message sent by the agent when someone else calls an action of a bonjour service exposed by this atom
    //
    messageHandlers.callAction = function (obj) {
        // when someone else calls an action of a service exposed by this atom
        // TODO: this code assumes one service per page, so the serviceID is ignored --> allow more services and deal with serviceId
        serviceActionInternal(obj, serviceImplementations[0], obj["arguments"]);
    };

    //
    // message sent by the agent when someone else calls an action of a bonjour service exposed by this atom
    //
    messageHandlers.callAction2 = function (obj) {
        // when someone else calls an action of a service exposed by this atom
        // TODO: this code assumes one service per page, so the serviceID is ignored --> allow more services and deal with serviceId
        var impl = serviceImplementations[0];
        if (typeof impl[obj.actionName] == 'function') {
            // prepare the arguments from the service action description, one arg per argument described as 'in'
            var args = [];
            args.push(obj["arguments"]);
            var result = impl[obj.actionName].apply(obj, args);
            if (typeof result != 'undefined') {
                processResult(result, obj);
            }
        } else {
            NSDPlusPlus.logger("unimplemented action " + obj.actionName + " in locally exposed service");
        }
    };

    function processResult(result, obj) {
        // check that all returned values are strings
        for (var i in result) {
            if (result.hasOwnProperty(i) && typeof result[i] != 'string') {
                result[i] = "" + result[i];
                NSDPlusPlus.logger("reply argument " + i + " of " + obj.actionName + " has a non-string value");
            }
        }
        var answer = {};
        answer.purpose = 'reply';
        answer["arguments"] = result;
        answer.callBack = obj.replyCallBack;
        if (obj.hasOwnProperty("address")) {
            answer.address = obj.address;
            answer.replyPort = obj.replyPort;
            if (obj.hasOwnProperty("originAtom")) {
                answer.originAtom = obj.originAtom;
            }
            answer.serviceId = obj.serviceId;
            answer.actionName = obj.actionName;
        }
        conn.send(JSON.stringify(answer));
    }

    //
    // end internal: msg handlers
    //

    //
    // looser version of getNetworkServices, searching for a substring of the type
    // to be independent from the actual protocol
    //
    NSDPlusPlus.discover = function (serviceTypeFragment, callBack, errorCallBack) {
        var result = new NetworkServices();
        // look for services already discovered
        getAlreadyDiscoveredServices1(serviceTypeFragment, callBack, errorCallBack, result);
        // register a callback for future discoveries
        registerSpecificServicesCallback1(serviceTypeFragment, result);
        //networkServicesArray.push(result);
    };

    function getAlreadyDiscoveredServicesInternal1(serviceTypeFragment, result) {
        for (var i = 0; i < discoveredServices.length; i++) {
            var service = discoveredServices[i];
            if (service.type.indexOf(serviceTypeFragment) >= 0) {
                result.push(service);
                result.servicesAvailable++;
            }
        }
    }

    //noinspection JSUnusedLocalSymbols
    function getAlreadyDiscoveredServices1(serviceTypeFragment, callBack, errorCallBack, result) {
        if (typeof serviceTypeFragment == "string") {
            // single type requested
            getAlreadyDiscoveredServicesInternal1(serviceTypeFragment, result);
        } else {
            // multiple types requested
            for (var i = 0; i < serviceTypeFragment.length; i++) {
                getAlreadyDiscoveredServicesInternal1(serviceTypeFragment[i], result);
            }
        }
        callBack.call(null, result);
    }

    function registerSpecificServicesCallback1(serviceTypeFragment, networkServices) {
        if (typeof serviceTypeFragment == "string") {
            if (newServiceTypeCallback(serviceTypeFragment)) {
                specificServiceDiscoveredCallbacks.push(new SpecificServiceCallBack1(serviceTypeFragment, networkServices));
            }
        } else {
            // multiple types requested
            for (var i = 0; i < serviceTypeFragment.length; i++) {
                if (newServiceTypeCallback(serviceTypeFragment)) {
                    specificServiceDiscoveredCallbacks.push(new SpecificServiceCallBack1(serviceTypeFragment[i], networkServices));
                }
            }
        }
    }

    function SpecificServiceCallBack1(serviceTypeFragment, networkServices) {
        this.type = serviceTypeFragment;
        this.networkServices = networkServices;
    }

    SpecificServiceCallBack1.prototype.compare = function (service) {
        return service.type.indexOf(this.type) >= 0;
    };

    ///////////////////////////////////////////////////////////////////////////////
    ////// section for Network Service Discovery //////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////
    var specificServiceDiscoveredCallbacks = []; //, networkServicesArray = [];

    NSDPlusPlus.getNetworkServices = function (serviceType, callBack, errorCallBack) {
    	var discoveredCallback = null;
    	for (var i = 0; i < specificServiceDiscoveredCallbacks.length; i++) {
    		if (serviceType == specificServiceDiscoveredCallbacks[i].type) {
    			discoveredCallback = specificServiceDiscoveredCallbacks[i];
    			break;
            }
    	}
    	
    	var networkServices;
    	
    	if (discoveredCallback) {
    		networkServices = discoveredCallback.networkServices;
    	} else {
    		networkServices = new NetworkServices();
    	}
        
        // look for services already discovered
        getAlreadyDiscoveredServices(serviceType, callBack, errorCallBack, networkServices);
        // register a callback for future discoveries
        registerSpecificServicesCallback(serviceType, networkServices);
        //networkServicesArray.push(result);
    };

    function getAlreadyDiscoveredServicesInternal(serviceType, result) {
        for (var i = 0; i < discoveredServices.length; i++) {
            var service = discoveredServices[i];
            if (service.type == serviceType) {
            	var found = false;
            	for (var j = 0; j < result.length; j++) {
            		if (result[j].id == service.id) {
            			found = true;
            			break;
            		}
            	}
            	if (!found) {
            		result.push(service);
            		//result.servicesAvailable++;
            	}
            }
        }
    }

    //noinspection JSUnusedLocalSymbols
    function getAlreadyDiscoveredServices(serviceType, callBack, errorCallBack, result) {
        if (typeof serviceType == "string") {
            // single type requested
            getAlreadyDiscoveredServicesInternal(serviceType, result);
        } else {
            // multiple types requested
            for (var i = 0; i < serviceType.length; i++) {
                getAlreadyDiscoveredServicesInternal(serviceType[i], result);
            }
        }
        callBack.call(null, result);
    }

    function registerSpecificServicesCallback(serviceType, networkServices) {
        if (typeof serviceType == "string") {
            if (newServiceTypeCallback(serviceType)) {
                specificServiceDiscoveredCallbacks.push(new SpecificServiceCallBack(serviceType, networkServices));
            }
        } else {
            // multiple types requested
            for (var i = 0; i < serviceType.length; i++) {
                if (newServiceTypeCallback(serviceType[i])) {
                    specificServiceDiscoveredCallbacks.push(new SpecificServiceCallBack(serviceType[i], networkServices));
                }
            }
        }
    }

    function newServiceTypeCallback(serviceType) {
        for (var i = 0; i < specificServiceDiscoveredCallbacks.length; i++) {
            if (serviceType == specificServiceDiscoveredCallbacks[i].type) {
                return false;
            }
        }
        return true;
    }

    function SpecificServiceCallBack(serviceType, networkServices) {
        this.type = serviceType;
        this.networkServices = networkServices;
    }

    SpecificServiceCallBack.prototype.compare = function (service) {
        return this.type == service.type;
    };

    //NetworkServices.prototype = [];

    function NetworkServices() {
    	var r = [];
        r.servicesAvailable = 0;
        r.onserviceavailable = null;
        r.onserviceunavailable = null;
        return r;
    }

    NSDPlusPlus.wrapInNetworkServices = function (service) {
        var ns = new NetworkServices();
        ns.push(service);
        ns.servicesAvailable = 1;
        return ns;
    };

    NSDPlusPlus.getEmptyNetworkServices = function (service) {
        return new NetworkServices();
    };

    //noinspection JSUnusedGlobalSymbols
    NetworkServices.prototype.getServiceById = function (id) {
        for (var service in this) {
            if (this.hasOwnProperty(service) && service.id == id) {
                return service;
            }
        }
        return null;
    };

    //
    // internal: call all callbacks for service discovery
    // obj is an array of services
    //
    NSDPlusPlus.callServiceDiscoveredCallbacks = function (obj) {
        for (var cb = 0; cb < specificServiceDiscoveredCallbacks.length; cb++) {
            for (var i = 0; i < obj.length; i++) {
                var service = obj[i];
                if (specificServiceDiscoveredCallbacks[cb].compare(service)) {
                    var networkServices = specificServiceDiscoveredCallbacks[cb].networkServices;
                    // we know it is a new service, otherwise it would have been filtered in the caller
                    networkServices.servicesAvailable++;
                    if (typeof networkServices.onserviceavailable == 'function') {
                        networkServices.onserviceavailable.call(null);
                    }
                    // if it is this service, mark as online and call onserviceonline
                    for (var j = 0; j < networkServices.length; j++) {
                        if (networkServices[j].id == service.id) {
                            networkServices[j].online = true;
                            if (typeof networkServices[j].onserviceonline == 'function') {
                                networkServices[j].onserviceonline.call(null);
                            }
                        }
                    }
                }
            }
        }
    };

    //
    // internal: call all callbacks for service removal
    // obj is an array of services
    //
    NSDPlusPlus.callServiceRemovedCallbacks = function (obj) {
        for (var cb = 0; cb < specificServiceDiscoveredCallbacks.length; cb++) {
            for (var i = 0; i < obj.length; i++) {
                var service = obj[i];
                if (specificServiceDiscoveredCallbacks[cb].compare(obj[i])) {
                    var networkServices = specificServiceDiscoveredCallbacks[cb].networkServices;
                    // we know it is a removed service, otherwise it would have been filtered in the caller
                    networkServices.servicesAvailable--;
                    if (typeof networkServices.onserviceunavailable == 'function') {
                        networkServices.onserviceunavailable.call(null);
                    }
                    // if it is this service, mark as online=false and call onserviceoffline
                    for (var j = 0; j < networkServices.length; j++) {
                        if (networkServices[j].id == service.id) {
                            networkServices[j].online = false;
                            if (typeof networkServices[j].onserviceoffline == 'function') {
                                networkServices[j].onserviceoffline.call(null);
                            }
                        }
                    }
                }
            }
        }
    };
}());

// to maintain the original API
var NSD = {};
NSD.getNetworkServices = NSDPlusPlus.getNetworkServices;

/////////////////////////////////////////////////////
//// Events  ////////////////////////////////////////
/////////////////////////////////////////////////////

(function (discoveredServices, connectedCallbacks, initializedCallbacks) {
    //
    // event callbacks
    //
    var serviceDiscoveredCallbacks = [];
    var serviceRemovedCallbacks = [];
    // end event callbacks

    //
    // add event listener (generic mechanism)
    //
    NSDPlusPlus.addEventListener = function (eventType, callBack) {
        if (typeof callBack != 'function') {
            return;
        }
        switch (eventType) {
            case "serviceDiscovered":
                serviceDiscoveredCallbacks.push(callBack);
                break;
            case "serviceRemoved":
                serviceRemovedCallbacks.push(callBack);
                break;
            case "connected":
                connectedCallbacks.push(callBack);
                break;
            case "initialized":
                // special case for initialized: if the event is in the past, call the callback now
                if (NSDPlusPlus.initialized) {
                    callBack.call();
                }
                else {
                    initializedCallbacks.push(callBack);
                }
                break;
            default:
                NSDPlusPlus.logger("unknown event " + eventType);
                break;
        }
    };

    //
    // remove event listener (generic mechanism)
    //
    NSDPlusPlus.removeEventListener = function (eventType, callBack) {
        if (typeof callBack != 'function') {
            return;
        }
        switch (eventType) {
            case "serviceDiscovered":
                serviceDiscoveredCallbacks.remove(callBack);
                break;
            case "serviceRemoved":
                serviceRemovedCallbacks.remove(callBack);
                break;
            case "connected":
                connectedCallbacks.remove(callBack);
                break;
            case "initialized":
                initializedCallbacks.remove(callBack);
                break;
            default:
                NSDPlusPlus.logger("unknown event " + eventType);
                break;
        }
    };

    NSDPlusPlus.addMessageHandler("serviceDiscovered", function (obj) {
        //NSDPlusPlus.logger("service discovered " + obj.services.length);
        var i, newServices = [];
        for (i = 0; i < obj.services.length; i++) {
            if (!NSDPlusPlus.isDiscovered(obj.services[i])) {
                NSDPlusPlus.addDiscoveredService(obj.services[i]);
                //NSDPlusPlus.logger("D:" + obj.services[i].type + " " + obj.services[i].name);
                newServices.push(obj.services[i]);
            }
        }
        if (newServices.length > 0) {
            callServiceDiscoveredCallbacks(newServices);
        }
    });

    //
    // special remove for array of objects
    //
    function removeSpecial(array, object) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].id == object.id &&
                    array[i].name == object.name &&
                    array[i].type == object.type) {
                array.splice(i, 1);
                return;
            }
        }
    }

    NSDPlusPlus.addMessageHandler("serviceRemoved", function (obj) {
        var i, removedServices = [];
        for (i = 0; i < obj.services.length; i++) {
            if (NSDPlusPlus.isDiscovered(obj.services[i])) {
                removeSpecial(discoveredServices, obj.services[i]);
                removedServices.push(obj.services[i]);
            }
        }
        //NSDPlusPlus.logger("R:"+obj.purpose+" "+obj.name);
        if (removedServices.length > 0) {
            callServiceRemovedCallbacks(removedServices);
        }
    });

    //
    // internal: call all callbacks for service discovery
    //
    function callServiceDiscoveredCallbacks(obj) {
        for (var cb in serviceDiscoveredCallbacks) {
            if (serviceDiscoveredCallbacks.hasOwnProperty(cb) &&
                    typeof serviceDiscoveredCallbacks[cb] == 'function') {
                serviceDiscoveredCallbacks[cb].call(obj);
            }
        }
        NSDPlusPlus.callServiceDiscoveredCallbacks(obj);
    }

    //
    // internal: call all callbacks for service removal
    //
    function callServiceRemovedCallbacks(obj) {
        for (var cb in serviceRemovedCallbacks) {
            if (serviceRemovedCallbacks.hasOwnProperty(cb) &&
                    typeof serviceRemovedCallbacks[cb] == 'function') {
                serviceRemovedCallbacks[cb].call(obj);
            }
        }
        NSDPlusPlus.callServiceRemovedCallbacks(obj);
    }

}(NSDPlusPlus.discoveredServices, NSDPlusPlus.connectedCallbacks, NSDPlusPlus.initializedCallbacks));

// NSDPlusPlus.discoveredServices is only exposed temporarily to allow the event module
// to use it. The next line removes that exposure.
// NSDPlusPlus.discoveredServices = null;
//NSDPlusPlus.connectedCallbacks = null;
NSDPlusPlus.initializedCallbacks = null;