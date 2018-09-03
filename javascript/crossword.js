var width = 15;
var height = 15;

var direction = "right";

var across = 0;
var down = 0;	
var nums = 0;

var numFilled = 0;
var numLetters = 0;

var previousX = 0;
var previousY = 0;

var grid = 0;
var filledIn = 0;

var maxMessages = 10;

var socket = io();

var won = false;

function blankLetter(grid,width,i,j){
	return grid[i*width+j]==".";
}

function checkWin(){	
	if(numFilled == numLetters && !won){
		var solved = true;
		
		for(var i = 0;i<height && solved;i++){
			for(var j = 0;j<width && solved;j++){
				var actualValue = grid[i*width+j];
				actualValue = actualValue.toUpperCase();
				var submittedValue = $("#"+(j+1)+"_"+(i+1)).val();
				submittedValue = submittedValue.toUpperCase();
				if(actualValue!="." && submittedValue != actualValue){
					solved = false;
				}
			}
		}
		
		if(solved){
			alert("Congrats, you've solved the puzzle!");
			won = true;
		}
	}
}

$("#enter").click(function(){
		var month = $("#month").val();
		var date = $("#date").val();
		var name = $("name").val();

		socket.emit('request',month+"/"+date);	
	}
);

socket.on('entered', function(msg){
	var temp = msg.split("_");
	var currentX = temp[0];
	var currentY = temp[1];
	var value = temp[2]
	
	var gridBox = $("#"+currentX+"_"+currentY);
	var oldLength = gridBox.val().length;
	gridBox.val(value);
	
	if(value.length == 0 && oldLength == 1){
		numFilled-=1;
	}
	else if(value.length == 1 && oldLength == 0){
		numFilled+=1;
	}
	
	checkWin();
});

socket.on('metadata',function(msg){
	console.log("Got data");
	createCrossword(msg);
	init();
});

socket.on('message', function(msg){
	$('#messages').append($('<li>').text(msg));
	var numMessages = $("#message li").length
	if(numMessages>maxMessages ){
		$("#messages li").first().remove();
	}
});

function createCrossword(data){
	grid = data.grid;
	nums = data.gridnums;
	width = data.size.cols;
	height = data.size.rows;
	
	filledIn = [];
		
	for(var i = 0;i<height;i++){
		var temp = []
		for(var j = 0;j<width;j++){
			if(!blankLetter(grid,width,i,j)){
				numLetters+=1;
			}
			
			temp.push(false);
		}
		filledIn.push(temp);
	}
	
			
	var html = "";
	
	html+='<table cellspacing="0" id="crossword">'
	
	for(i = 0;i<height;i++){
		html+="<tr>\n"
		for(j = 0;j<width;j++){
			var num = width*i+j;
			html+='<div class="container">'
			if(nums[num]!=0){
				html+='<div class="top-left">'
				html+=String(nums[num])
				html+="</div>";
			}
			
			html+='<input type="text" id="'
			html+=String(j+1)
			html+="_"
			html+=String(i+1)
			html+='" size="1" maxlength="1"'
			
			if(grid[num] == "."){
				html+='class="black"'
			}
			
			html+="> </input>";
			html+="</div>";
		}
		
		html+="</tr>"
		html+="\n"
		
		if(i!=width-1){
			html+="<br>"
			html+="\n";
		}
		
		html+="\n";
	}	
	
	across = data.clues.across;
	down = data.clues.down;

	html+='</table>';
	html+='<p id="clue"> </p>';
	
	//Messages
	html+='<ul id="messages"></ul>\n';
	html+='<input id="m">';
	html+='<button type="button" id="send">Send</button>\n'
    html+='</form>\n';
	
	document.body.innerHTML = html;
}

function currentClue(currentX,currentY){
	if(direction == "up"){
		var startY = currentY;
					
		while(startY>=2 && !$("#"+(currentX)+"_"+(startY-1)).hasClass("black")){
			startY-=1;
		}
		
		var gridNum = nums[(startY-1)*width+(currentX-1)];
		var target = String(gridNum) + ".";
		
		for(j = 0;j<down.length;j++){
			var downClue = down[j].substring(0,target.length);
			if(downClue == target){
				return down[j];
			}
		}
	}
	else if(direction == "right"){
		var startX = currentX;
		
		while(startX>=2 && !$("#"+(startX-1)+"_"+currentY).hasClass("black")){
			startX-=1;
		}
		
		var gridNum = nums[(currentY-1)*width+(startX-1)];
		var target = String(gridNum)+".";
		
				
		for(j = 0;j<across.length;j++){
			var acrossClue = across[j].substring(0,target.length);
			if(acrossClue==target){	
				return across[j];
			}
		}
	}
	
	return "";
}

function sendMessage(){
	socket.emit('message', name+": "+$('#m').val());
	$('#m').val('');	
}

