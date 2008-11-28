(function(){

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

    var depot;

    function Depot(events_data_url, big_events_data_url, characters_data_url) {
	var characters = new Array();
	var characters_hash = new Hash();
	var characters_node = new Array();
	
	var events = new Array();
	var events_hash = new Hash();
	
	var big_events = new Array();
	var big_events_node = new Array();
	
	var markers = new Array();
	var marker_hash = new Hash();
	var loadEvents = function(url) {
	    alert(1);
	    _IG_FetchContent(url, function(data){
		    var value = eval('(' + data + ')');
		    $.each(value, function(index, raw_event){
			    var event = new Event(raw_event);
			    var event_marker = new EventMarker(event);
			    events.push(event);
			    events_hash.setItem(event.name, event);
			    markers.push(event_marker);
		            marker_hash.setItem(event.name, event_marker);
			});
		})
	};
	
	var loadBigEvents = function(url) {
		_IG_FetchContent(url, function(data) {
			var value = eval(data);
			$.each(value, function(index, raw_big_event){
				var big_event = new BigEvent(raw_big_event);
				var big_event_node = new BigEventNode(big_event);
				big_events.push(big_event);
				big_events_node.push(big_event_node);
			})
		})
	}
	
	var loadCharacters = function(url) {
	    _IG_FetchContent(url, function(data){
		    var value = eval(data);
		    $.each(value, function(index, raw_character){
			    var character = new Character(raw_character);
			    var character_node = new CharacterNode(character, '');
			    characters.push(character);
			    characters_hash.setItem(character.name, character);
			    characters_node.push(character_node);
			});
		});
	};
	loadEvents(events_data_url);
	loadBigEvents(big_events_data_url);
	loadCharacters(characters_data_url);

	this.getEvents = function() {
	    return events;
	};

	this.getEventsHash = function() {
	    return events_hash;
	};

	this.getBigEventsNode = function() {
	    return big_events_node;
	}

        this.getCharactersNode = function() {
            return characters_node;
        };

	this.getMarkers = function() {
	    return markers;
	};
	
	this.getMarkerHash = function() {
	    return marker_hash;
	};
    };


    function TabManager(in_tabs, active_tab) {
	var tabs = new Array();
	var current_tab = '';
	
	var shiftTab = function(active_tab) {
	    if (active_tab == current_tab)
		return;
	    $.each(tabs, function(index, tab){
		    var tab_container = $('#' + tab + '_cnt');
		    var tab_head = $('#' + tab + '_tab');
		    if (tab == active_tab) {
			tab_container.show();
			tab_head.removeClass('tab_item');
			tab_head.addClass('tab-item active-tab');
		    }
		    else {
			tab_container.hide();
			tab_head.removeClass('tab-item active-tab');
			tab_head.addClass('tab-item');
		    } 
		});
	};

	$.each(in_tabs, function(index, tab){
		$('#' + tab + '_tab').click(function(){
			shiftTab(tab);
		    });
		tabs.push(tab);
	    });
       
	shiftTab(active_tab);
    };

    function Character(raw_character) {
	this.name = raw_character.n;
	this.nickname = raw_character.nn;
	this.title = raw_character.t;
	this.birth = raw_character.b;
	this.dead = raw_character.dd;
	this.description = raw_character.d;
	this.kingdom = raw_character.k;
	this.img_url = raw_character.i;
	this.event_names = new Array();
	
	var temp_name = this.name;
	var temp_event_names = this.event_names;
	$.each(depot.getEvents(), function(index, event){
		var appear = false
		$.each(event.characters, function(index, name) {
			if (temp_name == name) {
			    appear = true;
			    return false;
			}
		    });
		if (appear) {
		    temp_event_names.push(event.name);
		}
	 });
    };

    
    function CharacterNode(in_character, parent_node) {
	
	var character = in_character;
		
	var genDigestNode = function() {
	    var node = $('<div class="character-digest-div"></div>');
	    //var digest =  $('<p>' + character.description.substring(0,50) + '...</p>');
	    //var detail = $('<p>' + character.description.substring(50) + '</p>');
	    var digest =  $('<span>' + character.description.substring(0,50) + '</span>');
	    var detail = $('<span>' + character.description.substring(50) + '</span>');
	    var show_detail = $('<span>...</span><a href=#>更多 &raquo;</a>');
	    var hide_detail = $('<a href=#>&laquo; 折叠</a>');

	    //digest.append(show_detail);
	    //detail.append(hide_detail);

	    show_detail.click(function(){
		    //digest.hide();
        show_detail.hide();
        hide_detail.show()
		    detail.slideDown('slow');
		    return false;
		});

	    hide_detail.click(function(){
		    //digest.show();
        hide_detail.hide();
        show_detail.show();
        detail.hide();
		    return false;
		});
	    
	    node.append(digest);
	    node.append(detail);
      node.append(show_detail);
      node.append(hide_detail);
      hide_detail.hide();
	    detail.hide();
	    return node;
	};
	
	var genEventListNode = function(parent) {
	    var node = $('<div class="events-div"><div>');
	    var show_events = $('<a href=#>历史事件</a>');
	    var hide_events = $('<a href=#>隐藏</a>');
	    var event_list = $('<div></div>');
	    var event_marker_hash = depot.getMarkerHash();
	    $.each(character.event_names, function(index, event_name){
		    var event = depot.getEventsHash().getItem(event_name);
		    var event_item = $('<div></div>');
		   
		    event_item.append(event.time + '&nbsp;');
		    event_item.append(event.place + '&nbsp;');

		    var event_link = $('<a href=#>' + event.name + '</a>');
	
		    event_link.click(function(){
			var marker = event_marker_hash.getItem(event_name);
		        marker.openInfoWindow();
		    });
		    event_item.append(event_link);
		    event_list.append(event_item);
		});
	    
	    show_events.click(function(){
		    event_list.slideDown('slow');
		    hide_events.show();
		    show_events.hide();
		    rcmap.updateShownEvents(character.event_names);
		    return false;
		});

	    hide_events.click(function(){
		    event_list.slideUp('slow');
		    show_events.show();
		    hide_events.hide();
		    return false;
	    });

	    node.append(show_events);
	    node.append(hide_events);
	    node.append(event_list);
	    hide_events.hide();
	    event_list.hide();
	    return node;
	};
	

	var genNode = function(parent) {
	    var node = $('<li class="character-item"></li>');
	    var img_node = $('<div class="character-img-div"></div>');
	    img_node.append('<img width=70 heigth=70 src="' + character.img_url + '"></img>');
	    var intro_node = $('<div class="character-intro-div"></div>');
	    intro_node.append('<p class="character-title">' + character.name + '&nbsp;字' + 
			      character.nickname + '</p>');
	    intro_node.append(genDigestNode());
	    node.append(img_node);
	    node.append(intro_node);
	    intro_node.append(genEventListNode());

	    $('#character_list').append(node);
	    //node.hide();
	    return node;
	};

	this.node = genNode(parent_node);
	this.is_shown = true;
	this.getCharacter = function() {
            return character;
        };
    };
    

    CharacterNode.prototype = {
      showNode: function() {
            if (this.is_shown)
                 return;
	    //this.node.show();
      this.node.fadeIn();
            this.is_shown = true;
      },
      
      hideNode: function() {
            if (!this.is_shown)
                 return;
	    //this.node.hide();
      this.node.fadeOut();
            this.is_shown = false;
      },
    };  

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

	var temp_characters = this.characters;
	$.each(raw_event.c, function(index, character_name){
		temp_characters.push(character_name);
	    });
    };

function EventMarker(in_event) {
	var event = in_event;
	this.marker = new GMarker(new GLatLng(event.lat, event.lng));
	this.infowindow_html = '<div class="infowindow-div">' + event.description + '</div>'
	rcmap.addMarkerOnMap(this.marker);
	var me = this;
	GEvent.addListener(this.marker, 'click', function(){
		me.marker.openInfoWindowHtml(me.infowindow_html);
	})
};

EventMarker.prototype = {
	openInfoWindow: function(){
		this.marker.openInfoWindowHtml(this.infowindow_html);
	},
	showMarker: function(){
		this.marker.show();
	},
	hideMarker: function(){
		this.marker.closeInfoWindow();
		this.marker.hide();
	},
}

function BigEvent(raw_big_event) {
	var me = this;
	this.name = raw_big_event.n;
	this.description = raw_big_event.d;
	this.start = raw_big_event.s;
	this.end = raw_big_event.e;
	this.event_names = new Array();

	$.each(raw_big_event.el, function(index, event_name){
		me.event_names.push(event_name);
	});
}

function BigEventNode(in_big_event) {
	var big_event = in_big_event;
	this.big_event = in_big_event;
	var is_details_shown = false;
	var genNode = function() {
		var node = $('<li class="big-event-item"></li>');
    var title = $('<div class="big-event-title"></div>');
		node.append(title);
    title.append('<span class="big-event-time">' + big_event.start + '</span>');
	        var link = $('<a href=#>' + big_event.name + '</a>');
		var event_list = genEventListNode();
		
		title.append(link);
		var details = $('<div></div>');
		details.append('<br>');
		details.append($('<p>' + big_event.description + '</p>'));
		var img = $('<div></div>');
		img.append($('<img class="event_img" src="../media/images/pic1.jpg"></img>'));
		img.append($('<img class="event_img" src="../media/images/pic2.jpg"></img>'));
		details.append(img);
		details.append(event_list);
		details.append('<br>');
		details.hide();
		node.append(details);
		title.click(function(){
			if (is_details_shown) {
        node.removeClass('expanded');
				details.slideUp('slow');
				is_details_shown = false;
			}
			else {
        node.addClass('expanded');
        details.slideDown('slow');
				is_details_shown = true;
			}
			rcmap.updateShownEvents(big_event.event_names);
		});
		$('#big_event_list').append(node);
		return node;
	};

	var genEventListNode = function() {
	    var node = $('<div class="events-div"><div>');
	    var event_marker_hash = depot.getMarkerHash();
	    $.each(big_event.event_names, function(index, event_name){
		    var event = depot.getEventsHash().getItem(event_name);
		    var event_item = $('<div></div>');
		   
		    event_item.append(event.time + '&nbsp;');
		    event_item.append(event.place + '&nbsp;');

		    var event_link = $('<a href=#>' + event.name + '</a>');
	
		    event_link.click(function(){
			var marker = event_marker_hash.getItem(event_name);
		        marker.openInfoWindow();
		    });
		    event_item.append(event_link);
		    node.append(event_item);
		});
	    return node;
	};

	this.node = genNode();
	this.is_shown = true;
};

BigEventNode.prototype = {
    showNode: function() {
	if (this.is_shown)
		return;
	this.node.show();
	this.is_shown = true;
    },

    hideNode: function() {
	if (!this.is_shown)
		return;
	this.node.hide();
	this.is_shown = false;
    },
};




function CharacterFilter() {
  var filter = function() {
     var nodes = depot.getCharactersNode();
     var shu_selected = false;
     var wei_selected = false;
     var wu_selected = false;
     if ($('#checkbox_shu').attr('checked'))
	shu_selected = true;
     if ($('#checkbox_wei').attr('checked'))
	wei_selected = true;
     if ($('#checkbox_wu').attr('checked'))
	wu_selected = true;
     $.each(nodes, function(index, character_node){
        if (character_node.getCharacter().kingdom == 'shu') {
           if (shu_selected)
              character_node.showNode();
           else
              character_node.hideNode();
        }   
        if (character_node.getCharacter().kingdom == 'wei') {
           if (wei_selected)
              character_node.showNode();
           else
              character_node.hideNode();
        }
        if (character_node.getCharacter().kingdom == 'wu') {
           if (wu_selected)
              character_node.showNode();
           else
              character_node.hideNode();
        }
     });
  };
  $('#checkbox_shu').click(filter);
  $('#checkbox_wei').click(filter);
  $('#checkbox_wu').click(filter);  
};


function RedcliffMap(node) {
	this.gmap = new GMap2();
        this.gmap.setCenter(new GLatLng(30.917, 110.397), 5);
};


RedcliffMap.prototype = {
	addMarkerOnMap: function(marker) {
		this.gmap.addOverlay(marker);
        },
	updateShownEvents: function(event_names) {
		$.each(depot.getMarkers(), function(index, event_marker){
			event_marker.hideMarker();
		});
		var event_marker_hash = depot.getMarkerHash();
		$.each(event_names, function(index, event_name){
			var marker = event_marker_hash.getItem(event_name);
			marker.showMarker();
		});
	},
};

var rcmap;

function SliderBar() {
	var start = 200;
	var end = 215;
	var current = 208;
	var time_scale = 16;
        var captionVisible = false;  
       	$('.slider_bar').slider({  
           handle: '.slider_handle',  
           startValue: 50,  
           minValue: 0,
           maxValue: 100,  
 
           stop: function(e, ui) {   
 		   current = Math.round((ui.value / 100) * time_scale) + start;
 		   if (current > end)
 		   	current = end
 		   setPosition();
 		   $('#slider_indicater').html('公元' +current + '年');
           },
        });  
 	
 	var filter = function() {
 		var nodes = depot.getBigEventsNode();
 		$.each(nodes, function(index, node) {
 			if (node.big_event.start <= current && node.big_event.end >= current)
 				node.showNode();
 			else
 				node.hideNode();
 		});
 	} 	
 	
 	var setPosition = function() {
 		$('.slider_handle').css('left', (current - start) / time_scale * 180);
 		$('#slider_indicater').html('公园' +current + '年');
 		filter();
 	}

 	 $(".add").click(function(){
    		current = current + 1;
    		if (current > end)
    			current = end;
    		setPosition();
    		return false	;
  	});  

  	$(".minus").click(function(){
    		current = current - 1;
    		if (current < start)
    			current = start;
    		setPosition();
    		return false;
  	});
}


$(function(){

       
	var slider = SliderBar();

        var map_node = document.getElementById("map_canvas");
	rcmap = new RedcliffMap(map_node);       
	var tab_manager = new TabManager(['events','characters'], 'events');
	depot = new Depot(
	'http://redcliff.googlecode.com/svn/trunk/dev/data/events.json',
	'http://redcliff.googlecode.com/svn/trunk/dev/data/big_events.json',
	'http://redcliff.googlecode.com/svn/trunk/dev/data/characters.json');
	var character_filter = new CharacterFilter();
    });

})();
