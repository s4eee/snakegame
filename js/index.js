//Game Constants & Variables
let direction={x:0, y:0};
const foodSound=new Audio('food.mp3');
const gameOverSound=new Audio('gameover.mp3');
const moveSound= new Audio('move.mp3');
const musicSound= new Audio('music.mp3');
let speed=2;
let lastPaintTime=0;
let snakeArr = [
    {x: 13,y: 15}
]

//Game Functions
function main(ctime){
    window.requestAnimationFrame(main);
    console.log(ctime);
    if((ctime-lastPaintTime)/1000 < 1/speed){
        return;
    }
    lastPaintTime = ctime;
    gameEngine();
}
function gameEngine(){
    //PART 1: UPDATING THE SNAKE ARRAY & FOOD

    //PART 2: DISPLAY THE SNAKE AND FOOD
    board.innerHTML="";
    snakeArr.forEach((e, index)=>{
        snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;
        snakeElement.classList.add('food');
        board.appendChild(snakeElement);
    })
}











//main function starts here
window.requestAnimationFrame(main);