function clearRow(currentY){	
	for(var i = 1;i<=width;i++){
		$("#"+i+"_"+currentY).removeClass("highlighted");
	}
}

function clearColumn(currentX){
	for(var i = 1;i<=height;i++){
		if(!$("#"+currentX+"_"+i).hasClass("black"))
		{
			$("#"+currentX+"_"+i).removeClass("highlighted");
		}
	}
}

function fillRow(currentX,currentY){
	// Fill Left then fill right
	i = currentX;
	while(i>=1 && !$("#"+i+"_"+currentY).hasClass("black")){
		$("#"+i+"_"+currentY).addClass("highlighted");
		i-=1;
	}
	
	i = currentX;
	while(i<=width && !$("#"+i+"_"+currentY).hasClass("black")){
		$("#"+i+"_"+currentY).addClass("highlighted");
		i+=1;
	}
}

function fillColumn(currentX,currentY)
{
	//Fill up then fill down
	i = currentY;
	while(i>=1 && !$("#"+currentX+"_"+i).hasClass("black")){
		$("#"+currentX+"_"+i).addClass("highlighted");
		i-=1;
	}
	
	i = currentY;
	while(i<=height && !$("#"+currentX+"_"+i).hasClass("black")){
		$("#"+currentX+"_"+i).addClass("highlighted");
		i+=1;
	}
}	

function nextDown(currentX,currentY){
	var nextY = currentY;
	var i = currentY+1;
	while(i<=height && i!=nextY)
	{
		if(!$("#"+currentX+"_"+i).hasClass("black"))
		{
			nextY = i;
		}
		else 
		{
			i+=1;
		}

	}
	
	return nextY;
}

function nextUp(currentX,currentY)
{
	var nextY = currentY;
	var i = currentY-1;
	while(i>=1 && i!=nextY)
	{
		if(!$("#"+currentX+"_"+i).hasClass("black"))
		{
			nextY = i;
		}
		else 
		{
			i-=1;
		}

	}
	
	return nextY;;
}

function nextLeft(currentX,currentY)
{
	var nextX = currentX;
	var i = currentX-1;
	while(i>=1 && nextX!=i)
	{
		if(!$("#"+i+"_"+currentY).hasClass("black"))
		{
			nextX = i;
		}
		else 
		{
			i-=1;
		}
	}
	
	return nextX;
}

function nextRight(currentX,currentY)
{
	var nextX = currentX;
	var i = currentX+1;
	while(i>=1 && nextX!=i)
	{
		if(!$("#"+i+"_"+currentY).hasClass("black"))
		{
			nextX = i;
		}
		else 
		{
			i+=1;
		}
	}
	
	return nextX;
}

function init()
{
	var readyToBreak = false;
	
	for(i = 0;i<height;i++)
	{
		for(j = 0;j<width;j++)
		{
			if(grid[i][j]!=".")
			{
				$("#"+(j+1)+"_"+(i+1)).focus();
				$("#clue").html(currentClue(j+1,i+1));
				fillRow(j+1,i+1);
				readyToBreak = true;
				break;
			}
		}
				
		if(readyToBreak)
		{
			break;
		}
	}
		   
	for(var i = 1;i<=width;i++)
	{
		for(var j = 1;j<=height;j++)
		{
			$("#"+String(i)+"_"+String(j)).on('input',function()
			{
				if($(this).val() == " ")
				{
					$(this).val("");
				}
			
				var current = $(this).attr('id').split("_");
			
				var currentX = parseInt(current[0]);
				var currentY = parseInt(current[1]);
								
				if($(this).val().length == 0 && filledIn[currentY-1][currentX-1])
				{
					filledIn[currentY-1][currentX-1] = false;
					numFilled-=1;
				}
				else if($(this).val().length == 1 && !filledIn[currentY-1][currentX-1])
				{
					filledIn[currentY-1][currentX-1] = true;
					numFilled+=1;
				}
				
				checkWin();
				
				socket.emit('entered',String(currentX)+"_"+String(currentY)+"_"+$("#"+String(currentX)+"_"+String(currentY)).val());
				
				if($(this).val().length>0)
				{	
					if(direction == "right")
					{		
						clearRow(currentY);
						
						var i = currentX;

						while(i<=width && ($("#"+i+"_"+currentY).val()!="" || $("#"+i+"_"+currentY).hasClass("black")))
						{
							i+=1;
						}
						
						if(i<=width && !($("#"+i+"_"+currentY).val()!="" || $("#"+i+"_"+currentY).hasClass("black")))
						{
							currentX = i;
						}
						
						fillRow(currentX,currentY);
					}
					else if(direction == "up")
					{
						clearColumn(currentX);
						
						var i = currentY;

						while(i<=height && ($("#"+currentX+"_"+i).val()!="" || $("#"+currentX+"_"+i).hasClass("black")))
						{
							i+=1;
						}
						
						if(i<=height && !($("#"+currentX+"_"+i).val()!="" || $("#"+currentX+"_"+i).hasClass("black")))
						{
							currentY = i;
						}
						
						fillColumn(currentX,currentY);
					}
					
					$("#"+currentX+"_"+currentY).val($("#"+currentX+"_"+currentY).val());
					$("#"+currentX+"_"+currentY).select();
					
					previousX = currentX;
					previousY = currentY;
					
					$("#clue").html(currentClue(currentX,currentY));
				}
				

			});
						
			$("#"+i+"_"+j).click(function(){
				var current = $(this).attr('id').split("_");
				
				var currentX = parseInt(current[0]);
				var currentY = parseInt(current[1]);
				
				if(currentX == previousX && currentY == previousY)
				{
					if(direction == "up")
					{
						direction = "right";
					}
					else if(direction == "right")
					{
						direction = "up";
					}
				}
				
				for(var i1 = 1;i1<=height;i1++)
				{
					clearRow(i1);
				}
				
				if(direction == "right")
				{
					fillRow(currentX,currentY);
				}
				
				else if(direction == "up")
				{
					fillColumn(currentX,currentY);
				}
				
				$("#clue").html(currentClue(currentX,currentY));
				
				previousX = currentX;
				previousY = currentY;
			});
		}
	}			

	$('#send').click(function()
	{
		sendMessage();
	});

}
   
