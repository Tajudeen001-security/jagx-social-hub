import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant, createLocalTracks, LocalTrack } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  roomName: string;
  role: "publisher" | "viewer";
  identity: string;
  displayName: string;
  onReady?: (room: Room) => void;
}

const LiveRoom = ({ roomName, role, identity, displayName, onReady }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let localTracks: LocalTrack[] = [];

    const connect = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("livekit-token", {
          body: { room: roomName, role, identity, name: displayName },
        });
        if (error || !data?.token) throw new Error(error?.message || "No token");
        if (cancelled) return;

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        const attachTrack = (track: Track) => {
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
            setHasVideo(true);
          } else if (track.kind === Track.Kind.Audio && audioRef.current) {
            track.attach(audioRef.current);
          }
        };

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => attachTrack(track));
        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => track.detach().forEach(el => el.remove()));

        await room.connect(data.wsUrl, data.token);
        if (cancelled) { room.disconnect(); return; }

        if (role === "publisher") {
          localTracks = await createLocalTracks({ audio: true, video: { facingMode: "user" } });
          for (const t of localTracks) {
            await room.localParticipant.publishTrack(t);
            if (t.kind === Track.Kind.Video && videoRef.current) {
              t.attach(videoRef.current);
              setHasVideo(true);
            }
          }
        } else {
          // attach already-subscribed tracks
          room.remoteParticipants.forEach((p: RemoteParticipant) => {
            p.trackPublications.forEach(pub => {
              if (pub.track) attachTrack(pub.track);
            });
          });
        }

        setConnecting(false);
        onReady?.(room);
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || "Failed to join stream");
        setConnecting(false);
      }
    };

    connect();
    return () => {
      cancelled = true;
      localTracks.forEach(t => t.stop());
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, role, identity]);

  return (
    <div className="absolute inset-0 bg-black">
      <video ref={videoRef} autoPlay playsInline muted={role === "publisher"} className="w-full h-full object-cover" />
      <audio ref={audioRef} autoPlay />
      {connecting && (
        <div className="absolute inset-0 flex items-center justify-center text-foreground/70 text-xs">
          Connecting to live...
        </div>
      )}
      {!connecting && !hasVideo && role === "viewer" && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
          Waiting for broadcaster's video...
        </div>
      )}
    </div>
  );
};

export default LiveRoom;