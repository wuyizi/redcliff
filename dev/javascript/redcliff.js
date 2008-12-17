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
    }
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
  var CN_BASE = 'http://www.google.cn/staticcn/chibi/';
  var LAIBA_BASE = '';

  var CURRENT_BIG_EVENT = null;
  var CURRENT_PEOPLE = null;
  
  var CURRENT_TAB = null;

  var URL = {
    location_url: BASE + 'data/location.json?bpc=4',
    element_url: BASE + 'data/element.json?bpc=7',
    event_url: BASE + 'data/event.json?bpc=5',
    big_event_url: BASE + 'data/big_event.json?bpc=9',
    people_url: BASE +'data/people.json?bpc=7',
    tile_url: 'http://mt.google.cn/mt?v=cnsg1.2&hl=zh-CN&x={X}&y={Y}&z={Z}'
  };

  var FLAGS = {
    '蜀': 'G',
    '魏': 'B',
    '吴': 'R'
  };

  var G_MAP;
  
  // Google Analytics Account
  var UAACCT = "UA-3537915-2";
  
  var C_POLYLINE_WEIGHT = 10
  

  
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
      var arrow = new GGroundOverlay(CN_BASE + 'arrow/'  + arrow_url + '.png', bound);
      return arrow;
    }
    
    var getMarker = function(icon_url, point, id) {
      var image = CN_BASE + 'icon/' + icon_url + '.png';
      var icon = new GIcon(G_DEFAULT_ICON, image);
      if (icon_url.length == 2)
        icon.iconSize = new GSize(45,32);
      else
        icon.iconSize = new GSize(25,32);
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
    }
    
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
    }
    */
  };
  
  var encapsulateActiveEventOrPeople = function(people_id) {
    if (CURRENT_BIG_EVENT != null) {
      var big_event = BIG_EVENT.getItem(CURRENT_BIG_EVENT);
      big_event.hideDetails();
      CURRENT_BIG_EVENT = null;
    }
    if (CURRENT_PEOPLE != null && people_id && CURRENT_PEOPLE == people_id)
    return;
    if (CURRENT_PEOPLE != null) {
      var people = PEOPLE.getItem(CURRENT_PEOPLE);
      people.node.encapsulate();
      CURRENT_PEOPLE = null;
    }
  }

  function Event(raw_event) {
    this.id = raw_event.id;
    this.name = raw_event.name;
    this.element_ids = raw_event.element_ids;
    this.people = raw_event.people;
    this.time = raw_event.time;
    this.time_ad = raw_event.ad;
    this.desc = raw_event.desc;
    this.point = new GLatLng(raw_event.popup.lat, raw_event.popup.lng);
  };
  
  function BigEvent(raw_event) {
    var me = this;
    this.id = raw_event.id
    this.name = raw_event.name;
    this.element_ids = raw_event.element_ids;
    this.event_ids = raw_event.event_ids;
    this.time = raw_event.time;
    this.time_ad = raw_event.ad;
    this.desc = raw_event.desc;
    this.pic = raw_event.pic;
    this.is_details_shown = false;
    this.details = null;
	this.images = raw_event.images;
    this.center = new GLatLng(raw_event.center.lat, raw_event.center.lng);
    var genNode = function() {
      var node = $('<div class="big-event-item"></div>');

      var table = $('<table><tbody><tr></tr></tbody></table>');
      var row = table.children().children();
      var time_cell = $('<td class="big-event-item-time" title="' + me.time_ad + '">' + me.time + '</div>');
      var link_cell = $('<td class="big-event-item-link"></td>');
      row.append(time_cell);
      row.append(link_cell);
      row.append('<td class="big-event-item-pic"><img src="' + CN_BASE + 'icon/' + me.pic + '.gif"></td>');
      node.append(table);

      var event_link = $('<a href=#>' + me.name + '</a>');
      event_link.click(function(){
        if (me.is_details_shown) {
          me.hideDetails();
        } else {
      me.showDetails();
        }
        G_MAP.updateOverlay('E', me.id);
        G_MAP.setCenter(me.center, 8);
        _IG_Analytics(UAACCT, '/click/eventLink/' + me.name);
        return false;
      });
      link_cell.append(event_link);

      me.details = $('<div class="big-event-detail" style="display:none;"></div>');
      me.details.append($('<p>' + me.desc + '</p>'));

      var imgs = $('<div class="big-event-imgs"></div>');
	  $.each(me.images, function(index, img_url) {
        var img = $('<img src="' + img_url + '">');
		imgs.append(img);
      });
      me.details.append(imgs);
      

      var event_list = $('<table class="events-div"></table>');
      genEventList(event_list, me.event_ids);
      me.details.append(event_list);
      node.append(me.details);
      $('#big_event_list').append(node);
      return node;
    };
   
    this.node = genNode();
    this.is_shown = true;
  };

  BigEvent.prototype = {
    showDetails: function() {
      encapsulateActiveEventOrPeople(null);
      this.details.show();
      _IG_AdjustIFrameHeight();
      this.is_details_shown = true;
      CURRENT_BIG_EVENT = this.id;
    },

    hideDetails: function() {
      this.details.hide();
      _IG_AdjustIFrameHeight();
      this.is_details_shown = false;
    }
  };  

  var genEventList = function(table, event_ids) {
    var tbody = table.append('<tbody></tbody>').children();
    $.each(event_ids, function(index, event_id){
      var event = EVENT.getItem(event_id);
      var row = $('<tr></tr>');
      genEventItem(row, event);
      tbody.append(row);
    });
  };
 
  var genEventItem = function(row, event) {
    var time_cell = $('<td class="events-item-time" title="' + event.time_ad + '">' + event.time + '</div>');
    var link_cell = $('<td class="events-item-link"></td>');
    var event_link = $('<a href=#>' + event.name + '</a>');
    event_link.click(function(){
      G_MAP.openInfoWindow("EVENT", event.id, event.point);
      _IG_Analytics(UAACCT, '/click/eventItemLink/' + event.name);
      return false;
    });
    link_cell.append(event_link);
    row.append(time_cell);
    row.append(link_cell);
  };

  function PeopleDigestNode(parent_node, desc, people_id) {
    this.people_id = people_id;
    var me = this;
    var node = $('<div class="character-digest-div"></div>');
    this.digest =  $('<div class="character-digest-div-short">' + desc.substring(0,65) + '...</div>');
    this.detail = $('<div class="character-digest-div-long" style="display:none;">' + desc + '</div>');
    var show_detail = $('<a href=#>[详细]</a>');
    var hide_detail = $('<a href=#>[隐藏]</a>');

    this.digest.append(show_detail);
    this.detail.append(hide_detail);

    show_detail.click(function(){
      me.showDetail();
      _IG_Analytics(UAACCT, '/click/peopleShowDetailLink/' + me.people_id);
      return false;
    });

    hide_detail.click(function(){
      me.hideDetail();
      _IG_Analytics(UAACCT, '/click/peopleHideDetailLink/' + me.people_id);
      return false;
    });
      
    node.append(this.digest);
    node.append(this.detail);
    parent_node.append(node);
  };

  PeopleDigestNode.prototype = {
    showDetail: function() {
      encapsulateActiveEventOrPeople(this.people_id);
      this.detail.slideDown('fast', _IG_AdjustIFrameHeight);
      this.digest.fadeOut('fast');
      CURRENT_PEOPLE = this.people_id;
    },
    hideDetail: function() {
      this.detail.slideUp('fast', _IG_AdjustIFrameHeight);
      this.digest.fadeIn('fast');
    }
  };
  
  function PeopleEventListNode(parent_node, event_ids, people_id, center) {
    this.people_id = people_id;
    var me = this;
    var node = $('<div class="events-div"></div>');
    this.show_events = $('<a class="events-div-show" href=#>历史事件</a>');
    this.hide_events = $('<a class="events-div-hide" style="display:none;" href=#>隐藏历史事件</a>');
    this.event_list = $('<table class="events-list" style="display:none;"></table>');

    genEventList(this.event_list, event_ids);

    this.show_events.click(function(){
      me.showEvents();
      G_MAP.updateOverlay('P', people_id);
      G_MAP.setCenter(center, 7);
      _IG_Analytics(UAACCT, '/click/peopleShowEventsLink/' + me.people_id);
      return false;
    });

    this.hide_events.click(function(){
      me.hideEvents();
      _IG_Analytics(UAACCT, '/click/peopleHideEventsLink/' + me.people_id);
      return false;
    });

    node.append(this.show_events);
    node.append(this.hide_events);
    node.append(this.event_list);
    parent_node.append(node);
  };
  
  PeopleEventListNode.prototype = {
    showEvents: function() {
      encapsulateActiveEventOrPeople(this.people_id);
      this.event_list.slideDown('fast', _IG_AdjustIFrameHeight);
      this.hide_events.show();
      this.show_events.hide();
      CURRENT_PEOPLE = this.people_id;
    },
    hideEvents: function() {
      this.event_list.slideUp('fast', _IG_AdjustIFrameHeight);
      this.show_events.show();
      this.hide_events.hide();
    }
  };

  function PeopleNode(parent_node, people) {
    this.people_id = people.id;
    var me = this;
    this.digest = null;
    this.event = null;
    this.table = $('<table class="character-item"><tbody><tr></tr></tbody></table>');
    var img_node = $('<td class="character-img-div"></td>');
    img_node.append('<img width=60 height=75 src="' + people.pic +'">');
    var intro_node = $('<td class="character-intro-div"></td>');
    var title_node = $('<div class="character-title"></div>');
    var link_node = $('<a href="#">' + people.name + '</a>' + (people.nick ? '<span>字' + people.nick + '</span>' : ''));

    var gicon_node = $('<a title="搜索" target="_blank" href="http://www.google.cn/search?ie=utf8&source=redcliff&q=' + encodeURIComponent(people.name) + '"><img border=0 src="' + CN_BASE + 'search_icon.gif"></a>');
    var flag_node = $('<div class="character-title-img" style="background-image:url(\'' + CN_BASE + 'icon/' + FLAGS[people.kingdom] + '.gif\')"></div>');

    gicon_node.click(function(){
      _IG_Analytics(UAACCT, '/click/searchIcon');
      return true;
    });
    title_node.append(flag_node);
    title_node.append(link_node);
    title_node.append(gicon_node);
    intro_node.append(title_node);
    this.digest = new PeopleDigestNode(intro_node, people.desc, people.id);

    var row = this.table.children().children();
    row.append(img_node);
    row.append(intro_node);

    var event_node = row.after('<tr><td></td><td></td></tr>').next().children(':last');
    this.event = new PeopleEventListNode(event_node, people.event_ids, people.id, people.center);

    link_node.click(function(){
      if (!me.is_shown) {
        me.extend();
        G_MAP.updateOverlay('P', people.id);
        G_MAP.setCenter(people.center, 7);
        me.is_shown = true;
      } else {
        me.encapsulate();
        me.is_shown = false;
      }
      _IG_Analytics(UAACCT, '/click/peopleLink/' + people.id); 
      return false;
    });
    parent_node.append(this.table);
    this.is_shown = false;
  };

  PeopleNode.prototype = {
    extend: function() {
      encapsulateActiveEventOrPeople(this.people_id);
      this.event.showEvents();
      this.digest.showDetail();
      CURRENT_PEOPLE = this.people_id;
    },
    encapsulate: function() {
      this.event.hideEvents();
      this.digest.hideDetail();
    },
    hide: function() {
      this.encapsulate();
      this.table.hide();
    },
    show: function() {
      this.table.show();
    }
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
    this.event_ids = raw_people.event_ids;
    this.element_ids = raw_people.element_ids;
    this.pic = raw_people.pic;
    this.digest = null;
    this.event = null;
    this.center = new GLatLng(raw_people.center.lat, raw_people.center.lng);
    this.node = new PeopleNode($('#character_list'), this);
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
    }
  };
  
  function LoadElement() {
    _IG_FetchContent(URL.element_url, function(data) {
      var json = eval(data);
      $.each(json, function(index, element) {
        ELEMENT.setItem(element.id, new Element(element));
      });
      LoadDone();
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
      LoadDone();
    });
  };
  
  function LoadBigEvent() {
    _IG_FetchContent(URL.big_event_url, function(data) {
      var json = eval(data);
      $.each(json, function(index, big_event) {
        BIG_EVENT.setItem(big_event.id, new BigEvent(big_event));
      });
      LoadDone();
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

  var LOAD_STATES = 0;
  function LoadDone() {
    LOAD_STATES++;
    if (LOAD_STATES == 3) { // shan zhai!
      makeShareButton();
      $('#loading').hide();
      $('#main').show();
      
      _IG_AdjustIFrameHeight();
    }
  };

  function _un(str) {return str.replace(/&([^;]+);/g, function(s,entity) {switch (entity) {case 'amp':return '&';case 'lt':return '<'; case 'gt':return '>';case 'quot':return '"';default:if (entity.charAt(0) == '#') {var n=Number('0' + entity.substr(1));if (!isNaN(n)){return String.fromCharCode(n);}}return s;}});};
  function makeShareButton() {
    if (!google || !google.share || !google.share.SharingWidget) return;
	// TODO: refine the text here !!!!
    var g = {
      'linkText': '将此地图分享给朋友',
      'url': 'http://ditu.google.cn/maps/mpl?t=p&moduleurl=http://redcliff.googlecode.com/svn/trunk/mapplet/redcliff.xml',
      'title': '谷歌赤壁之战地图',
      'image': 'http://ditu.google.cn/intl/zh-CN_cn/images/maps_logo_beta_small.png',
      'subject_template': _un('{FROM}邀请您来看看谷歌赤壁之战地图'),
      'comments_template': _un('您的朋友（{FROM}）觉得您可能对这篇文章感兴趣，来看看吧：'),
      'description': '赤壁之战地图，谷歌团队倾情奉献，再现一千八百年前的大混战时代',
      'buttonStyle': 'link', 'tabs': 'email,email', 'popup': true, 'nopreview': true, 'noaddto': true, 'noThumbnail': true
    };
    new google.share.SharingWidget("share_button", g);
  };
  
  var Utils = {
    constructInfoWindowHtml : function(events) {
      var html = ['<div style="width:300px; font-size:12px;">'];
      $.each(events, function(i, event){
        html.push('<div style="' + (i != 0 ? 'border-top:1px dashed #CCC; margin-top:5px;' : '') + '">');
          html.push('<div style="font-size:14px; font-weight:bold; padding-top:10px;">' + event.name + '</div>');
          html.push('<div style="color:#AAAAAA;">' + event.time + ' (' + event.time_ad + ')</div>');
          html.push('<div style="color:#666666; padding:5px 0px;">' + event.desc + '</div>');
          html.push('<div style="text-align:right; color:#AAA;">搜索: ');
            $.each(event.people, function(j, person) {
              html.push('<a style="color:#915E00;margin-left:3px;" target=_blank href="http://www.google.cn/search?ie=utf8&source=redcliff&q=' + encodeURIComponent(person) + '">' + person + '</a>');
            });
          html.push('</div>');
        html.push('</div>');
      });
      html.push('</div>');
      return html.join('');
    }
  };

  function RedcliffMap(node) {
    var me = this;
    this.gmap = new GMap2();
    this.gmap.setCenter(new GLatLng(29.833, 113.618), 7, G_PHYSICAL_MAP);
    this.tileLayerOverlay = new GTileLayerOverlay(
      new GTileLayer(null, null, null, {
        tileUrlTemplate: URL.tile_url,
        isPng:true,
        opacity:1.0
      })
    );
    this.gmap.addOverlay(this.tileLayerOverlay); 
  };
  

  RedcliffMap.prototype = {
    changeTiles: function(opacity_val) {
      // IE6 does not support opacity, so we remove the layer if opacity is 0
      if (this.tileLayerOverlay != null) {
        this.gmap.removeOverlay(this.tileLayerOverlay);
      }
      if (opacity_val < 0.01) {
        this.tileLayerOverlay = null;
      } else {
        this.tileLayerOverlay = new GTileLayerOverlay(
          new GTileLayer(null, null, null, {
            tileUrlTemplate: URL.tile_url,
            isPng:true,
            opacity:opacity_val
          })
        );
        this.gmap.addOverlay(this.tileLayerOverlay);
      }
    },
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
        this.gmap.openInfoWindowHtml(latlng, info_div, {maxWidth: 100});
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
        this.gmap.openInfoWindowHtml(latlng, info_div, {maxWidth: 100});
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
    
    setCenter: function(center, level) {
      this.gmap.panTo(center);
    },

    clearOverlays: function() {
      this.gmap.closeInfoWindow();
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
      CURRENT_OVERLAY_ID = "";
    },

    updateOverlay: function(type, id) {
      if (type + '_' + id == CURRENT_OVERLAY_ID)
        return;
      CURRENT_OVERLAY_ID = type + '_' + id;
      this.clearOverlays();
      
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
  };

  function CharacterFilter() {
    var filter = function() {
      var shu_selected = false;
      var wei_selected = false;
      var wu_selected = false;
      if ($('#checkbox_shu').attr('checked')) shu_selected = true;
      if ($('#checkbox_wei').attr('checked')) wei_selected = true;
      if ($('#checkbox_wu').attr('checked')) wu_selected = true;
      $.each(PEOPLE_ARRAY, function(index, character){
        if (character.kingdom == '蜀') {
          if (shu_selected) character.showNode();
          else character.hideNode();
        }   
        if (character.kingdom == '魏') {
          if (wei_selected) character.showNode();
          else character.hideNode();
        }
        if (character.kingdom == '吴') {
          if (wu_selected) character.showNode();
          else character.hideNode();
        }
      });
      _IG_AdjustIFrameHeight();
      _IG_Analytics(UAACCT, '/click/characterFilter');
    };
    $('#checkbox_shu').click(filter);
    $('#checkbox_wei').click(filter);
    $('#checkbox_wu').click(filter);  
  };

  // Add the handler for changing the tile option using the drop down.
  function TilesSelect() {
    // remove half transparent version for IE6
   if (navigator.appName == 'Microsoft Internet Explorer' &&
       (navigator.appVersion.indexOf('MSIE 6') > 0)) {
      var sel = $('#select_tiles').get(0);
      for (var i = sel.length - 1; i >= 0; i--) {
        if (sel.options[i].value > 0.01 && sel.options[i].value < 0.99) {
          sel.remove(i);
        }
      }
    }
    var change_tiles = function() {
      var selVal = $('#select_tiles').attr('options')[$('#select_tiles').attr('options').selectedIndex].value;
      G_MAP.changeTiles(selVal);
      _IG_Analytics(UAACCT, '/click/tilesSelect/' + selVal);
    };
    $('#select_tiles').change(change_tiles);
  };
  
  function TabManager(in_tabs, active_tab) {
    var tabs = new Array();
    var current_tab = '';
    var shiftTab = function(active_tab) {
      if (active_tab == current_tab) return;
      $.each([active_tab, current_tab], function(index, tab){
        var tab_container = $('#' + tab + '_cnt');
        var tab_item = $('#' + tab + '_tab');
		var tab_parent = tab_item.parent();
        if (tab == active_tab) {
          tab_container.show();
          tab_parent.removeClass('tab-inactive');
          tab_parent.addClass('tab-active');
        } else {
          tab_container.hide();
          tab_parent.removeClass('tab-active');
          tab_parent.addClass('tab-inactive');
        }
      });
      current_tab = active_tab;
    };

    $.each(in_tabs, function(index, tab){
      $('#' + tab + '_tab').click(function(){
        shiftTab(tab);
        _IG_AdjustIFrameHeight();
        _IG_Analytics(UAACCT, '/view/tab/' + tab);
        return false;
      });
      tabs.push(tab);
    });

    shiftTab(active_tab);
  };

  function MoveBox(an, box) {
    var cleft = 0;
    var ctop = 0;
    var obj = an;
    while (obj.offsetParent) {
      cleft += obj.offsetLeft;
      ctop += obj.offsetTop;
      obj = obj.offsetParent;
    }
    box.style.left = cleft + 'px';
    ctop += an.offsetHeight - 220;
    box.style.top = ctop + 'px';
  }

  function ShowDisclaimer() {
    var boxdiv = document.getElementById('disclaimerBox');
    if (boxdiv != null) {
      if (boxdiv.style.display=='none') {
      boxdiv.style.display='block';
    } else
      boxdiv.style.display='none';
      return false;
    }
    boxdiv = document.createElement('div');
    boxdiv.setAttribute('id', 'disclaimerBox');
    boxdiv.style.display = 'block';
    boxdiv.style.position = 'absolute';
    boxdiv.style.width = '200px';
    boxdiv.style.height = '200px';
    boxdiv.style.border = '2px solid #E6DB9D';
    boxdiv.style.backgroundColor = '#fff';
    boxdiv.innerHTML = '赤壁之战地图中所使用的各种数据，为参考《后汉书》、《三国志》、《资治通鉴》、《三国郡县表》等书籍资料，以及维基百科等网站，整理获得。人物肖像，事件相片等，为<a target="_blank" href="http://group.chinafilm.com/">中国电影集团</a>授权使用之电影《赤壁》剧照。<br><br>联系我们：<a href="mailto:redcliff@gmail.com">redcliff@ail.com</a>';
    document.body.appendChild(boxdiv);
    var an = $('#show_disclaimer').get(0);
    MoveBox(an, boxdiv);
    return false;
  }
  
  $(function(){
    G_MAP = new RedcliffMap();
    LoadLocation();
    new TilesSelect();
    
    new TabManager(['events', 'characters', 'vote'], 'characters');

    $('#clear_button').click(function(){
      G_MAP.clearOverlays();
    });

    $('#show_disclaimer').click(ShowDisclaimer);
    new CharacterFilter();

    _IG_Analytics(UAACCT, "/view/load");
  });
 
})();


