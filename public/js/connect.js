var socket;  // TODO: just for testing, so I can access it in the dev tools
$(function() {
	var //socket,
		canvas = $('canvas'),
		context = canvas.get(0).getContext('2d');
	
	var activeTool = 'freeform';
	
	var toolButtons = $('.tool');
	toolButtons.on('click', function() {
		activeTool = $(this).data('tool');
		toolButtons.each(function() {
			$(this).prop('disabled', false);
		});
		$('[data-tool="' + activeTool + '"]').prop('disabled', true);
		console.log(activeTool);
	});
	
	$('.action[data-action="clear"]').on('click', function() {
		canvas.get(0).getContext('2d').fillStyle = '#fff';
		canvas.get(0).getContext('2d').fillRect(0, 0, canvas.width(), canvas.height());
	});
	
	// TODO: Not using 'radius' because this is a line, not a circle.
	var _draw = function(canvas, data)
	{
		var tool = data.tool,
			data = data.data;
		
		switch (tool) {
			case 'circle':
				var diffX  = Math.abs(data.to.x - data.from.x),
					diffY  = Math.abs(data.to.y - data.from.y),
					radius = Math.min(diffX, diffY) / 2;
				// TODO: This is really messy and should probably be cleaned up a bit.
				var centerX = data.from.x + (radius * (data.to.x > data.from.x ? 1 : -1)),
					centerY = data.from.y + (radius * (data.to.y > data.from.y ? 1 : -1));
				
				var context = canvas.get(0).getContext('2d');
				context.beginPath();
				// TODO: Allow a modifier key to use data.from as the center rather than topleft
				context.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
				context.closePath();
				context.strokeStyle = '#000';
				context.stroke();
				
				break;
			case 'rectangle':
				var context = canvas.get(0).getContext('2d');
				context.beginPath();  // TODO: don't think this is needed
				context.strokeStyle = '#000';
				context.strokeRect(data.from.x, data.from.y, data.to.x - data.from.x, data.to.y - data.from.y);
				
				break;
			case 'line':
			case 'freeform':
				var context = canvas.get(0).getContext('2d');
				context.beginPath();  // TODO: don't think this is needed
				context.moveTo(data.from.x, data.from.y);
				context.lineTo(data.to.x, data.to.y);
				context.strokeStyle = '#000';
				context.stroke();
				
				break;
			case 'catbutt':
				var context = canvas.get(0).getContext('2d');
				context.beginPath();
				context.moveTo(data.x, data.y - 7);
				context.lineTo(data.x, data.y + 7);
				context.moveTo(data.x - 6, data.y - 4);
				context.lineTo(data.x + 6, data.y + 4);
				context.moveTo(data.x - 6, data.y + 4);
				context.lineTo(data.x + 6, data.y - 4);
				context.strokeStyle = '#000';
				context.stroke();
				
				break;
		}
		
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
		.prop('width', $('.content').width() - $('.toolbar').width() - 6)
		.prop('height', $(window).height() - 47);
	
	context.fillStyle = '#fff';
	context.fillRect(0, 0, canvas.width(), canvas.height());
	
	var showYourProgress,
		isDrawing = false,
		startPos = {x: 0, y: 0};
	$(document).on('mousedown', 'canvas', function(e) {
		isDrawing = true;
		
		startPos.x = e.offsetX;
		startPos.y = e.offsetY;
		
		if ($.inArray(activeTool, ['line', 'rectangle', 'circle']) > -1) {
			// Clone current state 
			showYourProgress = _cloneCanvas(canvas);
		}
	});
	$(document).on('mousemove', 'canvas', function(e) {
		if (!isDrawing) {
			return;
		}
		
		if ($.inArray(activeTool, ['line', 'rectangle', 'circle']) > -1) {
			context.fillStyle = '#fff';
			context.fillRect(0, 0, $(this).width(), $(this).height());
			context.drawImage(showYourProgress.get(0), 0, 0);
		}
		
		var endPos = {
			x: e.offsetX,
			y: e.offsetY
		};
		var data = {
			from: startPos,
			to: endPos
		};
		_draw(canvas, {tool: activeTool, data: data});
		
		if (activeTool == 'freeform') {
			socket.emit('draw', {tool: activeTool, data: data});
			startPos = endPos;
		}
	});
	$(document).on('mouseup', 'canvas', function(e) {
		if (!isDrawing) {
			return;
		}
		
		if ($.inArray(activeTool, ['line', 'rectangle', 'circle']) > -1) {
			context.fillStyle = '#fff';
			context.fillRect(0, 0, $(this).width(), $(this).height());
			context.drawImage(showYourProgress.get(0), 0, 0);
		}
				
		var endPos = {
			x: e.offsetX,
			y: e.offsetY
		};
		var data = {
			from: startPos,
			to: endPos
		};
		_draw($('canvas'), {tool: activeTool, data: data});
		socket.emit('draw', {tool: activeTool, data: data});
		
		isDrawing = false;
	});
	
	$(document).on('click', 'canvas', function(e) {
		if (activeTool == 'catbutt') {
			_draw($('canvas'), {tool: activeTool, data: {x: e.offsetX, y: e.offsetY}});
			socket.emit('draw', {tool: activeTool, data: {x: e.offsetX, y: e.offsetY}});
		}
	});
	
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
	
	socket = io.connect(location.href);  // Need to do this again to support socket.io namespaces... is there a better way?
	
	socket.on('connect', function() {
		console.log('sending own info up to server', userId);
		socket.emit('new_user', {userId: userId});
	});
	
	socket.on('draw', function(data) {
		console.log('drawing from other user', data);
		_draw($('canvas'), data);
	});
	
	socket.on('new_user', function(data) {
		console.log('receiving new user', data);
		$('#ulActiveUsers').append(
			$('<li>').data('userid', data.id).text(data.nickname)
		);
	});
	
	socket.on('user_disconnected', function(data) {
		console.log('receiving: user disconnected');
		$('#ulActiveUsers li').filter(function() {
			return $(this).data('userid') == data.id;
		}).remove();
	});
});
