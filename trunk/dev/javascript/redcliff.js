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
	
	var LOCATION = new Hash();
	var ELEMENT = new Hash();
	var EVENT = new Hash();
	var BIG_EVENT = new Hash();
	var PEOPLE = new Hash();
	
	var CURRENT_EVENT_HASH = new Hash();
	var CURRENT_ELEMENT_HASH = new Hash();
	var CURRENT_EVENT = Array();
	var CURRENT_ELEMENT = new Array();
	var HIGH_LIGHT_ELEMENT = new Array();
	var CURRENT_OVERLAY_ID = "";
	var BASE_URL = 'http://redcliff.googlecode.com/svn/trunk/dev/'
	var URL = {
		location_url: BASE_URL + 'data/location.json',
		element_url: BASE_URL + 'data/element.json',
		event_url: BASE_URL + 'data/event.json',
		big_event_url: BASE_URL + 'data/big_event.json',
		people_url: BASE_URL + 'data/people.json',
	};

	var G_MAP;
	
	var C_POLYLINE_WEIGHT = 3;
 	var C_POLYLINE_WEIGHT_HIGHLIGHT = 6;
	var C_POLYLINE_OPACITY = 0.5;
	var C_POLYLINE_OPACITY_HIGHLIGHT = 1.0;
	var C_ROTATION_DEGREE = 15 * Math.PI/180;
	var C_ARROW_LENGTH = 10;	
	
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
			    		} else {
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
	
	function Location(raw_location) {
		var me = this;
		this.location = raw_location;
		this.name = location.name;
		this.point = new GLatLng(raw_location.lng, raw_location.lat);
	};
	
	
	function Element(raw_element) {
		var me = this;
		this.id = raw_element.id
		this.element = raw_element;
		this.type = raw_element.type;
		
		var computeArrowPolygon = function(start, end) {
			var projection = G_NORMAL_MAP.getProjection();
			var point_start = projection.fromLatLngToPixel(start, 7);
			var point_end = projection.fromLatLngToPixel(end, 7);
			
			
			var delta_x = (point_start.x - point_end.x);
			var delta_y = (point_start.y - point_end.y);
			var p_length = Math.sqrt(delta_x * delta_x + delta_y * delta_y);
			var rate = C_ARROW_LENGTH / p_length;
			
			var arrow_start = new GPoint(point_end.x - delta_x * rate, point_end.y - delta_y * rate); 
			var arrow_end = point_end;
			
			var delta_x = arrow_end.x - arrow_start.x;
			var delta_y = arrow_end.y - arrow_start.y;
			
			var offset = new GPoint();
			offset.x = delta_x * Math.cos(C_ROTATION_DEGREE) - delta_y * Math.sin(C_ROTATION_DEGREE);
			offset.y = delta_x * Math.sin(C_ROTATION_DEGREE) + delta_y * Math.cos(C_ROTATION_DEGREE);
			var arrow_b = new GPoint();
			arrow_b.x = arrow_start.x + offset.x;
			arrow_b.y = arrow_start.y + offset.y;
			
			offset.x = delta_x * Math.cos(-C_ROTATION_DEGREE) - delta_y * Math.sin(-C_ROTATION_DEGREE);
			offset.y = delta_x * Math.sin(-C_ROTATION_DEGREE) + delta_y * Math.cos(-C_ROTATION_DEGREE);
			var arrow_c = new GPoint();
			arrow_c.x = arrow_start.x + offset.x;
			arrow_c.y = arrow_start.y + offset.y;
			
			var arrow_a = arrow_start;
			var arrow_a_latlng = projection.fromPixelToLatLng(arrow_a, 7);
			var arrow_b_latlng = projection.fromPixelToLatLng(arrow_b, 7);
			var arrow_c_latlng = projection.fromPixelToLatLng(arrow_c, 7);
			var polygon = new GPolygon([arrow_a_latlng, arrow_b_latlng, arrow_c_latlng, arrow_a_latlng], "#0000ff", 1, 1, "#0000ff", 1);
			return polygon;
		}
		
		if (this.type == 'point') {
			this.point = LOCATION.getItem(raw_element.p1).point;		
			this.icon_url = raw_element.icon_url;
			this.overlay = new GMarker(this.point);
			this.highlight_overlay = this.overlay;
			GEvent.addListener(this.overlay, 'click', function() {
				G_MAP.openInfoWindow("ELEMENT", me.id, me.point);
			});
		} else {
			this.start = LOCATION.getItem(raw_element.p1).point;
			this.end = LOCATION.getItem(raw_element.p2).point;
			this.linecolor = raw_element.color;
			this.offset = raw_element.offset;
			this.overlay = new GPolyline([this.start, this.end], this.color, C_POLYLINE_WEIGHT, C_POLYLINE_OPACITY);
			this.arrow = computeArrowPolygon(this.start, this.end);
			this.highlight_overlay = new GPolyline([this.start, this.end], "#FF0000", C_POLYLINE_WEIGHT_HIGHLIGHT, C_POLYLINE_OPACITY_HIGHLIGHT);
			GEvent.addListener(this.overlay, 'click', function(latlng) {
				G_MAP.openInfoWindow("ELEMENT", me.id, latlng);
			});	
			GEvent.addListener(this.highlight_overlay, 'click', function(latlng) {
				G_MAP.openInfoWindow("ELEMENT", me.id, latlng);
			});			
		} 
		this.events = raw_element.event_ids;
	};
	
	Element.prototype = {
		drawOnMap: function() {
			this.current_overlay = this.overlay;
			if (this.type == 'line') {
				G_MAP.addOverlay(this.arrow);
			}
			G_MAP.addOverlay(this.overlay);
		},
		
		removeFromMap: function() {
			if (this.type == 'line') {
				G_MAP.removeOverlay(this.arrow);
			}
			G_MAP.removeOverlay(this.current_overlay);
			this.current_overlay = null;
		},
		
		highLight: function() {
			G_MAP.removeOverlay(this.current_overlay);
			G_MAP.addOverlay(this.highlight_overlay);
			this.current_overlay = this.highlight_overlay;
		},
		
		deHighLight: function() {
			G_MAP.removeOverlay(this.current_overlay);
			G_MAP.addOverlay(this.overlay);
			this.current_overlay = this.overlay;
		},
		
		adjustZoomLevel: function() {
		},
	};
	
	function Event(raw_event) {
		this.id = raw_event.id;
		this.name = raw_event.name;
		this.element_ids = raw_event.element_ids;
		this.place = raw_event.place;
		this.people = raw_event.people;
		this.start = raw_event.start;
		this.end = raw_event.end;
		this.desc = raw_event.desc;
	};

	function BigEvent(raw_event) {
		var me = this;
		this.id = raw_event.id
		this.name = raw_event.name;
		this.element_ids = raw_event.element_ids;
		this.event_ids = raw_event.event_ids;
		this.start = raw_event.start;
		this.end = raw_event.end;
		this.desc = raw_event.desc;
		var is_details_shown = false;
		var genNode = function() {
			var node = $('<div></div>');
			node.append(me.start + '&nbsp;');
			var link = $('<a href=#>' + me.name + '</a>');
			var event_list = genEventListNode();
		
			node.append(link);
			var details = $('<div></div>');
			details.append('<br>');
			details.append($('<p>' + me.desc + '</p>'));
			var img = $('<div></div>');
			img.append($('<img class="event_img" src="images/pic1.jpg"></img>'));
			img.append($('<img class="event_img" src="images/pic2.jpg"></img>'));
			details.append(img);
			details.append(event_list);
			details.append('<br>');
			node.append(details);
			details.hide();
			link.click(function(){
				if (is_details_shown) {
					details.slideUp('slow');
					is_details_shown = false;
				}
				else {
					details.slideDown('slow');
					is_details_shown = true;
				}
				G_MAP.updateOverlay('E', me.id);
			});
			$('#big_event_list').append(node);
			return node;
		};
		
		var genEventListNode = function() {
			var node = $('<div class="events-div"><div>');
			$.each(me.event_ids, function(index, event_id){
				var event = EVENT.getItem(event_id);
				var event_item = $('<div></div>');
		   
				event_item.append(event.start + '&nbsp;');
				//event_item.append(event.place + '&nbsp;');

				var event_link = $('<a href=#>' + event.name + '</a>');
	
				event_link.click(function(){
					var latlng = LOCATION.getItem(event.place[0]).point;
					G_MAP.openInfoWindow("EVENT", event_id, latlng);
				});
				event_item.append(event_link);
				node.append(event_item);
			});
			return node;
		};
		
		this.node = genNode();
		this.is_shown = true;
	}
	
	BigEvent.prototype = {
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
	
	
	function People(raw_people) {

		var me = this;
		this.id = raw_people.name;
		this.name = raw_people.name;
		this.nick = raw_people.zi;
		this.birth = raw_people.birth;
		this.death = raw_people.death;
		this.birthplace = raw_people.birthplace;
		this.desc = raw_people.desc;
		this.kingdom = raw_people.kindom;
		this.wiki = raw_people.wiki;
		this.event_ids = raw_people.event_ids;
		this.element_ids = raw_people.element_ids;

		var genDigestNode = function() {
			var node = $('<div class="character-digest-div"></div>');
			var digest =  $('<p>' + me.desc.substring(0,50) + '...</p>');
			var detail = $('<p>' + me.desc + '</p>');
			var show_detail = $('<a href=#>详细</a>');
			var hide_detail = $('<a href=#>隐藏</a>');

			digest.append(show_detail);
			detail.append(hide_detail);

			show_detail.click(function(){
				digest.hide();
				detail.slideDown('slow');
				return false;
			});

			hide_detail.click(function(){
				digest.show();
				detail.hide();
				return false;
			});
	    
			node.append(digest);
			node.append(detail);
			detail.hide();
			return node;
		};
	
		var genEventListNode = function(parent) {
			var node = $('<div class="events-div"><div>');
			var show_events = $('<a href=#>历史事件</a>');
			var hide_events = $('<a href=#>隐藏</a>');
			var event_list = $('<div></div>');
		
			$.each(me.event_ids, function(index, event_id){
				var event = EVENT.getItem(event_id);
				var event_item = $('<div></div>');
		   
				event_item.append(event.start + '&nbsp;');
				//event_item.append(event.place + '&nbsp;');

				var event_link = $('<a href=#>' + event.name + '</a>');
	
				event_link.click(function(){
					var latlng = LOCATION.getItem(event.place[0]).point;
					G_MAP.openInfoWindow("EVENT", event_id, latlng);
				});
				event_item.append(event_link);
				event_list.append(event_item);
			});
	    
			show_events.click(function(){
				event_list.slideDown('slow');
				hide_events.show();
				show_events.hide();
				G_MAP.updateOverlay('P', me.id);
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
	

		var genNode = function() {
			var node = $('<tr class="character-item"></tr>');
			var img_node = $('<td class="character-img-div"></td>');
			img_node.append('<img width=70 heigth=70 src="img/sunquan.jpg"></img>');
			var intro_node = $('<td class="character-intro-div"></td>');
			var link_node = $('<p class="character-title"><a href="#">' + me.name + '&nbsp;字' + 
					me.nick + '</a></p>');
			link_node.click(function(){
				G_MAP.updateOverlay('P', me.id);
				return false;
			});
			intro_node.append(link_node);
			intro_node.append(genDigestNode());
			node.append(img_node);
			node.append(intro_node);
			intro_node.append(genEventListNode());
			$('#character_list').append(node);
			return node;
		};

		this.node = genNode();
		this.is_shown = true;
	};
    

	People.prototype = {
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
	
	function LoadElement() {
		_IG_FetchContent(URL.element_url, function(data) {
			var json = eval(data);
			$.each(json, function(index, element) {
				ELEMENT.setItem(element.id, new Element(element));
			});
		})
	};
	
	function LoadEvent() {
		_IG_FetchContent(URL.event_url, function(data) {
			var json = eval(data);
			$.each(json, function(index, event) {
				EVENT.setItem(event.id, new Event(event));
			});
			LoadBigEvent();
			LoadPeople();
		});
		
	};
	
	function LoadPeople() {
		_IG_FetchContent(URL.people_url, function(data) {
			var json = eval(data);
			$.each(json, function(index, people) {
				PEOPLE.setItem(people.name, new People(people));
			});
		});
		
	};
	
	function LoadBigEvent() {
		_IG_FetchContent(URL.big_event_url, function(data) {
			var json = eval(data);
			$.each(json, function(index, big_event) {
				BIG_EVENT.setItem(big_event.id, new BigEvent(big_event));
			});
		});
	};
	
	function LoadLocation() {
		_IG_FetchContent(URL.location_url, function(data) {
			var json = eval(data);
			$.each(json, function(index, location) {
				LOCATION.setItem(location.name, new Location(location));
			});
			LoadElement();
			LoadEvent();
		});
	};
	
	var Utils = {
		constructInfoWindowHtml : function(events) {
			var div = $('<div></div>');
			$.each(events, function(index, event) {
				var title = $('<a href="">' + event.name + '</a>');
				var desc = $('<p>' + event.desc + '<br /></p>');
				div.append(title);
				div.append(desc);
			})
					return div.html()
		},
	};

	function RedcliffMap(node) {
		var me = this;
		this.gmap = new GMap2();
        	this.gmap.setCenter(new GLatLng(30.917, 110.397), 5);
		this.gmap.addControl(new GLargeMapControl());
		this.gmap.addControl(new GMapTypeControl());
		
		var layer = new GTileLayer(new GCopyrightCollection(""), 1, 17);
		
		layer.getTileUrl = function(tile, zoom) {
			zoom = 17 - zoom;
			var prefix = "http://0.tiles.paint-team.cg.borg.google.com/mt?tiles=2008_12_04_boz";
			var url = prefix + '&x=' + tile.x + '&y=' + tile.y + '&zoom=' + zoom;
			return url;	
		}
		layer.isPng = function() { return true; }
		layer.getOpacity = function() { return 1.0; }
		this.gmap.addOverlay(new GTileLayerOverlay(layer));
		
		GEvent.addListener(this.gmap, 'infowindowclose', function() {
			me.deHighLightOverlay();
		})
	};
	

	RedcliffMap.prototype = {
		addOverlay: function(overlay) {
			this.gmap.addOverlay(overlay);
		},
		removeOverlay: function(overlay) {
			this.gmap.removeOverlay(overlay);
		},
		openInfoWindow: function(type, id, latlng) {
			if (type == "EVENT") {
				var event = EVENT.getItem(id);
				var info_div = Utils.constructInfoWindowHtml([event]);
				this.gmap.openInfoWindow(latlng, info_div, {maxWidth: 100});
				this.highLightOverlay(event.element_ids);
			}
			if (type == "ELEMENT") {
				var element = ELEMENT.getItem(id);
				var events = new Array();
				$.each(element.events, function(index, event_id) {
					if (CURRENT_EVENT_HASH.hasItem(event_id)) {
						var event = EVENT.getItem(event_id);
						events.push(event);
					}
				});
				var info_div = Utils.constructInfoWindowHtml(events);
				this.gmap.openInfoWindow(latlng, info_div, {maxWidth: 100});
				this.highLightOverlay(id);
			}
		},
		highLightOverlay: function(element_ids) {
			$.each(element_ids, function(index, element_id) {
				if (CURRENT_ELEMENT_HASH.hasItem(element_id)) {
					var element = ELEMENT.getItem(element_id);
					element.highLight();
					HIGH_LIGHT_ELEMENT.push(element_id);
				}
			});
		},
		
		deHighLightOverlay: function() {
			while (HIGH_LIGHT_ELEMENT.length > 0) {
				var element_id = HIGH_LIGHT_ELEMENT.pop();
				var element = ELEMENT.getItem(element_id);
				element.deHighLight();
			}
		},
		
		updateOverlay: function(type, id) {
			if (type + '_' + id == CURRENT_OVERLAY_ID)
				return;
			this.gmap.closeInfoWindow();
			CURRENT_OVERLAY_ID = type + '_' + id;
			while (CURRENT_ELEMENT.length > 0) {
				var element_id = CURRENT_ELEMENT.pop();
				var elem = ELEMENT.getItem(element_id);
				CURRENT_ELEMENT_HASH.removeItem(element_id);
				elem.removeFromMap();
			}
			
			while (CURRENT_EVENT.length > 0) {
				var event_id = CURRENT_EVENT.pop();
				CURRENT_EVENT_HASH.removeItem(element_id);
			}
			
			var element_ids;
			var event_ids;
			if (type == 'E') {
				var big_event = BIG_EVENT.getItem(id);
				element_ids = big_event.element_ids;
				event_ids = big_event.event_ids;
			} else {
				var people = PEOPLE.getItem(id);
				element_ids = people.element_ids;
				event_ids = people.event_ids;
			}
			
			$.each(element_ids, function(index, element_id) {
				var elem = ELEMENT.getItem(element_id);
				elem.drawOnMap();
				CURRENT_ELEMENT.push(element_id);
				CURRENT_ELEMENT_HASH.setItem(element_id, "");
			});

			$.each(event_ids, function(index, event_id) {
				CURRENT_EVENT.push(event_id);
				CURRENT_EVENT_HASH.setItem(event_id, "");
			});
		}
	}

	$(function(){
        	var map_node = document.getElementById("map_canvas");
		G_MAP = new RedcliffMap(map_node);
		var tab_manager = new TabManager(['events','characters'], 'events');
	
		LoadLocation();
	    });
})();
