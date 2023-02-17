let URL = "https://codecyprus.org/th/api";
let questionType = {"BOOLEAN": "radio", "INTEGER": "number", "TEXT": "text", "NUMERIC": "number", "MCQ": "radio"};
var geotimer;

function listHunts() {
    let main = document.getElementById("main");
    let list = document.createElement("ol");
    main.appendChild(list);




    fetch(URL + "/list").then(response => response.json()).then(json => {

        for (let i = 0; i < json.treasureHunts.length; i++) {
            let entry = document.createElement("li");
            entry.innerHTML = "<button onclick=registerPlayer(\'" + json.treasureHunts[i].uuid + "\')>" + json.treasureHunts[i].name + "</button>";
            list.appendChild(entry);
        }

    })

}

function showLeaderboard(){
    //Clean page
    let main = document.getElementById("main");
    main.innerHTML = "";
    //Stop geolocation
    clearInterval(geotimer);

    let list = document.createElement("ol");
    main.appendChild(list);

    let session = localStorage.getItem("session");

    fetch(URL + "/leaderboard?session=" + session + "&sorted").then(response => response.json()).then(json => {

        for (let i = 0; i < json.numOfPlayers; i++) {
            let entry = document.createElement("li");
            entry.innerHTML = "<div>" + json.leaderboard[i].player + "<p>" + json.leaderboard[i].score + "Pts" + "</p>" + "" + "</div>";
            list.appendChild(entry);
        }

    })

}

function registerPlayer(huntID) {
    //Clean page
    document.getElementById("main").innerHTML = "";

    //Starting geolocation counter
    geotimer = setInterval(getLocation, 30000);

    //Check if the player is registered
    if (localStorage.getItem("session") !== null) {
        displayCurrentQuestion();
    } else {
        displayInputHTML("text", "startHunt", huntID);
    }
}

function startHunt(huntID) {

    let playerName = document.getElementById("playerInput").value;
    //Clean page
    document.getElementById("main").innerHTML = "";

    fetch(URL + "/start?player=" + playerName + "&app=ourApp&treasure-hunt-id=" + huntID).then(response => response.json()).then(json => {
        console.log(json);
        //store session
        localStorage.setItem("session", json.session);
        displayCurrentQuestion();
    })

}

function displayCurrentQuestion() {
    let session = localStorage.getItem("session");
    document.getElementById("main").innerHTML = "";

    getScore();
    //Get question from server
    fetch(URL + "/question?session=" + session).then(response => response.json()).then(json => {
        console.log(json);

        if(json.completed){
            showLeaderboard();
            return;
        }
        if (json.requiresLocation) {
            getLocation();
        }
        let questionText = document.createElement("div");
        questionText.innerHTML = json.questionText;
        document.getElementById("main").appendChild(questionText);

        displayInputHTML(json, "answerQuestion");

    })
}

function getScore(){
    let session = localStorage.getItem("session");

    fetch(URL + "/score?session=" + session).then(response => response.json()).then(json => {
        console.log(json);
        document.getElementById("score").innerHTML = json.score;
    })
}

function skipQuestion(){
    let session = localStorage.getItem("session");

    fetch(URL + "/skip?session=" + session).then(response => response.json()).then(json => {
        console.log(json);
        displayCurrentQuestion();
    })
}

function answerQuestion() {

    document.getElementById("submitButton").setAttribute("disabled", "");

    let session = localStorage.getItem("session");
    let playerAnswer;
    if(document.getElementById("playerInput") !== null){
        playerAnswer = document.getElementById("playerInput").value;
    } else {
        //Getting the bool or MCQ value from a radio button
        let radioInput = document.getElementsByClassName("playerInput");
        if (radioInput[0].type === 'radio') {
            for (let option of radioInput) {
                if (option.checked) {
                    playerAnswer = option.value;
                }
            }
        }
    }
    fetch(URL + "/answer?session=" + session + "&answer=" + playerAnswer).then(response => response.json()).then(json => {
        console.log(json);
        if (json.correct) {
            displayCurrentQuestion();
        } else {
            alert("You have answered incorrectly!");
            displayCurrentQuestion();
        }
    })
}

function getLocation(){
    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(coordinates => {
            let latitude = coordinates.coords.latitude;
            let longitude = coordinates.coords.longitude;

            sendLocation(latitude, longitude);

        });
    }
    else {
        //TODO - Geolocation is NOT supported by browser.
        alert("Geolocation is not supported by your browser.");

    }
}

function sendLocation(latitude, longitude){


    let session = localStorage.getItem("session");

    fetch(URL + "/location?session=" + session + "&latitude=" + latitude + "&longitude=" + longitude).then(response => response.json()).then(json => {
        console.log(json);
        //TODO - handle errors
        if(json.status !== "OK"){

        }
    })

}

function displayInputHTML(inputObject, functionCall, functionParam = "") {


    let form = document.createElement("form");
    form.setAttribute("onsubmit", functionCall + "(\'" + functionParam + "\'); return false;");

    if (inputObject.questionType === 'BOOLEAN') {
        form.innerHTML = "<input required type=\"radio\" class=\"playerInput\" name=\"playerInput\" value=\"true\">\n" +
                         "<label for=\"playerInput\">True</label>\n" +
                         "<input type=\"radio\" class=\"playerInput\" name=\"playerInput\" value=\"false\">\n" +
                         "<label for=\"playerInput\">False</label><br>"

    } else if (inputObject.questionType === 'MCQ') {
        form.innerHTML = "<input required type=\"radio\" class=\"playerInput\" name=\"playerInput\" value=\"A\">\n" +
                         "<label for=\"playerInput\">A</label>\n" +
                         "<input type=\"radio\" class=\"playerInput\" name=\"playerInput\" value=\"B\">\n" +
                         "<label for=\"playerInput\">B</label>\n" +
                         "<input type=\"radio\" class=\"playerInput\" name=\"playerInput\" value=\"C\">\n" +
                         "<label for=\"playerInput\">C</label>\n" +
                         "<input type=\"radio\" class=\"playerInput\" name=\"playerInput\" value=\"D\">\n" +
                         "<label for=\"playerInput\">D</label><br>"

    } else {
        let playerAnswerField = document.createElement("input");
        playerAnswerField.setAttribute("type", questionType[inputObject.questionType]);
        if (inputObject.questionType === 'NUMERIC') {
            playerAnswerField.setAttribute("step", "0.00001");
        }
        playerAnswerField.setAttribute("id", "playerInput");
        playerAnswerField.setAttribute("required", "required")
        form.appendChild(playerAnswerField);
    }

    // Skip buttion
    if(inputObject.canBeSkipped) {
        let skipButton = document.createElement("button");
        skipButton.innerText = "SKIP";
        skipButton.setAttribute("onclick", "skipQuestion()");
        form.appendChild(skipButton);
    }

    let submit = document.createElement("input");
    submit.setAttribute("type", "submit");
    submit.setAttribute("id", "submitButton")
    document.getElementById("main").appendChild(form);

    form.appendChild(submit);

}