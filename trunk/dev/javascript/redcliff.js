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
	var PEOPLE_ARRAY = new Array();
	var CURRENT_EVENT_HASH = new Hash();
	var CURRENT_ELEMENT_HASH = new Hash();
	var CURRENT_EVENT = Array();
	var CURRENT_ELEMENT = new Array();
	var HIGH_LIGHT_ELEMENT = new Array();
	var CURRENT_OVERLAY_ID = "";
	var BASE = 'http://redcliff.googlecode.com/svn/trunk/dev/';

	var URL = {
		location_url: BASE + 'data/location.json',
		element_url: BASE + 'data/element.json',
		event_url: BASE + 'data/event.json',
		big_event_url: BASE + 'data/big_event.json',
		people_url: BASE +'data/people.json',
	};

	var G_MAP;
	
	var C_POLYLINE_WEIGHT = 10
	
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
		this.point = new GLatLng(raw_location.lat, raw_location.lng);
	};
	
	
	function Element(raw_element) {
		var me = this;
		this.id = raw_element.id
		this.element = raw_element;
		this.type = raw_element.type;
		
		var getHiddenPolylineOverlay = function(points, weigth, id) {
			var latlngs = new Array();
			$.each(points, function(index, point){
				latlngs.push(new GLatLng(point.lat, point.lng));
			});
			var polyline = new GPolygon(latlngs, "#000000", 10, 0.0);
			GEvent.addListener(polyline, 'click', function(latlng) {
				G_MAP.openInfoWindow("ELEMENT", id, latlng);
			});
			return polyline;
		};
		
		var getArrowGroundOverlay = function(arrow_url, sw, ne) {
			var bound = new GLatLngBounds(new GLatLng(ne.lat, ne.lng), new GLatLng(sw.lat, sw.lng));
			var arrow = new GGroundOverlay(BASE + 'images/arrow/'  + arrow_url + '.png', bound);
			return arrow;
		}
		
		var getMarker = function(icon_url, point, id) {
			var image = BASE + 'images/icon/' + icon_url + '.png';
			var icon = new GIcon(G_DEFAULT_ICON, image);
			if (icon_url.length == 2)
				icon.iconSize = new GSize(54,32);
			else
				icon.iconSize = new GSize(32,32);
			var marker = new GMarker(point, {icon:icon});
			GEvent.addListener(marker, 'click', function() {
				G_MAP.openInfoWindow("ELEMENT", id, point);
			});
			return marker;
		}
		if (this.type == 'point') {
			this.point = new GLatLng(raw_element.lat, raw_element.lng);
			this.marker = getMarker(raw_element.pic, this.point, this.id);
		} else {
			this.hidden_polyline = getHiddenPolylineOverlay(raw_element.hot_points, C_POLYLINE_WEIGHT, this.id);
			this.arrow = getArrowGroundOverlay(raw_element.arrow, raw_element.arrow_points[0], raw_element.arrow_points[1]);
			
		} 
		this.events = raw_element.event_ids;
	};
	
	Element.prototype = {
		drawOnMap: function() {
			if (this.type == 'line') {
				G_MAP.addOverlay(this.hidden_polyline);
				G_MAP.addOverlay(this.arrow);
			} else {
				G_MAP.addOverlay(this.marker);
			}
		},
		
		removeFromMap: function() {
			if (this.type == 'line') {
				G_MAP.removeOverlay(this.hidden_polyline);
				G_MAP.removeOverlay(this.arrow);
			} else {
				G_MAP.removeOverlay(this.marker);
			}
		},
		
		/*
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
		*/
	};
	
	function Event(raw_event) {
		this.id = raw_event.id;
		this.name = raw_event.name;
		this.element_ids = raw_event.element_ids;
		this.people = raw_event.people;
		this.start_y = raw_event.start_y;
		this.start_m = raw_event.start_m;
		this.end_y = raw_event.end_y;
		this.end_m = raw_event.end_m;
		this.desc = raw_event.desc;
		this.point = new GLatLng(raw_event.lat, raw_event.lng);
	};
	
	function BigEvent(raw_event) {
		var me = this;
		this.id = raw_event.id
		this.name = raw_event.name;
		this.element_ids = raw_event.element_ids;
		this.event_ids = raw_event.event_ids;
		this.start_y = raw_event.start_y;
		this.start_m = raw_event.start_m;
		this.end_y = raw_event.end_y;
		this.end_m = raw_event.end_m;
		this.desc = raw_event.desc;
		var is_details_shown = false;
		var genNode = function() {
			var node = $('<li class="big-event-item"></li>');
			node.append(me.start_y + '年' + me.start_m + '月&nbsp;');
			var link = $('<a href=#>' + me.name + '</a>');
			var event_list = genEventListNode();
		
			node.append(link);
			var details = $('<div></div>');
			details.append('<br>');
			details.append($('<p>' + me.desc + '</p>'));
			var img = $('<div></div>');
			img.append($('<img class="event_img" src="' + BASE + 'images/pic1.jpg"></img>'));
			img.append($('<img class="event_img" src="' + BASE + 'images/pic2.jpg"></img>'));
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
		   
				event_item.append(event.start_y + '年&nbsp;' + event.start_m + '月');
				//event_item.append(event.place + '&nbsp;');

				var event_link = $('<a href=#>' + event.name + '</a>');
	
				event_link.click(function(){
					G_MAP.openInfoWindow("EVENT", event_id, event.point);
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
		this.pic = raw_people.pic;
	

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
				event_item.append(event.start_y + '年&nbsp;' + event.start_m + '月');
				//event_item.append(event.place + '&nbsp;');

				var event_link = $('<a href=#>' + event.name + '</a>');
	
				event_link.click(function(){
					alert(event.point);
					G_MAP.openInfoWindow("EVENT", event_id, event.point);
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
			var node = $('<div class="character-item"><tr></tr></div>');
			var img_node = $('<td class="character-img-div"></td>');
			img_node.append('<img width=60 heigth=70 src="' + BASE + 'images/people/' + me.pic +'.png"></img>');
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
			this.node.fadeIn();
			this.is_shown = true;
		},
      
		hideNode: function() {
			if (!this.is_shown)
			return;
			this.node.fadeOut();
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
			$.each(json, function(index, raw_people) {
				var people = new People(raw_people)
				PEOPLE.setItem(people.name, people);
				PEOPLE_ARRAY.push(people);
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
			return div.html();
		},
	};

	function RedcliffMap(node) {
		var me = this;
		this.gmap = new GMap2();
        	this.gmap.setCenter(new GLatLng(30.917, 110.397), 6);
		this.gmap.openInfoWindow(new GLatLng(30.917, 110.397), "hello world");
		var tileLayerOverlay = new GTileLayerOverlay(
  			new GTileLayer(null, null, null, {
    				tileUrlTemplate: 'http://0.tileservers-sanguo.tilefe.geo-cn.bg.borg.google.com/mt?v=cnsg1.0&hl=zh-CN&x={X}&y={Y}&z={Z}&s=G', 
    				isPng:true,
    				opacity:1.0
  			})
		);

		this.gmap.addOverlay(tileLayerOverlay); 
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
				alert(latlng);
				this.gmap.openInfoWindow(latlng, "hello world");
				//this.highLightOverlay(event.element_ids);
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
				//this.highLightOverlay(id);
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
				//element.deHighLight();
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

	function CharacterFilter() {
  		var filter = function() {
     			var shu_selected = false;
     			var wei_selected = false;
     			var wu_selected = false;
     			if ($('#checkbox_shu').attr('checked'))
				shu_selected = true;
     			if ($('#checkbox_wei').attr('checked'))
				wei_selected = true;
     			if ($('#checkbox_wu').attr('checked'))
				wu_selected = true;
			$.each(PEOPLE_ARRAY, function(index, character){
        			if (character.kingdom == '蜀') {
           				if (shu_selected)
              					character.showNode();
           				else
              					character.hideNode();
        			}   
        			if (character.kingdom == '魏') {
           				if (wei_selected)
              					character.showNode();
           				else
              					character.hideNode();
        			}
        			if (character.kingdom == '吴') {
           				if (wu_selected)
              					character.showNode();
           				else
              					character.hideNode();
        			}
     			});
  		};
  		$('#checkbox_shu').click(filter);
  		$('#checkbox_wei').click(filter);
  		$('#checkbox_wu').click(filter);  
	};
	var character_filter;
	$(function(){
		$('#events_cnt').hide();	
		G_MAP = new RedcliffMap();
		LoadLocation();
		new CharacterFilter();
		$('#shift_event').click(function(){
			$('#characters_cnt').hide();
			$('#events_cnt').show();
			return false;
		});
		$('#shift_people').click(function(){
			$('#events_cnt').hide();
			$('#characters_cnt').show();
			return false;
		});
	    });
})();
