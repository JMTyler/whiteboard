
$(function() {
	var socket,
		canvas = $('canvas'),
		context = canvas.get(0).getContext('2d');
	
	// TODO: Not using 'radius' because this is a line, not a circle.
	var _draw = function(data)
	{
		var stops = data.stops;
		if (stops.length == 0) {
			return;
		}
		
		context.beginPath();
		context.moveTo(stops[0].x, stops[0].y);
		
		for (var i = 1; i < stops.length; i++) {
			context.lineTo(stops[i].x, stops[i].y);
		}
		
		context.strokeStyle = data.colour;
		context.stroke();
		
		/*context.beginPath();
		context.arc(data.x, data.y, data.r, 0, Math.PI * 2, false);
		context.closePath();
		context.fillStyle = data.c;
		context.fill();*/
	};
	
	canvas.css('border', 'dotted 1px black')
		.prop('width', 500)
		.prop('height', 500);
	
	socket = io.connect(location.href);
	
	/*canvas.on('click', function(e) {
		var data = {
			x: e.offsetX,
			y: e.offsetY,
			r: 25,
			c: '#000'
		};
	
		_draw(data);
		socket.emit('draw', data);
	});*/
	
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
	});
	
	socket.on('draw', function(data) {
		console.log('drawing from other user', data);
		_draw(data);
	});
});
