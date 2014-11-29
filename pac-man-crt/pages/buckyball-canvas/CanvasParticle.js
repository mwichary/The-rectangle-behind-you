function Particle() {
	var o = 1;
	var active = false;
	var x = 0;
	var y = 0;
	var r = 3;
	this.show = function(xx, yy) {
		active = true;
		x = xx;
		y = yy;
		o = 1;
	}
	this.update = function() {
		if (active) {
			o-=0.03;
			this.draw();
		}			
	}
	this.hide = function() {
		active = false;
	}
	this.draw = function() {
	g.fillStyle = "rgba(232, 141, 7, "+o+")";
		fillPixel(x, y);
  	}
}