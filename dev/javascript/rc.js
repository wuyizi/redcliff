var _SB = function(opt_str) {
  this.buf_ = [];
  this.len_ = 0;
  this.append = function(str) {
    this.buf_[this.len_++] = str;
    return this;
  };
  this.clear = function() {
    this.buf_ = [];
    this.len_ = 0;
	return this;
  };
  this.toString = function() {
    var str = this.buf_.join('');
    this.clear();
    if (str) {
      this.append(str);
    }
    return str;
  };
  if (opt_str) {
    this.append(opt_str);
  }
};

var _RC = {};
_RC.colorStyle_ = function(c) {
  if (c) {
    return 'background-color:' + c + ';';
  } else {
    return '';
  }
};
_RC.ie6Margin_ = function() {
  var ua = navigator.userAgent;
  if (ua.indexOf('MSIE 6.0') != -1) {
    return 'margin:0px -3px;';
  } else {
    return '';
  }
}
_RC.drawClear_ = function(sb, c) {
  sb.append('<div class="h" style="background-color:')
    .append(c)
    .append('"></div>');
};
_RC.drawHorz0_ = function(sb, c, w, noL, noR) {
  if (!noL) {
    sb.append('<div style="')
      .append(_RC.colorStyle_(c))
      .append('" class="')
      .append(w)
      .append(' h l"></div>');
  }
  if (!noR) {
    sb.append('<div style="')
      .append(_RC.colorStyle_(c))
      .append('" class="')
      .append(w)
      .append(' h r"></div>');
  }
};
_RC.drawHorz1_ = function(sb, oc, bc, w, noL, noR) {
  sb.append('<div style="')
    .append(_RC.ie6Margin_())
    .append('" class="h">');
  _RC.drawHorz0_(sb, oc, w, noL, noR);
  _RC.drawClear_(sb, bc);
  sb.append('</div>');
};
_RC.drawHorz2_ = function(sb, oc, bc, ic, ow, bw, noL, noR) {
  sb.append('<div style="')
    .append(_RC.ie6Margin_())
    .append('" class="h">');
  _RC.drawHorz0_(sb, oc, ow, noL, noR);
  sb.append('<div style="')
    .append(_RC.ie6Margin_())
    .append(_RC.colorStyle_(ic))
    .append('" class="h">');
  _RC.drawHorz0_(sb, bc, bw, noL, noR);
  _RC.drawClear_(sb, ic);
  sb.append('</div>')
    .append('</div>');
};
_RC.drawVert_ = function(sb, bc, w, invisible) {
  if (w != '' && !invisible) {
    sb.append('<td style="background-color:').append(bc)
      .append('" class="').append(w)
      .append('"></td>');
  } 
};
_RC.drawBody_ = function(sb, html, bc, ic, w, noL, noR) {
  sb.append('<table width=100% class=c style="')
    .append(_RC.colorStyle_(ic))
    .append('"><tr>')
  _RC.drawVert_(sb, bc, w, noL); 
  sb.append('<td>').append(html).append('</td>'); 
  _RC.drawVert_(sb, bc, w, noR); 
  sb.append('</tr></table>');
}
_RC.render = function() {
  if (!$) throw new Error("$ is not defined");
  var corners = $('.rc_id');
  corners.each(function(i) {
    _RC.renderElement(this);
  });
};
_RC.renderElement = function(element) {
  if (typeof element == 'string') {
    element = document.getElementById(element);
  }
  if (!element) {
    return;
  }
  if (element.getAttribute('rc_rendered')) {
    return;
  }
  var fs = element.getAttribute('frame_size');
  if (!fs) fs = '0';
  var oc = element.getAttribute('outer_color');
  var bc = element.getAttribute('border_color');
  if (!bc) {
    bc = 'black';
  }
  var ic = element.getAttribute('inner_color');
  var nb = element.getAttribute('no_bottom');
  var nt = element.getAttribute('no_top');
  if (!nb) {
    nb = false;
  }
  if (!nt) {
    nt = false;
  }
  var nr = element.getAttribute('no_right');
  var nl = element.getAttribute('no_left');
  if (!nr) {
    nr = false;
  }
  if (!nl) {
    nl = false;
  }
  var nc = element.getAttribute('no_content');
  var html = element.innerHTML;
  var HC = _RC.drawClear_;
  var H0 = _RC.drawHorz0_;
  var H1 = _RC.drawHorz1_;
  var H2 = _RC.drawHorz2_;
  var HB = _RC.drawBody_;
  var sb = new _SB();
  sb.append('<div style="width:100%;">');
  if (fs == '0') {
    if (!nt) {
      H0(sb, oc, 'w4', nl, nr); HC(sb, ic);
      H0(sb, oc, 'w2', nl, nr); HC(sb, ic);
      H0(sb, oc, 'w1', nl, nr); HC(sb, ic);
      H0(sb, oc, 'w1', nl, nr); HC(sb, ic);
    }
    if (!nc) {
      HB(sb, html, bc, ic, '', nl, nr);
    }
    if (!nb) {
      H0(sb, oc, 'w1', nl, nr); HC(sb, ic);
      H0(sb, oc, 'w1', nl, nr); HC(sb, ic);
      H0(sb, oc, 'w2', nl, nr); HC(sb, ic);
      H0(sb, oc, 'w4', nl, nr); HC(sb, ic);
    }
  } else if (fs == '1') {
    if (!nt) {
      H1(sb, oc, bc, 'w4', nl, nr);
      H2(sb, oc, bc, ic, 'w2', 'w2', nl, nr);
      H2(sb, oc, bc, ic, 'w1', 'w1', nl, nr);
      H2(sb, oc, bc, ic, 'w1', 'w1', nl, nr);
    }
    if (!nc) {
      HB(sb, html, bc, ic, 'w1', nl, nr);
    }
    if (!nb) {
      H2(sb, oc, bc, ic, 'w1', 'w1', nl, nr);
      H2(sb, oc, bc, ic, 'w1', 'w1', nl, nr);
      H2(sb, oc, bc, ic, 'w2', 'w2', nl, nr);
      H1(sb, oc, bc, 'w4', nl, nr);
    }
  } else if (fs == '2') {
    if (!nt) {
      H1(sb, oc, bc, 'w4', nl, nr);
      H1(sb, oc, bc, 'w2', nl, nr);
      H2(sb, oc, bc, ic, 'w1', 'w3', nl, nr);
      H2(sb, oc, bc, ic, 'w1', 'w2', nl, nr);
    }
    if (!nc) {
      HB(sb, html, bc, ic, 'w2', nl, nr);
    }
    if (!nb) {
      H2(sb, oc, bc, ic, 'w1', 'w2', nl, nr);
      H2(sb, oc, bc, ic, 'w1', 'w3', nl, nr);
      H1(sb, oc, bc, 'w2', nl, nr);
      H1(sb, oc, bc, 'w4', nl, nr);
    }
  } else if (fs == '3') {
    if (!nt) {
      H1(sb, oc, bc, 'w4', nl, nr);
      H1(sb, oc, bc, 'w2', nl, nr);
      H1(sb, oc, bc, 'w1', nl, nr);
      H2(sb, oc, bc, ic, 'w1', 'w3', nl, nr);
    }
    if (!nc) {
      HB(sb, html, bc, ic, 'w3', nl, nr);
    }
    if (!nb) {
      H2(sb, oc, bc, ic, 'w1', 'w3', nl, nr);
      H1(sb, oc, bc, 'w1', nl, nr);
      H1(sb, oc, bc, 'w2', nl, nr);
      H1(sb, oc, bc, 'w4', nl, nr);
    }
  } else if (fs == '4') {
    if (!nt) {
      H1(sb, oc, bc, 'w4', nl, nr);
      H1(sb, oc, bc, 'w2', nl, nr);
      H1(sb, oc, bc, 'w1', nl, nr);
      H1(sb, oc, bc, 'w1', nl, nr);
      H0(sb, bc, 'w5', nl, nr); HC(sb, ic);
    }
    if (!nc) {
      HB(sb, html, bc, ic, 'w4', nl, nr);
    }
    if (!nb) {
      H0(sb, bc, 'w5', nl, nr); HC(sb, ic);
      H1(sb, oc, bc, 'w1', nl, nr);
      H1(sb, oc, bc, 'w1', nl, nr);
      H1(sb, oc, bc, 'w2', nl, nr);
      H1(sb, oc, bc, 'w4', nl, nr);
    }
  }
  sb.append('</div>');
  element.innerHTML = sb.toString();
  element.setAttribute('rc_rendered', '1');
};
