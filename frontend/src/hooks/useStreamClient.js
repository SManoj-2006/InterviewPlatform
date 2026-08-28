import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { sessionApi } from "../api/sessions";

function useStreamClient(session, loadingSession, isHost, isParticipant) {
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);
  const sessionCallId = session?.callId;
  const sessionStatus = session?.status;

  useEffect(() => {
    let cancelled = false;
    let videoCall = null;
    let chatClientInstance = null;
    let videoClient = null;

    const initCall = async () => {
      if (!sessionCallId) return;
      if (!isHost && !isParticipant) return;
      if (sessionStatus === "completed") return;

      try {
        const { token, userId, userName, userImage } = await sessionApi.getStreamToken();

        videoClient = new StreamVideoClient({
          apiKey: import.meta.env.VITE_STREAM_API_KEY,
          user: { id: userId, name: userName, image: userImage },
          token,
        });

        if (cancelled) return;
        setStreamClient(videoClient);

        videoCall = videoClient.call("default", sessionCallId);
        await videoCall.join({ create: true });
        if (cancelled) return;
        setCall(videoCall);

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        chatClientInstance = new StreamChat(apiKey);

        await chatClientInstance.connectUser(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );
        if (cancelled) return;
        setChatClient(chatClientInstance);

        const chatChannel = chatClientInstance.channel("messaging", sessionCallId);
        await chatChannel.watch();
        if (cancelled) return;
        setChannel(chatChannel);
      } catch (error) {
        toast.error("Failed to join video call");
        console.error("Error init call", error);
      } finally {
        if (!cancelled) setIsInitializingCall(false);
      }
    };

    if (sessionCallId && !loadingSession) initCall();

    // cleanup - performance reasons
    return () => {
      cancelled = true;
      // iife
      (async () => {
        try {
          if (videoCall) await videoCall.leave();
          if (chatClientInstance) await chatClientInstance.disconnectUser();
          if (videoClient) await videoClient.disconnectUser();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      })();
    };
  }, [session?.callId, session?.status, loadingSession, isHost, isParticipant]);

  return {
    streamClient,
    call,
    chatClient,
    channel,
    isInitializingCall,
  };
}

export default useStreamClient;