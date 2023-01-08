"use strict";

import data from './repos.json' assert { type: 'json' };

var canvas;
var gl;
var elementsArray;
var timeoutID;

function addRepos() {
  var container= document.getElementById("repos");

  var count = Object.keys(data).length;
  for (var i = 0; i < count; i++) {
      var card =
        '<div class="row border mt-5 mx-1 p-3 align-middle">' +
          '<div class="col-md-12">' +
            '<h4>' +
            '<svg width="1em" height="1em"><path fill="currentColor" scale="1.5" vector-effect="none" fill-rule="evenodd" d="M4,9 L3,9 L3,8 L4,8 L4,9 M4,6 L3,6 L3,7 L4,7 L4,6 M4,4 L3,4 L3,5 L4,5 L4,4 M4,2 L3,2 L3,3 L4,3 L4,2 M12,1 L12,13 C12,13.55 11.55,14 11,14 L6,14 L6,16 L4.5,14.5 L3,16 L3,14 L1,14 C0.45,14 0,13.55 0,13 L0,1 C0,0.45 0.45,0 1,0 L11,0 C11.55,0 12,0.45 12,1 M11,11 L1,11 L1,13 L3,13 L3,12 L6,12 L6,13 L11,13 L11,11 M11,1 L2,1 L2,10 L11,10 L11,1" /></svg>' +
            '<a href="' + data[i].url + '">' + data[i].name + '</a></h4>' +
          '</div>' +
          '<div class="col-12 border-bottom">' +
            '<p><em>' + data[i].description + '</em></p>' +
          '</div>' +
          '<div class="col-3">' +
            '<svg width="1em" height="1em"><circle cx="6" cy="8" r="6" stroke="black" stroke-width="0" fill="' + data[i].color + '" /></svg>' +
            '<small>' + data[i].language + '</small>' +
          '</div>' +
          '<div class="col-2">' +
            '<svg width="1em" height="1em"><path fill="currentColor" vector-effect="none" fill-rule="evenodd" d="M14,6 L9.1,5.36 L7,1 L4.9,5.36 L0,6 L3.6,9.26 L2.67,14 L7,11.67 L11.33,14 L10.4,9.26 L14,6" /></svg>' +
            '<small>\t' + data[i].stars + '</small>' +
          '</div>' +
          '<div class="col-2">' +
            '<svg width="1em" height="1em"><path fill="currentColor" vector-effect="none" fill-rule="evenodd" d="M10,5 C10,3.89 9.11,3 8,3 C7.0966,2.99761 6.30459,3.60318 6.07006,4.47561 C5.83554,5.34804 6.21717,6.2691 7,6.72 L7,7.02 C6.98,7.54 6.77,8 6.37,8.4 C5.97,8.8 5.51,9.01 4.99,9.03 C4.16,9.05 3.51,9.19 2.99,9.48 L2.99,4.72 C3.77283,4.2691 4.15446,3.34804 3.91994,2.47561 C3.68541,1.60318 2.8934,0.997613 1.99,1 C0.88,1 0,1.89 0,3 C0.00428689,3.71022 0.384911,4.3649 1,4.72 L1,11.28 C0.41,11.63 0,12.27 0,13 C0,14.11 0.89,15 2,15 C3.11,15 4,14.11 4,13 C4,12.47 3.8,12 3.47,11.64 C3.56,11.58 3.95,11.23 4.06,11.17 C4.31,11.06 4.62,11 5,11 C6.05,10.95 6.95,10.55 7.75,9.75 C8.55,8.95 8.95,7.77 9,6.73 L8.98,6.73 C9.59,6.37 10,5.73 10,5 M2,1.8 C2.66,1.8 3.2,2.35 3.2,3 C3.2,3.65 2.65,4.2 2,4.2 C1.35,4.2 0.8,3.65 0.8,3 C0.8,2.35 1.35,1.8 2,1.8 M2,14.21 C1.34,14.21 0.8,13.66 0.8,13.01 C0.8,12.36 1.35,11.81 2,11.81 C2.65,11.81 3.2,12.36 3.2,13.01 C3.2,13.66 2.65,14.21 2,14.21 M8,6.21 C7.34,6.21 6.8,5.66 6.8,5.01 C6.8,4.36 7.35,3.81 8,3.81 C8.65,3.81 9.2,4.36 9.2,5.01 C9.2,5.66 8.65,6.21 8,6.21 " /></svg>' +
            '<small>' + data[i].forks + '</small>' +
          '</div>' +
        '</div>';

      container.innerHTML += card;
    }
}

function fadeIn() {
    for (var i = 0; i < elementsArray.length; i++) {
        var elem = elementsArray[i]
        var distInView = elem.getBoundingClientRect().top - window.innerHeight + 20;
        if (distInView < 0) {
            elem.classList.add("inView");
        } else {
            elem.classList.remove("inView");
        }
    }
}

export function sendMail() {
    clearTimeout(timeoutID);
    
    var status =  document.getElementById("status");
    status.innerHTML = "Sending...";

    var form = document.getElementById("contactForm");
    const formData = new FormData(form);
    formData.set("recipient", "ajkrause@gmail.com");

    var object = {};
    formData.forEach((value, key) => {
        object[key] = value;
    });
    var json = JSON.stringify(object);

    fetch('https://alienbug.games/contactForm/contact.php', {
        method: "POST",
        // mode: 'no-cors'
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: json
    }).then(async (response) => {
        console.log(response);
        response.clone().json().then((data) => {
            console.log(data);

            status.innerHTML = data.message;
            if (data.code == 1) {
                status.classList.remove("error");
                form.reset();
            } else {
                status.classList.add("error");
            }
        }).catch((error) => {
            console.log(error);
            status.classList.add("error");
            status.innerHTML = "Something went wrong!";
        }).then(function () {
            timeoutID = setTimeout(() => {
                status.classList.remove("error");
                status.innerHTML = "&nbsp;";
            }, 3500);
        });
    });
}

function start() {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl2");
    gl.canvas.width  = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    gl.clearColor(0.025, 0.065, 0.075, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    addRepos();

    elementsArray = document.querySelectorAll("div");
    window.addEventListener('scroll', fadeIn); 
    window.addEventListener('resize', fadeIn); 
    fadeIn();
    
    window.sendMail = sendMail;
}

document.addEventListener("DOMContentLoaded", start);
