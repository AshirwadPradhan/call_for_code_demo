'use strict'

const Video = Twilio.Video;

var activeRoom;
var previewTracks;
var identity;
var roomName;

//Attach the tracks to the DOM.
function attachTracks(tracks, container){
    tracks.forEach(function(track){
        container.appendChild(track.attach());
    });
}

//Attach the Pariticipant's track to the DOM
function attachParticipantTracks(participant, container){
    var tracks = Array.from(participant.tracks.values());
    attachTracks(tracks, container);
}

//Detach the tracks from the DOM.
function detachTracks(tracks){
    tracks.forEach(function(track){
        track.detach().forEach(function(detachedElement){
            detachedElement.remove();
        });
    });
}

//Detach the participants track from the DOM
function detachParticipantTracks(participant){
    var tracks = Array.from(participant.tracks.values());
    detachTracks(tracks);
}

//Disconnet from room when transitioned away from page
window.addEventListener('beforeunload',leaveRoomIfJoined);

//Obtain token from server
$.getJSON('/token', function(data){
    console.log(data);
    identity = data.identity;
    document.getElementById('room-controls').style.display = 'block';

    //bind button to join room
    document.getElementById('button-join').onclick = function(){
        roomName = document.getElementById('room-name').value;
        if(!roomName){
            alert('Please enter Room Name');
            return;
        }

        log("Joining Room "+roomName+"....");
        var connectOptions = {
            name: roomName,
            logLevel: 'debug'
        };

        if(previewTracks){
            connectOptions.tracks = previewTracks;
        }

        //Join room with token from the server and the local participants tracks
        Video.connect(data.token, connectOptions).then(roomJoined, function(error){
            log("Could not connect to Twilio: "+error.message);
        });
    };

    //bind button to leave room
    document.getElementById('button-leave').onclick = function() {
        log('Leaving Room...');
        activeRoom.disconnect();
    };
});

//On successful connection
function roomJoined(room){
    window.room = activeRoom = room;

    log("Joined as "+identity+"...");
    document.getElementById("button-join").style.display = 'none';
    document.getElementById("button-leave").style.display = 'inline';

    //Attach local participants tracks if not already attached
    var previewContainer = document.getElementById('local-media');
    if(!previewContainer.querySelector('video')){
        attachParticipantTracks(room.localParticipant, previewContainer);
    }

     // Attach the Tracks of the Room's Participants.
  room.participants.forEach(function(participant) {
    log("Already in Room: '" + participant.identity + "'");
    var previewContainer = document.getElementById('remote-media');
    attachParticipantTracks(participant, previewContainer);
  });

  // When a Participant joins the Room, log the event.
  room.on('participantConnected', function(participant) {
    log("Joining: '" + participant.identity + "'");
  });

  // When a Participant adds a Track, attach it to the DOM.
  room.on('trackAdded', function(track, participant) {
    log(participant.identity + " added track: " + track.kind);
    var previewContainer = document.getElementById('remote-media');
    attachTracks([track], previewContainer);
  });

  // When a Participant removes a Track, detach it from the DOM.
  room.on('trackRemoved', function(track, participant) {
    log(participant.identity + " removed track: " + track.kind);
    detachTracks([track]);
  });

  // When a Participant leaves the Room, detach its Tracks.
  room.on('participantDisconnected', function(participant) {
    log("Participant '" + participant.identity + "' left the room");
    detachParticipantTracks(participant);
  });

  // Once the LocalParticipant leaves the room, detach the Tracks
  // of all Participants, including that of the LocalParticipant.
  room.on('disconnected', function() {
    log('Left the room');
    if (previewTracks) {
      previewTracks.forEach(function(track) {
        track.stop();
      });
    }
    detachParticipantTracks(room.localParticipant);
    room.participants.forEach(detachParticipantTracks);
    activeRoom = null;
    document.getElementById('button-join').style.display = 'inline';
    document.getElementById('button-leave').style.display = 'none';
  });
}

// Preview LocalParticipant's Tracks.
document.getElementById('button-preview').onclick = function() {
  var localTracksPromise = previewTracks
    ? Promise.resolve(previewTracks)
    : Video.createLocalTracks();

  localTracksPromise.then(function(tracks) {
    window.previewTracks = previewTracks = tracks;
    var previewContainer = document.getElementById('local-media');
    if (!previewContainer.querySelector('video')) {
      attachTracks(tracks, previewContainer);
    }
  }, function(error) {
    console.error('Unable to access local media', error);
    log('Unable to access Camera and Microphone');
  });
};

// Activity log.
function log(message) {
  var logDiv = document.getElementById('log');
  logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
  logDiv.scrollTop = logDiv.scrollHeight;
}

// Leave Room.
function leaveRoomIfJoined() {
  if (activeRoom) {
    activeRoom.disconnect();
  }
}
