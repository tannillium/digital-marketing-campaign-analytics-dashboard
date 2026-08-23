
function rollDice() {
    const dicecount = document.getElementById("dicecount").value;
    const diceResults = document.getElementById("diceresults");
    const diceImages = document.getElementById("diceimages");

    let results = 0;
    const images = [];

    for (let i = 0; i < dicecount; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        results += roll;
        images.push(`<img src="dice_images/${roll}.svg" alt="Dice ${roll}">`);
    }

    diceResults.innerHTML = `Total: ${results}`;
    diceImages.innerHTML = images.join(' ');
}
