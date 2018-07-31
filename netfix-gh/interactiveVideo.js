const interactiveVideo = {
    startNode: null,
    videoNode: null,
    video: null,
    playlist: [],
    buffer: [],
    currentNode: null,
    mediaSource: null,
    sourceBuffer: null,
    check: true,
    mimeCodec: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    sourceOpen: () => {
        interactiveVideo.sourceBuffer = interactiveVideo.mediaSource.addSourceBuffer(interactiveVideo.mimeCodec);
        //至关重要，解决切换时候卡顿声音先放的问题 用了三个小时才找到这个解决办法
        //默认的mode是 'segment'， 是基于时间轴来播放的，而不是顺序
        interactiveVideo.sourceBuffer.mode = 'sequence';
        interactiveVideo.currentNode = interactiveVideo.startNode;
        interactiveVideo.playlist.push(interactiveVideo.startNode);
        interactiveVideo.fetchVideo(interactiveVideo.startNode,interactiveVideo.fetchVideoCallback);
        interactiveVideo.video.addEventListener('timeupdate', interactiveVideo.checkBuffer);
        interactiveVideo.video.addEventListener('canplay',()=>{
            interactiveVideo.video.play();
        });
        interactiveVideo.video.addEventListener('seeking',interactiveVideo.seek);
    },
    fetchVideo: (node,cb) => {
        if (node in interactiveVideo.buffer) return false;

        const nodeInfo = interactiveVideo.videoNode[node];
        let xhr = new XMLHttpRequest;
        xhr.open('get', nodeInfo.url);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
            console.log('getch bytes');
            cb(xhr.response, node);
        }
        xhr.send();
    },
    fetchVideoCallback: (response,node) => {
        interactiveVideo.buffer[node] = response;
        if (node == interactiveVideo.startNode) {
            interactiveVideo.sourceBuffer.appendBuffer(interactiveVideo.buffer[startNode]);
            interactiveVideo.videoNode[startNode].prefecth.forEach(element => {
                interactiveVideo.fetchVideo(element, interactiveVideo.fetchVideoCallback);
            });
        }
    },
    checkBuffer: (_) => {
        const currentTime = interactiveVideo.video.currentTime;
        const duration = interactiveVideo.video.duration;
        if(duration- currentTime < 8 && interactiveVideo.check){
            interactiveVideo.check = false;
            interactiveVideo.currentNode = interactiveVideo.playlist.slice(-1)[0];
            console.log('time to choose');
            const buttons = interactiveVideo.videoNode[interactiveVideo.currentNode].buttons;
            buttons&&interactiveVideo.createButtons(buttons);
            //sourceBuffer.appendBuffer(buffer['node2']);
        }
    },
    seek: (e) => {
        console.log(e);
        if (interactiveVideo.mediaSource.readyState === 'open') {
            interactiveVideo.sourceBuffer.abort();
            console.log(interactiveVideo.mediaSource.readyState);
        } else {
            console.log('seek but not open?');
            console.log(interactiveVideo.mediaSource.readyState);
        }
    },
    shouldFetchNext: () => {
        //console.log(interactiveVideo);
    },
    createButtons: (buttons) => {
        const str = buttons.map((e)=>{
            return `<button class="interactive_button" data-to="${e.to}">${e.text}</button>`;
        }).join('');
        const buttonGropuElement = document.createElement('div');
        buttonGropuElement.className = 'buttonGroup';
        const fatherNode = interactiveVideo.video.parentNode;
        buttonGropuElement.innerHTML = str;
        fatherNode.appendChild(buttonGropuElement);

        buttonGropuElement.addEventListener('click',(e)=>{
            e = e || window.event;
            const target = e.target || e.srcElement;
            if(!!target && target.dataset.to){
                interactiveVideo.toNext(target.dataset.to);
            }
        });
    },
    toNext: (nextNode) => {
        interactiveVideo.sourceBuffer.appendBuffer(interactiveVideo.buffer[nextNode]);
        const buttonGroup = document.querySelector('.buttonGroup');
        buttonGroup.parentNode.removeChild(buttonGroup);
        interactiveVideo.check = true;
        interactiveVideo.playlist.push(nextNode);
        interactiveVideo.videoNode[nextNode].prefecth.forEach(element => {
                interactiveVideo.fetchVideo(element,interactiveVideo.fetchVideoCallback);
        });
    },
    init: ({videoId, startNode, videoNode,mimeCodec}) => {
        console.log(interactiveVideo);
        interactiveVideo.video = document.querySelector(`#${videoId}`);
        interactiveVideo.startNode = startNode;
        //mimeCodec && (interactiveVideo.mimeCodec = mimeCodec);
        let newVideoNode = {};
        for(let key in videoNode) {
            let element = videoNode[key];
            newVideoNode[key] = {
                isEnd: false,
                prefecth: [],
                ...element,
            }
        }
        interactiveVideo.videoNode = videoNode; 
        console.log(interactiveVideo.mimeCodec);
        if ('MediaSource' in window && window.MediaSource.isTypeSupported(interactiveVideo.mimeCodec)) {
            interactiveVideo.mediaSource = new MediaSource;
            interactiveVideo.video.src = URL.createObjectURL(interactiveVideo.mediaSource);
            interactiveVideo.mediaSource.addEventListener('sourceopen', interactiveVideo.sourceOpen);
        } else {
                console.error('Unsupported MIME type or codec: ', interactiveVideo.mimeCodec);
        }
    }
}