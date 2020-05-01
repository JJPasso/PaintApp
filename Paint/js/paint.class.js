import Point from './point.model.js';
import Fill from './fill.js';
import {TOOL_LINE, TOOL_RECTANGLE, TOOL_CIRCLE, TOOL_BRUSH,
    TOOL_BUCKET, TOOL_ERASER, TOOL_PENCIL, TOOL_TRIANGLE, TOOL_STICKER} from './tool.js';
import { getMouseCoordsOnCanvas, findDistance }  from './utility.js';

export default class Paint{

    constructor(canvasId){
        this.canvas = document.getElementById(canvasId);
        
        this.context = canvas.getContext("2d");
        
        this.undoStack = [];
        this.undoLimit = 3;
        this.foto = {x: 50, y: 50, w: 100, h: 100};
        this.isUp = null;
    }

    set activeTool(tool){
        this.tool = tool;
    }

    set selectedSticker(sticker){
        this.sticker = sticker;
    }

    set lineWidth(linewidth){
        this._lineWidth = linewidth;
        this.context.lineWidth = this._lineWidth;
    }

    set brushSize(brushsize){
        this._brushSize = brushsize;
    }

    set selectedColor(color){
        this.color = color;
        this.context.strokeStyle = this.color;
    }

    init(){
        this.canvas.onmousedown = e => this.onMouseDown(e);
    }

    onMouseDown(e){

        this.savedData = this.context.getImageData(0, 0, this.canvas.clientWidth, this.canvas.height);

        if(this.undoStack.length >= this.undoLimit) this.undoStack.shift();
        this.undoStack.push(this.savedData);

        this.canvas.onmousemove = e => this.onMouseMove(e);
        document.onmouseup = e => this.onMouseUp(e);

        this.starPos = getMouseCoordsOnCanvas(e, this.canvas);
     

        if(this.tool == TOOL_PENCIL || this.tool == TOOL_BRUSH ){
            this.context.beginPath();
            this.context.moveTo(this.starPos.x, this.starPos.y);
        }else if(this.tool == TOOL_BUCKET){
            new Fill(this.canvas,this.starPos, this.color);
        }else if(this.tool == TOOL_ERASER){
            this.context.clearRect(this.starPos.x, this.starPos.y, 
                this._brushSize, this._brushSize);
        }else if(this.tool == TOOL_STICKER){
            var miimagen = new Image();
            miimagen.src = this.buscarSticker(this.sticker);
            this.drawImage(miimagen,this.foto.w,this.foto.h);
            
        console.log(this.starPos.x, this.starPos.y);

        if (this.starPos.x >= this.foto.w - 5 + this.foto.x
            && this.starPos.x <= this.foto.w + this.foto.x + 5
            && this.starPos.y >= this.foto.h / 2 + this.foto.y - 5
            && this.starPos.y <= this.foto.h / 2 + this.foto.y + 5
        ) {
            this.isUp = 'right';
        }

        else if (this.starPos.x >= this.foto.w / 2 + this.foto.x - 5
            && this.starPos.x <= this.foto.w / 2 + this.foto.x + 5
            && this.starPos.y >= this.foto.h + this.foto.y - 5
            && this.starPos.y <= this.foto.h + this.foto.y + 5
        ) {
            this.isUp = 'bottom';
        }

        else if (this.starPos.x >= this.foto.w + this.foto.x - 5
            && this.starPos.x <= this.foto.w + this.foto.x + 5
            && this.starPos.y >= this.foto.h + this.foto.y - 5
            && this.starPos.y <= this.foto.h + this.foto.y + 5
        ) {
            this.isUp = 'bottom-right';
        }

        else if (this.starPos.x >= this.foto.x - 5 && this.starPos.x <= this.foto.x + 5
            && this.starPos.y >= this.foto.y - 5 && this.starPos.y <= this.foto.y + 5
        ) {
            this.isUp = 'top-left';
        }
        }
    }

