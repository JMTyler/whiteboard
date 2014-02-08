
$(function() {
	var socket,
		canvas = $('canvas'),
		context = canvas.get(0).getContext('2d');
	
	var _draw = function(data)
	{
		context.beginPath();
		context.arc(data.x, data.y, data.r, 0, Math.PI * 2, false);
		context.closePath();
		context.fillStyle = data.c;
		context.fill();
	};
	
	canvas.css('border', 'dotted 1px black')
		.prop('width', 500)
		.prop('height', 500);
	
	socket = io.connect('http://10.255.31.131');
	
	canvas.on('click', function(e) {
		var data = {
			x: e.offsetX,
			y: e.offsetY,
			r: 25,
			c: '#000'
		};
	
		_draw(data);
		socket.emit('draw', data);
	});
	
	socket.on('draw', function(data) {
		console.log('drawing from other user', data);
		_draw(data);
	});
});
