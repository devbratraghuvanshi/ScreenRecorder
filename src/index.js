const start = document.getElementById("start");
const stop = document.getElementById("stop");
const download = document.getElementById("download");
const video = document.getElementById("finalVideo");
const live = document.getElementById("recording");

const frameRate = document.querySelector('#frameRate');
const resolutions = document.querySelector('#resolutions');
const desktopAudio = document.getElementById('desktopAudio');
const micAudio = document.getElementById('micAudio');

let recorder, stream, desktopStream, voiceStream;


async function startRecording() {

    const audio = desktopAudio.checked || false;
    const mic = micAudio.checked || false;

    desktopStream = await navigator.mediaDevices.getDisplayMedia(getMediaConstraints());

    if (mic === true) {
        voiceStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: mic });
    }

    const tracks = [...desktopStream.getVideoTracks(), ...mergeAudioStreams(desktopStream, voiceStream)];

    stream = new MediaStream(tracks);
    video.srcObject = stream; //  video.src = window.URL.createObjectURL(mediaStreamObj);
    video.muted= true;
    video.controls = false;
    video.play();

    recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=h264,opus' });
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = (e) => {
        video.pause();
        video.srcObject = null;
        const completeBlob = new Blob(chunks, { type: 'video/webm' });
        video.src = URL.createObjectURL(completeBlob);
    };

    recorder.start();
}

start.addEventListener("click", () => {
    start.setAttribute("disabled", true);
    download.setAttribute("disabled", true);
    stop.removeAttribute("disabled");

    startRecording();
});

stop.addEventListener("click", () => {
    stop.setAttribute("disabled", true);

    start.removeAttribute("disabled");
    download.removeAttribute("disabled");
    video.controls = true;
    video.muted= false;
    recorder.stop();
    desktopStream.getVideoTracks()[0].stop();


});

download.addEventListener("click", () => {
    download.setAttribute("disabled", true);
    var link = document.createElement("a");
    link.href = video.src;
    link.download = new Date().toString() + ".webm"
    link.click();
});



function getMediaConstraints() {
    var Constraints = {}
    Constraints.audio = true;
    Constraints.video = { mediaSource: "screen" };

    if (frameRate.value !== 'default') {
        Constraints.video.frameRate = parseInt(frameRate.value);
    }

    if (resolutions.value !== 'default') {

        switch (resolutions.value) {
            case 'fit-screen':
                Constraints.video.width = screen.width;
                Constraints.video.height = screen.height;
                break;
            case '4K':
                Constraints.video.width = 3840;
                Constraints.video.height = 2160;
                break;
            case '1080p':
                Constraints.video.width = 1920;
                Constraints.video.height = 1080;
                break;
            case '720p':
                Constraints.video.width = 1280;
                Constraints.video.height = 720;
                break;
            case '480p':
                Constraints.video.width = 853;
                Constraints.video.height = 480;
                break;
            case '360p':
                Constraints.video.width = 640;
                Constraints.video.height = 360;
                break;
            default:
                Constraints.video.width = 1280;
                Constraints.video.height = 720;
        }
    }

    return Constraints;
}


const mergeAudioStreams = (desktopStream, voiceStream) => {
    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    let hasDesktop = false;
    let hasVoice = false;
    if (desktopStream && desktopStream.getAudioTracks().length > 0) {
        // If you don't want to share Audio from the desktop it should still work with just the voice.
        const source1 = context.createMediaStreamSource(desktopStream);
        const desktopGain = context.createGain();
        desktopGain.gain.value = 0.7;
        source1.connect(desktopGain).connect(destination);
        hasDesktop = true;
    }

    if (voiceStream && voiceStream.getAudioTracks().length > 0) {
        const source2 = context.createMediaStreamSource(voiceStream);
        const voiceGain = context.createGain();
        voiceGain.gain.value = 0.7;
        source2.connect(voiceGain).connect(destination);
        hasVoice = true;
    }

    return (hasDesktop || hasVoice) ? destination.stream.getAudioTracks() : [];
};
