let mediaRecorder;
let audioChunks = [];
let audioElement = null;

// ============ LOAD CONTACTS ON PAGE LOAD ============
document.addEventListener("DOMContentLoaded", () => {
    displayContacts();
});

// ============ EMERGENCY CONTACTS ============
function addEmergencyContact(name, phone) {
    const contact = { name, phone };
    let contacts = JSON.parse(localStorage.getItem("emergencyContacts")) || [];
    contacts.push(contact);
    localStorage.setItem("emergencyContacts", JSON.stringify(contacts));
    displayContacts();
}

function displayContacts() {
    const list = document.getElementById("contactList");
    if (!list) return;

    const contacts = JSON.parse(localStorage.getItem("emergencyContacts")) || [];
    list.innerHTML = "";

    contacts.forEach((contact, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${contact.name}</strong> - ${contact.phone}
            <button onclick="removeContact(${index})">❌</button>
        `;
        list.appendChild(li);
    });
}

function removeContact(index) {
    let contacts = JSON.parse(localStorage.getItem("emergencyContacts")) || [];
    contacts.splice(index, 1);
    localStorage.setItem("emergencyContacts", JSON.stringify(contacts));
    displayContacts();
}

// ============ SOS CALL + LOCATION + WHATSAPP ============
function handleSOS() {
    startLiveRecording();
    shareLocation();
    callAllEmergencyContacts();
}

function callAllEmergencyContacts() {
    const contacts = JSON.parse(localStorage.getItem("emergencyContacts")) || [];

    if (contacts.length === 0) {
        alert("No emergency contacts saved.");
        return;
    }

    let i = 0;
    function callNext() {
        if (i < contacts.length) {
            const contact = contacts[i];
            const confirmed = confirm(`Call ${contact.name} at ${contact.phone}?`);
            if (confirmed) {
                window.location.href = `tel:${contact.phone}`;
            }
            i++;
            setTimeout(callNext, 4000);
        }
    }

    callNext();
}

function shareLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const message = `🚨 I need help! Here's my location: https://maps.google.com/?q=${lat},${lng}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, "_blank");
        }, () => {
            alert("Unable to get your location.");
        });
    } else {
        alert("Geolocation not supported by your browser.");
    }
}

// ============ LIVE AUDIO RECORDING ============
async function startLiveRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioElement = document.getElementById("liveAudio");
        audioElement.srcObject = stream;
        audioElement.play();

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);

            audioElement.src = url;
            audioElement.srcObject = null;

            const downloadLink = document.createElement("a");
            downloadLink.href = url;
            downloadLink.download = "emergency_recording.webm";
            downloadLink.innerText = "Download Recording";
            document.body.appendChild(downloadLink);
        };

        mediaRecorder.start();
        console.log("Recording started");
    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access denied.");
    }
}

function stopLiveRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        const tracks = audioElement.srcObject?.getTracks();
        tracks?.forEach(track => track.stop());
        audioElement.srcObject = null;
        console.log("Recording stopped");
    }
}

// ============ FIND POLICE STATIONS ============
function findPoliceStations() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        const map = new google.maps.Map(document.createElement("div"));
        const service = new google.maps.places.PlacesService(map);

        service.nearbySearch({
            location,
            radius: 3000,
            type: ["police"]
        }, (results, status) => {
            const list = document.getElementById("stations");
            list.innerHTML = "";
            document.getElementById("stationsList").style.display = "none";

            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                document.getElementById("stationsList").style.display = "block";
                results.forEach(place => {
                    const li = document.createElement("li");
                    li.innerHTML = `<strong>${place.name}</strong><br>${place.vicinity}`;
                    list.appendChild(li);
                });
            } else {
                alert("No police stations found nearby.");
            }
        });
    }, () => {
        alert("Location access denied.");
    });
}

// ============ FLASHLIGHT FEATURE ============
async function toggleFlashlight() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const track = stream.getVideoTracks()[0];

        const imageCapture = new ImageCapture(track);
        const capabilities = await imageCapture.getPhotoCapabilities();

        if (capabilities.torch) {
            track.applyConstraints({ advanced: [{ torch: true }] });
            alert("Flashlight activated!");
        } else {
            alert("Torch not supported on this device.");
        }

        setTimeout(() => {
            track.stop();
        }, 5000); // turn off after 5s
    } catch (err) {
        console.error("Flashlight error:", err);
        alert("Could not access flashlight.");
    }
}

// ============ BATTERY WARNING ============
navigator.getBattery().then(function(battery) {
    if (battery.level < 0.15) {
        alert("⚠️ Battery is low! Please plug in your device.");
    }
});

// ============ VOICE COMMAND ============
function activateVoiceCommand() {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onresult = function(event) {
        const command = event.results[0][0].transcript.toLowerCase();
        if (command.includes("help") || command.includes("sos")) {
            handleSOS();
        }
    };

    recognition.start();
}

// ============ EMAIL ALERT ============
function sendEmailAlert() {
    emailjs.send("your_service_id", "your_template_id", {
        to_name: "Family",
        message: "Emergency! Please contact immediately.",
        location: "https://maps.google.com/?q=latitude,longitude"
    })
    .then(() => alert("Email sent!"))
    .catch(err => console.error("Email error:", err));
}

// ============ GROUP MODE HANDLER ============
function setGroupMode(group) {
    let message = "";

    switch (group) {
        case "women":
            message = "Women Mode Activated: SOS, recording, and live location enabled with extra tips.";
            break;
        case "kids":
            message = "Kids Mode Activated: Immediate alert to parents and guardian.";
            break;
        case "elders":
            message = "Elder Mode Activated: Auto emergency call and location sent to caregivers.";
            break;
        default:
            message = "Default mode active.";
    }

    alert(message);
}