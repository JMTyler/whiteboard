
$(function() {
	var socket,
		canvas = $('canvas'),
		context = canvas.get(0).getContext('2d');
	
	// TODO: Not using 'radius' because this is a line, not a circle.
	var _draw = function(canvas, data)
	{
		/* Click and drag to draw a rectangle. data = {from: {x, y}, to: {x, y}} */
		var context = canvas.get(0).getContext('2d');
		context.beginPath();  // TODO: don't think this is needed
		context.strokeStyle = '#000';
		context.strokeRect(data.from.x, data.from.y, data.to.x - data.from.x, data.to.y - data.from.y);
		
		/* Click and drag to draw a straight line. data = {from: {x, y}, to: {x, y}}
		var context = canvas.get(0).getContext('2d');
		context.beginPath();  // TODO: don't think this is needed
		context.moveTo(data.from.x, data.from.y);
		context.lineTo(data.to.x, data.to.y);
		context.strokeStyle = '#000';
		context.stroke();*/
		
		/* Click and drag to draw a freeform line. data = {stops: [{x, y}, ...], colour}
		var stops = data.stops;
		if (stops.length == 0) {
			return;
		}
		
		context.beginPath();  // TODO: don't think this is needed
		context.moveTo(stops[0].x, stops[0].y);
		
		for (var i = 1; i < stops.length; i++) {
			context.lineTo(stops[i].x, stops[i].y);
		}
		
		context.strokeStyle = data.colour;
		context.stroke();*/
		
		/* Click to draw a large dot. data = {x, y, r, c}
		context.beginPath();
		context.arc(data.x, data.y, data.r, 0, Math.PI * 2, false);
		context.closePath();
		context.fillStyle = data.c;
		context.fill();*/
	};
	
	var _cloneCanvas = function(canvas)
	{
		var newCanvas = canvas.clone();
		newCanvas.get(0).getContext('2d').drawImage(canvas.get(0), 0, 0);
		return newCanvas;
	};
	
	canvas.css('border', 'dotted 1px black')
		.prop('width', 500)
		.prop('height', 500);
	
	socket = io.connect(location.href);
	
	/* Click and drag to draw a straight line. Shows the temporary line as you draw.
	 * Click and drag to draw a rectangle. Shows the temporary rectangle as you draw.
	 */
	var showYourProgress,
		isDrawing = false,
		startPos = {x: 0, y: 0};
	$(document).on('mousedown', 'canvas', function(e) {
		isDrawing = true;
		startPos.x = e.offsetX;
		startPos.y = e.offsetY;
		
		// Clone current state 
		showYourProgress = _cloneCanvas(canvas);
	});
	$(document).on('mousemove', 'canvas', function(e) {
		if (!isDrawing) {
			return;
		}
		
		context.clearRect(0, 0, 500, 500);
		context.drawImage(showYourProgress.get(0), 0, 0);
		
		var data = {
			from: startPos,
			to: {
				x: e.offsetX,
				y: e.offsetY
			}
		};
		_draw(canvas, data);
	});
	$(document).on('mouseup', 'canvas', function(e) {
		if (!isDrawing) {
			return;
		}
		
		context.clearRect(0, 0, 500, 500);
		context.drawImage(showYourProgress.get(0), 0, 0);
		
		var data = {
			from: startPos,
			to: {
				x: e.offsetX,
				y: e.offsetY
			}
		};
		_draw($('canvas'), data);
		socket.emit('draw', data);
		
		isDrawing = false;
	});
	/**/
	
	/* Click to draw a large dot.
	canvas.on('click', function(e) {
		var data = {
			x: e.offsetX,
			y: e.offsetY,
			r: 25,
			c: '#000'
		};
	
		_draw(data);
		socket.emit('draw', data);
	});*/
	
	/* Click and drag to draw a freeform line.
	var isDrawing = false,
		mouseStops = [];
	canvas.on('mousedown', function(e) {
		isDrawing = true;
		mouseStops.length = 0;
		mouseStops.push({
			x: e.offsetX,
			y: e.offsetY
		});
	});
	canvas.on('mousemove', function(e) {
		if (!isDrawing) {
			return;
		}
		
		mouseStops.push({
			x: e.offsetX,
			y: e.offsetY
		});
	});
	canvas.on('mouseup', function(e) {
		if (!isDrawing) {
			return;
		}
		mouseStops.push({
			x: e.offsetX,
			y: e.offsetY
		});
		
		var data = {
			stops: mouseStops,
			radius: 25,
			colour: '#000'
		};
		
		_draw(data);
		socket.emit('draw', data);
		
		isDrawing = false;
	});*/
	
	socket.on('draw', function(data) {
		console.log('drawing from other user', data);
		_draw($('canvas'), data);
	});
});
