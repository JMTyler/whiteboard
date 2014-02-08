
function onload()
{
	var canvas = document.getElementById('myCanvas');
		canvas.style.border = 'dotted 1px black';
		canvas.width = 500;
		canvas.height = 500;
	
	var context = canvas.getContext('2d');
	var socket = io.connect('http://10.255.31.131');
	
	function draw(data)
	{
		context.beginPath();
		context.arc(data.x, data.y, data.r, 0, Math.PI * 2, false);
		context.closePath();
		context.fillStyle = data.c;
		context.fill();
	}
	
	canvas.addEventListener('click', function(e) {
		var data = {
			x: e.pageX - canvas.offsetLeft,
			y: e.pageY - canvas.offsetTop,
			r: 25,
			c: '#000'
		};
	
		draw(data);
		socket.emit('draw', data);
	});
	
	socket.on('draw', function(data) {
		console.log('drawing from other user', data);
		draw(data);
	});
}
