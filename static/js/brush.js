function createBrush(id, c){
		var canvas = document.getElementById(id+'-1');
		var context = canvas.getContext('2d');
		var canvas2 = document.getElementById(id+'-2');
		var context2 = canvas2.getContext('2d');

        var content = document.getElementById(id+'_content');

		var linex = [];
		var liney = [];
		var lastX = -1;
		var lastY = -1;
		var flag = 0;

		//临时绘图数据
		var imageData = "";
        if(c!= undefined && c.brush != undefined){
            c.brush.destroy();
            c.brush.clear();
            if(c.brush_data != undefined){
                var img = new Image();
                img.onload = function(){
                    context2.drawImage(img,0 ,0);
                }
                img.src = c.brush_data;

            }
		}
        resize();

//        destroyBrush();
		canvas.addEventListener('mousemove', onMouseMove, false);
		canvas.addEventListener('mousedown', onMouseDown, false);
		canvas.addEventListener('mouseup', onMouseUp, false);
		canvas.addEventListener('mouseout', onMouseOut, false);

        c.brush = {
		    destroy:destroyBrush,
            clear:clearCanvas,
            resize: resize,
         };


        function resize(){
            canvas.setAttribute("width", content.offsetWidth);
            canvas.setAttribute("height", content.offsetHeight);
            canvas2.setAttribute("width", content.offsetWidth);
            canvas2.setAttribute("height", content.offsetHeight);

            //context.fillRect(0, 0, canvas.width, canvas.height);
            //context2.fillRect(0, 0, canvas2.width, canvas2.height);
        }
		function onMouseMove(evt) {
			if (flag == 1) {

				var x = evt.layerX;
				var y = evt.layerY;
				linex.push(x);
				liney.push(y);
				context.lineTo(x,y);
				lastX = x;
				lastY = y;

				context.lineCap="round";
				context.lineJoin="round";
				context.lineWidth = 2;
				context.shadowColor = 'white';

				context.strokeStyle = "rgba(254,0,0,1)";
				context.globalCompositeOperation="destination-out";
				context.stroke();
				context.strokeStyle = "rgba(254,0,0,0.5)";
				context.globalCompositeOperation="source-over";
				context.stroke();
			}
		 }

		 function onMouseDown(evt) {
			flag = 1;
			lastX = evt.layerX;
			lastY = evt.layerY;
			linex.push(lastX);
			liney.push(lastY);

			context.beginPath();
			context.moveTo(lastX,lastY);
		 }

		 function onMouseUp(evt) {
			flag = 0;
			context.clearRect(0,0,canvas.width, canvas.height);
			reDraw();
		 }

		 function onMouseOut(evt){
			flag = 0;
			context.clearRect(0,0,canvas.width, canvas.height);
			reDraw();
		 }

		 function reDraw(){
			if(linex.length > 0){
				var x = linex[0];
				var y = liney[0];
				context2.beginPath();
				context2.moveTo(x,y);

				for(var i=1; i<linex.length; i++){
					x = linex[i];
					y = liney[i];
					context2.lineTo(x,y);
				}
				linex.length = 0;
				liney.length = 0;

				context2.lineCap="round";
				context2.lineJoin="round";
				context2.lineWidth = 3;
				context2.shadowColor = 'white';
				context2.strokeStyle = "rgba(254,0,0,0.5)";
				context2.stroke();

				c.brush_data = canvas2.toDataURL();
			}
		 }

		 function clearCanvas(){
                var canvas2 = document.getElementById(id+'-2');
                var context2 = canvas2.getContext('2d');
                context2.clearRect(0, 0, canvas2.width, canvas2.height);
                reDraw();
        }
        function destroyBrush(){
                var canvas = document.getElementById(id+'-1');
                canvas.removeEventListener('mousemove', onMouseMove, false);
                canvas.removeEventListener('mousedown', onMouseDown, false);
                canvas.removeEventListener('mouseup', onMouseUp, false);
                canvas.removeEventListener('mouseout', onMouseOut, false);
        }

		 return {
		    destroy:destroyBrush,
            clear:clearCanvas,
            resize: resize,
         };
}

