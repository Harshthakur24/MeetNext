"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoRoom from "@/app/components/VideoRoom";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  // Handle leaving the room
  const handleLeaveRoom = () => {
    router.push("/");
  };

  return (
    <VideoRoom
      roomId={roomId}
      onLeaveRoom={handleLeaveRoom}
    />
  );
}