$(document).keyup(function(e){		
	var num = $("*:focus").attr("id").split("_");
	var currentX = parseInt(num[0]);
	var currentY = parseInt(num[1]);
	
	if($("*:focus").attr("id") == "m")
	{
		if(e.keyCode == 13)
		{
			sendMessage();
		}
	}
	
	if(isNaN(currentX) || isNaN(currentY))
	{
		return false;
	}
	
	//Backspace
	if(e.keyCode == 8)
	{
		socket.emit('entered',String(currentX)+"_"+String(currentY)+"_");		

		if(filledIn[currentY-1][currentX-1])
		{
			filledIn[currentY-1][currentX-1] = false;
			numFilled-=1;
		}
		
		checkWin();
		
		if($(this).val().length != 0)
		{
			$(this).val('');
		}
		else
		{	
			if(direction == "up")
			{	
				clearColumn(currentX);		
				clearRow(currentY);
						
				currentY = nextUp(currentX,currentY);		

				fillColumn(currentX,currentY);
			}
			else if(direction == "right")
			{
				clearRow(currentY);
				clearColumn(currentX);	
				
				//Find the next on the left 			
				currentX = nextLeft(currentX,currentY);
				
				fillRow(currentX,currentY);
			}
					
			$("#"+currentX+"_"+currentY).select();
			
			$("#clue").html(currentClue(currentX,currentY));
		}	

		
	}
	
	//Up
	if (e.keyCode == 38) 
	{ 
		clearColumn(currentX);		
		clearRow(currentY);
				
		if(direction!="up")
		{
			direction = "up";
		}
		else
		{				
			currentY = nextUp(currentX,currentY);		
			var next = currentX+"_"+currentY;
			$("#"+next).select();
		}
		
		fillColumn(currentX,currentY);
	}
	
	//Down
	if (e.keyCode == 40) 
	{ 
		clearColumn(currentX);		
		clearRow(currentY);
				
		if(direction!="up")
		{
			direction = "up";
		}
		else
		{				
			currentY = nextDown(currentX,currentY);
		
			var next = currentX+"_"+currentY;
			
			$("#"+next).select();
		}
		
		fillColumn(currentX,currentY);
	}
	
	//Left
	if (e.keyCode == 37) 
	{ 
		clearRow(currentY);
		clearColumn(currentX);
		
		if(direction!="right")
		{
			direction = "right";
		}
		else
		{	
			//Find the next on the left 			
			currentX = nextLeft(currentX,currentY);
			
			var next = currentX+"_"+currentY;
			$("#"+next).select();
		}
		
		fillRow(currentX,currentY);
	}
	
	//Spacebar 
	if(e.keyCode == 32)
	{
		if(direction == "up")
		{
			clearColumn(currentX);
			fillRow(currentX,currentY);
			direction = "right";
		}
		else
		{			
			clearRow(currentY);
			fillColumn(currentX,currentY);
			direction = "up";
		}
		
	}
	
	//Right
	if (e.keyCode == 39) 
	{ 
		clearRow(currentY);
		clearColumn(currentX);
		
		if(direction!="right")
		{
			direction = "right";
		}
		else
		{	
			//Find the next on the left 			
			currentX = nextRight(currentX,currentY);
			
			var next = currentX+"_"+currentY;
			$("#"+next).select();
		}
		
		fillRow(currentX,currentY);
	}
	
	previousX = currentX;
	previousY = currentY;
	$("#clue").html(currentClue(currentX,currentY));
	
		
});

