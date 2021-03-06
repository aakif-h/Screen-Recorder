
const { desktopCapturer, remote } = require('electron');
const { dialog, Menu } = remote;
const { writeFile } = require('fs');

const videoElement = document.querySelector('video');
let mediaRecorder;
const recordedChunks = [];

// buttons
const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = "Recording";
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = "Start";
}

const videoSelectBtn = document.getElementById('videoSelectBtn')
videoSelectBtn.onclick = getVideoSources;


// get the available video sources
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );
    videoOptionsMenu.popup();
}


async function selectSource(source) {
    videoSelectBtn.innerText = source.name;
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // preview the video stream in the "video" element
    videoElement.srcObject = stream;
    videoElement.play();

    // create the media recorder
    const options = { mimeType: "video/webm; codecs=vp9" };
    mediaRecorder = new MediaRecorder(stream, options);

    // register the event handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}


// capture all the recorded chunks
function handleDataAvailable(e) {
    recordedChunks.push(e.data);
}


// save the video file
async function handleStop() {
    const blob = new Blob(recordedChunks, {
        type: "video/webm; codecs=vp9"
    });
    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: "Save video",
        defaultPath: `vid-${Date.now()}.webm`
    });

    writeFile(filePath, buffer, () => console.log("Video has been saved!"));
}