    onMouseMove(e){
        this.currentPos = getMouseCoordsOnCanvas(e, this.canvas);
        

        switch(this.tool){
            case TOOL_LINE:
            case TOOL_RECTANGLE:
            case TOOL_CIRCLE:
            case TOOL_TRIANGLE:
                this.drawShape();
                break;
            case TOOL_PENCIL:
                this.drawFreeLine(this._lineWidth);
                break;
            case TOOL_BRUSH:
                this.drawFreeLine(this._brushSize);
                break;
            case TOOL_ERASER:
                this.context.clearRect(this.currentPos.x, this.currentPos.y, 
                    this._brushSize,this._brushSize);
                break;
            case TOOL_STICKER:
                var miimagen = new Image();
                miimagen.src = this.buscarSticker(this.sticker);
                if (this.isUp === 'right') {
                    this.foto.w = this.currentPos.x - this.foto.x;
                    /*this.context.clearRect(0, 0, 900, 600);*/
                    this.drawImage(miimagen, this.foto.w, this.foto.h);
                }
        
                else if (this.isUp === 'bottom') {
                    this.foto.h = this.currentPos.y - this.foto.y;
                    this.context.clearRect(0, 0, 900, 600);
                    this.drawImage(miimagen, this.foto.w, this.foto.h);
                }
        
                else if (this.isUp === 'bottom-right') {
                    this.foto.w = this.currentPos.x - this.foto.x;
                    this.foto.h = this.currentPos.y - this.foto.y;
                    /*this.context.clearRect(0, 0, 900, 600);*/
                    this.drawImage(miimagen, this.foto.w, this.foto.h);
                }
        
                else if (this.isUp === 'top-left') {
                    var dx = this.foto.x - this.currentPos.x;
                    var dy = this.foto.y - this.currentPos.y;
                    this.foto.x = this.currentPos.x;
                    this.foto.y = this.currentPos.y;
                    this.foto.w += dx;
                    this.foto.h += dy;
                    /*this.context.clearRect(0, 0, 900, 600);*/
                    this.drawImage(miimagen, this.foto.w, this.foto.h);
                }
            default:
                break;
        }
    }

    onMouseUp(e){
        this.canvas.onmousemove = null;
        document.onmouseup = null;
        this.isUp = null;
        /*this.isDragging = false;*/
    }

    drawShape(){

        this.context.putImageData(this.savedData, 0, 0);

        this.context.beginPath();

        if(this.tool == TOOL_LINE){
            this.context.moveTo(this.starPos.x, this.starPos.y);
            this.context.lineTo(this.currentPos.x,this.currentPos.y);
        }else if(this.tool == TOOL_RECTANGLE){
            this.context.rect(this.starPos.x, this.starPos.y, this.currentPos.x - this.starPos.x, this.currentPos.y - this.starPos.y);
        }else if(this.tool == TOOL_CIRCLE){
            let distance = findDistance(this.starPos, this.currentPos);
            this.context.arc(this.starPos.x, this.starPos.y, distance, 0, 2 * Math.PI, false);
        }else if(this.tool = TOOL_TRIANGLE){
            this.context.moveTo(this.starPos.x + (this.currentPos.x - this.starPos.x) / 2, this.starPos.y);
            this.context.lineTo(this.starPos.x, this.currentPos.y);
            this.context.lineTo(this.currentPos.x, this.currentPos.y);
            this.context.closePath(); 
        }
        this.context.stroke();

    }

    drawFreeLine(){
        this.context.lineTo(this.currentPos.x, this.currentPos.y);
        this.context.stroke();
    }

    undoPaint(){
        if(this.undoStack.length > 0){
            this.context.putImageData(this.undoStack[this.undoStack.length - 1],0,0);
            this.undoStack.pop();
        }else{
            alert("no undo available");
        }
    }

    clearCanvas(){
        this.context.clearRect(0, 0, canvas.width, canvas.height);
    }

    buscarSticker(sticker){
        if(sticker == 'pepa'){
            return "http://upload.wikimedia.org/wikipedia/commons/d/d2/Svg_example_square.svg";
        }
    }

    drawImage(image, w, h) {
        this.context.drawImage(image, this.foto.x, this.foto.y, w, h);

        this.context.fillStyle = 'black';

        this.context.beginPath();
        this.context.arc(this.foto.x, this.foto.y, 5, 0, Math.PI * 2, 1);
        this.context.fill();

        this.context.beginPath();
        this.context.arc(w + this.foto.x, h / 2 + this.foto.y, 5, 0, Math.PI * 2, 1);
        this.context.fill();

        this.context.beginPath();
        this.context.arc(w / 2 + this.foto.x, h + this.foto.y, 5, 0, Math.PI * 2, 1);
        this.context.fill();

        this.context.beginPath();
        this.context.arc(w + this.foto.x, h + this.foto.y, 5, 0, Math.PI * 2, 1);
        this.context.fill();
    }
}