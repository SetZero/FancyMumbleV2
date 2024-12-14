import { Socket, io } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export class WebRTCStreamer {
    private stream: MediaStream | null = null;
    private signalingServerUrl: string;
    private userId: number;
    private roomId: number;
    private socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;
    private peerConnections: Map<number, RTCPeerConnection> = new Map();
    private configuration: { iceServers: { urls: string; }[]; };

    constructor(signalingServerUrl: string, userId: number, roomId: number) {
        this.configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };
        this.signalingServerUrl = signalingServerUrl;
        this.userId = userId;
        this.roomId = roomId;
    }

    private async requestScreenAccess() {
        try {
            // @ts-ignore
            this.stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" }, audio: false });
        } catch (error) {
            console.error("Error: " + error);
        }
    }

    get getStream() {
        return this.stream;
    }

    async start() {
        await this.requestScreenAccess();
        this.socket = io(`${this.signalingServerUrl}/ws?userId=${this.userId}&roomId=${this.roomId}`);

        this.socket?.on("answer", (id, description) => {
            this.peerConnections.get(id)?.setRemoteDescription(description);
        });

        this.socket?.on("watcher", id => {
            const peerConnection = new RTCPeerConnection(this.configuration);
            this.peerConnections.set(id, peerConnection);

            if (this.stream) {
                let stream = this.stream;
                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            }

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    this.socket?.emit("candidate", id, event.candidate);
                }
            };

            peerConnection
                .createOffer()
                .then(sdp => peerConnection.setLocalDescription(sdp))
                .then(() => {
                    this.socket?.emit("offer", id, peerConnection.localDescription);
                });
        });

        this.socket?.on("candidate", (id, candidate) => {
            this.peerConnections.get(id)?.addIceCandidate(new RTCIceCandidate(candidate));
        });

        this.socket?.on("disconnectPeer", id => {
            this.peerConnections.get(id)?.close();
            this.peerConnections.delete(id);
        });

        this.socket.emit("broadcaster");
        this.stream?.getTracks().forEach(track => track.onended = () => {
            this.stop();
        });
    }


    stop() {
        this.socket?.disconnect();
        this.stream?.getTracks().forEach(track => track.stop());
        this.peerConnections.forEach(peerConnection => peerConnection.close());
    }
}

export class WebRTCViewer {
    private signalingServerUrl: string;
    private userId: number;
    private roomId: number;
    private socket: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;
    private configuration: { iceServers: { urls: string; }[]; };
    private stream: MediaStream | null = null;
    private onStreamListeners: ((stream: MediaStream) => void)[] = [];
    private peerConnection: RTCPeerConnection | null = null;

    constructor(signalingServerUrl: string, userId: number, roomId: number) {
        this.configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };
        this.userId = userId;
        this.roomId = roomId;
        this.signalingServerUrl = signalingServerUrl;
    }

    listen() {
        this.socket = io(`${this.signalingServerUrl}/ws?userId=${this.userId}&roomId=${this.roomId}`);
        let peerConnection: RTCPeerConnection | null = null;
        this.socket.on("offer", (id, description) => {
            peerConnection = new RTCPeerConnection(this.configuration);
            peerConnection
                .setRemoteDescription(description)
                .then(() => peerConnection?.createAnswer())
                .then(sdp => peerConnection?.setLocalDescription(sdp))
                .then(() => {
                    this.socket?.emit("answer", id, peerConnection?.localDescription);
                });
            peerConnection.ontrack = event => {
                this.onStreamListeners.forEach(onStreamListener => onStreamListener(event.streams[0]));
            };
            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    this.socket?.emit("candidate", id, event.candidate);
                }
            };
        });


        this.socket.on("candidate", (id, candidate) => {
            peerConnection?.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(e => console.error(e));
        });

        this.socket.on("connect", () => {
            this.socket?.emit("watcher");
        });

        this.socket.on("broadcaster", () => {
            this.socket?.emit("watcher");
        });
    }

    stop() {
        this.socket?.disconnect();
    }


    onStream(callback: (stream: MediaStream) => void) {
        this.onStreamListeners.push(callback);
    }

    onStreamEnd(callback: () => void) {
        if (this.peerConnection) {
            this.peerConnection.ontrack = null;
            this.peerConnection.oniceconnectionstatechange = () => {
                if (this.peerConnection?.iceConnectionState === 'disconnected') {
                    callback();
                }
            };
        }
        if(this.socket) {
            this.socket.on('disconnect', callback);
            this.socket.on('disconnectBroadcaster', callback);
        }
    }
}