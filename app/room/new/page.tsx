"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function NewRoomPage() {
  const router = useRouter();

  useEffect(() => {
    const roomId = uuidv4();
    router.push(`/room/${roomId}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Creating new meeting room...</p>
      </div>
    </div>
  );
}