const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const leave_meetion = document.getElementById("leave-meeting");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;


var peer = new Peer(undefined, {
    path: "/peer",
    host: "/",
    port: "443"
  });

let myVideoStream;
let currentUserId;
let pendingMsg = 0;
let peers = {};
var getUserMedia = navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia;
navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
}).then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, "me");

    peer.on("call", (call) => {
        call.answer(stream);
        const video = document.createElement("video");

        call.on("stream", (userVideoStream) => {
            addVideoStream(video, userVideoStream);
            console.log(peers);
        });

    });

    socket.on("user-connected", (userId) => {
        setTimeout(() => {
            connectToNewUser(userId, stream)
          },1000)
    });

    socket.on("user-disconnected", (userId) => {
        if(peers[userId]) peers[userId].close();
    });

    document.addEventListener("keydown", (e) => {
        if(e.key === 13 && chatInputBox.value != "") {
            socket.emit("message", {
                msg: chatInputBox.value,
                user: currentUserId,
            });
            chatInputBox.value = "";
        }
    });

    document.getElementById("sendMsg").addEventListener("click", (e) => {
        if(chatInputBox.value != "") {
            socket.emit("message", {
                msg: chatInputBox.value,
                user: currentUserId,
            });
            chatInputBox.value = "";
        }
    });

    chatInputBox.addEventListener("focus", () => {
        document.getElementById("chat__Btn").classList.remove("has__new");
        pendingMsg = 0;
        document.getElementById("chat__Btn").children[1].innerHTML = "Chat";
    });

    socket.on("createMessage", (message) => {
        console.log(message);
        let li = document.createElement("li");
        if (message.user != currentUserId) {
            li.classList.add("otherUser");
            li.innerHTML = `<div><b>User (<small>${message.user}</small>): </b>${message.msg}</div>`;
        } else {
            li.innerHTML = `<div><b>나 : </b>${message.msg}</div>`;
        }

        all_messages.append(li);
        main__chat__window.scrollTop = main__chat__window.scrollHeight;
        if(message.user != currentUserId) {
            pendingMsg++;
            playChatSound();
            document.getElementById("chat__Btn").classList.add("has__new");
            document.getElementById("chat__Btn").children[1].innerHTML = `CHAT (${pendingMsg})`;
        }
    });
});

peer.on("call", function (call) {
    getUserMedia({
        video: true, audio: true
    }, function(stream){
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", function (remoteStream) {
            addVideoStream(video, remoteStream);
        });
    }, function(err) {
        console.log("Failed to get local stream", err);
    });
});

peer.on("open", (id) => {
    currentUserId = id;
    socket.emit("join-room", ROOM_ID, id);
});

socket.on("disconnect", () => {
    socket.emit("leave-room", ROOM_ID, currentUserId);
});

const connectToNewUser = (userId, stream) => {
    var call = peer.call(userId, stream);
    console.log("call : " + call);
    var video = document.createElement("video");

    call.on("stream", (userVideoStream) => {
      console.log("stream : " + userVideoStream);
      addVideoStream(video, userVideoStream, userId);
    });

    call.on("close", () => {
        video.remove();
    });
    peers[userId] = call;
};

const addVideoStream = (videoEl, stream, uId) => {
    videoEl.srcObject = stream;
    videoEl.id = uId;
    videoEl.addEventListener("loadedmetadata", () => {
      videoEl.play();
    });
  
    videoGrid.append(videoEl);
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
      for (let index = 0; index < totalUsers; index++) {
        document.getElementsByTagName("video")[index].style.width =
          100 / totalUsers + "%";
      }
    }
};

const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    }else{
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    } else {
      setMuteButton();
      myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

const setPlayVideo = () => {
    const html = `<i class="unmute fa fa-pause-circle"></i>
    <span class="unmute">해제</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};
  
const setStopVideo = () => {
    const html = `<i class=" fa fa-video-camera"></i>
    <span class="">정지</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};
  
const setUnmuteButton = () => {
    const html = `<i class="unmute fa fa-microphone-slash"></i>
    <span class="unmute">해제</span>`;
    document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
    const html = `<i class="fa fa-microphone"></i>
    <span>음소거</span>`;
    document.getElementById("muteButton").innerHTML = html;
};

const showInvitePopup = () => {
    document.body.classList.add("showInvite");
    document.getElementById("roomLink").value = window.location.href;
};

const hideInvitePopup = () => {
    document.body.classList.remove("showInvite");
};

const copyToClipboard = () => {
    var copyText = document.getElementById("roomLink");

    copyText.select();
    copyText.setSelectionRange(0, 99999);

    document.execCommand("copy");

    alert("Copied: " + copyText.value);

    hideInvitePopup();
}

const ShowChat = (e) => {
    e.classList.toggle("active");
    document.body.classList.toggle("showChat");
};


