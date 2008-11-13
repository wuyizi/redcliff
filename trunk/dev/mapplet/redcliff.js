/* Interface

var Interface = function(name, methods) {
    if(arguments.length != 2) {
        throw new Error("Interface constructor called with " + arguments.length +
			"arguments, but expected exactly 2.");
    }
    this.name = name;
    this.methods = [];
    for(var i = 0, len = methods.length; i < len; i++) {
        if(typeof methods[i] !== 'string') {
            throw new Error("Interface constructor expects method names to be "
			    + "passed in as a string.");
        }
        this.methods.push(methods[i]);
    }
};

Interface.ensureImplements = function(object) {
    if(arguments.length < 2) {
        throw new Error("Function Interface.ensureImplements called with " +
			arguments.length + "arguments, but expected at least 2.");
    }
    for(var i = 1, len = arguments.length; i < len; i++) {
        var interface = arguments[i];
        if(interface.constructor !== Interface) {
            throw new Error("Function Interface.ensureImplements expects arguments"
			    + "two and above to be instances of Interface.");
        }
        for(var j = 0, methodsLen = interface.methods.length; j < methodsLen; j++) {
            var method = interface.methods[j];
            if(!object[method] || typeof object[method] !== 'function') {
                throw new Error("Function Interface.ensureImplements: object "
				+ "does not implement the " + interface.name
				+ " interface. Method " + method + " was not found.");
            }
        }
    }
};

/* Interface end

// Hash Table

function Hash(){
    this.length = 0;
    this.items = new Array();
	
    for (var i = 0; i < arguments.length; i += 2) {
	if (typeof(arguments[i + 1]) != 'undefined') {
	    this.items[arguments[i]] = arguments[i + 1];
	    this.length++;
	}
    }
};

Hash.prototype = {
    removeItem: function(in_key) {
	var tmp_value;
	if (typeof(this.items[in_key]) != 'undefined') {
	    this.length--;
	    tmp_value = this.items[in_key];
	    delete this.items[in_key];
	}
	return tmp_value;
    },

    getItem: function(in_key) {
	return this.items[in_key];
    },
    
    setItem: function(in_key, in_value) {
	if (typeof(in_value) != 'undefined') {
	    if (typeof(this.items[in_key]) == 'undefined') {
		this.length++;
	    }
	    this.items[in_key] = in_value;
	}
	return in_value;
    },
	
    hasItem: function(in_key) {
	return typeof(this.items[in_key]) != 'undefined';
    },

    getLength: function(){
	return this.length;
    },
};

// Hash Table end

// Character

function Character(raw_character) {
    this.id = raw_character.id;
    this.name = raw_character.n;
    this.nickname = raw_character.nn;
    this.title = raw_character.t;
    this.birth = raw_character.b;
    this.dead = raw_character.dd;
    this.description = raw_character.d;
    this.group = raw_character.g;
    this.img = raw_character.i;
    this.overlay_tile = raw_character.ot;
    this.event = new Array();

    $.each(raw_character.e, function(index, event_id){
	    this.event.push(event_id);
	});
};


function CharacterNode(in_character, parent_node) {
    var character = in_character;
    var isDescriptionExtended = false;
    
    this.node = genNode(parent_node);
    this.digest_node = genDigestNode(parent_node);
    this.event_list_node = genEventListNode(parent_node);

    var genNode = function(parent) {
    };

    var genDigestNode = function(parent) {
    };

    var genEventListNode = function(parent) {
    };

    var extendDescription = function() {
    };

    var hideDescription = function() {
    };

    var showEventListNode = function() { 
    };

    var hideEventListNode = function() {
    };

    var addListeners = function() {
    };	

};

CharacterNode.prototype = {
    showNode: function() {
    },

    hideNode: function() {
    },

    addNode: function() {
    },
};

// Character end

// Event

function Event(raw_event) {
    this.name = raw_event.n;
    this.place = raw_event.p;
    this.time = raw_event.t;
    this.duration = raw_event.du;
    this.description = raw_event.d;
    this.img = raw_event.i;
    this.lat = raw_event.lat;
    this.lng = raw_event.lng;
    this.type = raw_event.type;
    this.characters = new Array();
    $.each(raw_event.c, function(index, character_id){
	    this.character.push(character_id);
	});
};

function EventNode(in_event, parent_node) {
    var event = event;
    this.node = genNode(parent_node);
    
    var genNode = function(parent) {
    };

    var addListeners = function() {
    };
};


EventNode.prototype = {
    showNode: function() {
    },

    hideNode: function() {
    },

    addNode: function() {
    },
};

function EventMarker(in_event) {
    var event = event;
    this.marker = genMarker();
    this.infowindowHtml = genInfowindowHtml();

    var genMarker = function() {
    };

    var genInfowindowHtml = function() {
    };

    var addListeners = function() {
    };
};

EventMarker.prototype = {
    showMarker: function() {
    },

    hideMarker: function() {
    },

    addMarker: function() {
    },

    openInfowindow: function() {
    }
};
// Event end

// Filter

function CharacterFilter(){
};

function PeriodFilter() {
};

// Filter end

// Redcliff Map

function RedcliffMap() {
    var map = genMap();
    var current_marker = new Array();
    var genMap = function() {
    };
};

RedcliffMap.prototype = {
    updateMap: function(overlay_tile_id, event_list) {
    },

    openInfowindow: function(event_id) {
    },   
};

// Redcliff Map end
