"use strict";

// firefox freaked out when i tried to import json
// import data from './repos.json' assert { type: 'json' };

import data from './repos.js';
import { initGL } from './background.js';

var elementsArray;
var timeoutID;

var navbarHeight;

function addRepos() {
    var container= document.getElementById("repos");

    var count = Object.keys(data).length;
    for (var i = 0; i < count; i++) {
        var card = `
            <div class="repo-card row border mt-5 mx-1 p-3 align-middle">
                <div class="col-md-12">
                    <h4>
                    <svg width="1em" height="1em"><path fill="currentColor" scale="1.5" vector-effect="none" fill-rule="evenodd" d="M4,9 L3,9 L3,8 L4,8 L4,9 M4,6 L3,6 L3,7 L4,7 L4,6 M4,4 L3,4 L3,5 L4,5 L4,4 M4,2 L3,2 L3,3 L4,3 L4,2 M12,1 L12,13 C12,13.55 11.55,14 11,14 L6,14 L6,16 L4.5,14.5 L3,16 L3,14 L1,14 C0.45,14 0,13.55 0,13 L0,1 C0,0.45 0.45,0 1,0 L11,0 C11.55,0 12,0.45 12,1 M11,11 L1,11 L1,13 L3,13 L3,12 L6,12 L6,13 L11,13 L11,11 M11,1 L2,1 L2,10 L11,10 L11,1" /></svg>
                    <a href="${data[i].url}">${data[i].name}</a></h4>
                </div>
                <div class="col-12 border-bottom">
                    <p><em>${data[i].description}</em></p>
                </div>
                <div class="col-12">
                    <svg width="1em" height="1em"><circle cx="6" cy="8" r="6" stroke="black" stroke-width="0" fill="${data[i].color}" /></svg>
                    <small>${data[i].language}</small>
                </div>
            </div>`;

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

function setResumePaperSize() {
    // https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/territory_information.html
    let letterCountries = [
        "BZ",    //  Belize
        "CA",    //  Canada
        "CL",    //  Chile
        "CO",    //  Colombia
        "CR",    //  Costa Rica
        "SV",    //  El Salvador
        "GT",    //  Guatemala
        "MX",    //  Mexico
        "NI",    //  Nicaragua
        "PA",    //  Panama
        "PH",    //  Philippines
        "PR",    //  Puerto Rico
        "US",    //  United States
        "VE"     //  Venezuela
    ];

    fetch('https://geolocation-db.com/json/').then(async (response) => {
        response.clone().json().then((data) => {
            if (letterCountries.includes(data.country_code)) {
                var link = document.getElementById("resume");
                link.setAttribute("href", "./resume/Andrew Krause Resume.US-Letter.pdf");
            }
        });
    });
}

function initNavBar() {
    navbarHeight = document.querySelector('.navbar').offsetHeight;
    document.body.style.paddingTop = navbarHeight + 'px';

    var autohide = document.querySelector('.autohide');
    if (autohide) {
        var lastScrollTop = 0;
        window.addEventListener('scroll', function() {
            let scrollTop = window.scrollY;
            if (scrollTop < lastScrollTop) {
                autohide.classList.remove('scrolled-down');
                autohide.classList.add('scrolled-up');
            } else {
                autohide.classList.remove('scrolled-up');
                autohide.classList.add('scrolled-down');
            }
            lastScrollTop = scrollTop;
        }); 
    }

    // https://stackoverflow.com/questions/42401606/how-to-hide-collapsible-bootstrap-navbar-on-click
    const navLinks = document.querySelectorAll('.nav-link');
    const menuToggle = document.getElementById('main_nav');
    const bsCollapse = new bootstrap.Collapse(menuToggle, {toggle:false});
    navLinks.forEach((l) => {
        l.addEventListener('click', () => { bsCollapse.toggle() });
    })

    const logo = document.getElementById('logo');
    logo.addEventListener('click', () => { bsCollapse.hide() });
}

function init() {
    addRepos();

    elementsArray = document.querySelectorAll("div");
    window.addEventListener('scroll', fadeIn); 
    window.addEventListener('resize', fadeIn); 
    fadeIn();

    initNavBar();
    
    window.sendMail = sendMail;

    setResumePaperSize();

    initGL(document);
}

document.addEventListener("DOMContentLoaded", init);
