var whiteBoardProperties = {
    isPresent: 0,
    isByYou: 0
}
var createCanvas = async () => {

    var canvasArea = document.getElementById('canvas-area');
    var canvas = document.createElement("canvas");
    var colorPickerElem = document.createElement('input');
    colorPickerElem.setAttribute('type', 'color');
    colorPickerElem.setAttribute('id', 'color-picker');


    canvas.setAttribute('id', 'canvas');
    canvasArea.appendChild(canvas);
    canvasArea.appendChild(colorPickerElem);
    canvas = document.getElementById('canvas');
    canvas.height = 563;
    canvas.width = 1108;
    console.log(canvas.height);
    console.log(canvas.width);
    var colorPicker = document.getElementById('color-picker');
    var ctx = canvas.getContext('2d');
    colorPicker.addEventListener('change', () => {
        console.log(colorPicker);
        console.log(colorPicker.value);
        ctx.strokeStyle = colorPicker.value;
        socket.emit('colorchange', ctx.strokeStyle);
    })
    socket.on('colorchange', (color) => {
        ctx.strokeStyle = color;
    })
    let draw = 0;
    let draw1 = 0;
    painter = (event) => {
        eve = {
            clientX: event.clientX,
            clientY: event.clientY
        }
        socket.emit('mousemove', eve);
        socket.emit('colorchange', colorPicker.value);
        if (draw) {
            ctx.strokeStyle = colorPicker.value;
            console.log(canvas.offsetLeft);
            console.log(canvas.offsetTop);
            ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
            ctx.lineCap = "round";
            ctx.stroke();
        }
    };
    painter1 = (event) => {
        if (draw1) {

            ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
            ctx.lineCap = "round";
            ctx.stroke();

        }
    }
    socket.on('mousedown', (event) => {
        console.log('I have received mouse down event dude!');
        draw1 = 1;
        painter1(event);

    })
    socket.on('mouseup', (event) => {

        draw1 = 0;
        ctx.beginPath();
    })
    socket.on('mousemove', painter1);
    window.addEventListener('mousedown', (event) => {
        eve = {
            clientX: event.clientX,
            clientY: event.clientY
        }
        draw = 1;
        painter(event);
        socket.emit('mousedown', eve);

    })
    window.addEventListener('mouseup', (event) => {
        eve = {
            clientX: event.clientX,
            clientY: event.clientY
        }
        draw = 0;
        ctx.beginPath();
        socket.emit('mouseup', eve);
    })
    window.addEventListener('mousemove', painter);


}
var shareWhiteboardbtn = document.getElementById('white-board-btn');
socket.on('whiteboardshared', async () => {
    if (whiteBoardProperties.isPresent == 0) {

        whiteBoardProperties.isPresent = 1;
        whiteBoardProperties.isByYou = 0;
        createCanvas();
    }
})
socket.on('whiteboardclosed', async () => {
    if (whiteBoardProperties.isPresent) {
        whiteBoardProperties.isPresent = 0;
        deleteCanvas();
    }
})
socket.on('newuserjoined', () => {
    if (whiteBoardProperties.isPresent) {
        socket.emit('whiteboardshared');
    }
})
var deleteCanvas = () => {
    var canvas = document.getElementById('canvas');
    canvas.remove();
    var colorPicker = document.getElementById('color-picker');
    colorPicker.remove();
    whiteBoardProperties.isPresent = 0;
}
shareWhiteboardbtn.addEventListener('click', () => {
    if (whiteBoardProperties.isPresent) {
        if (whiteBoardProperties.isByYou) {
            deleteCanvas();
            socket.emit('whiteboardclosed');

        }
    }
    else {
        socket.emit('whiteboardshared');
        createCanvas();
        whiteBoardProperties.isPresent = 1;
        whiteBoardProperties.isByYou = 1;
    }
});