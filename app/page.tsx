"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Users, MessageSquare, Shield, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/room/${roomCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">MeetNext</span>
          </div>
          <div className="space-x-2">
            <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10 transition-all">
              About
            </Button>
            <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10 transition-all">
              Features
            </Button>
            <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10 transition-all">
              Contact
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all ml-2">
              Sign In
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1 bg-blue-500/20 rounded-full text-blue-400 font-medium text-sm mb-2">
            Secure, reliable video meetings
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
            Professional Video Meetings.<br />
            Now Free for Everyone.
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            We re-engineered the service that we built for secure business
            meetings, MeetNext, to make it free and available for all.
          </p>

          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-8 w-full max-w-md">
            <Link href="/room/new" className="w-full md:w-auto">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg w-full rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/30 hover:translate-y-[-2px] flex items-center justify-center gap-2">
                <Video className="h-5 w-5" />
                New Meeting
              </Button>
            </Link>
            <div className="flex items-center bg-white/10 rounded-xl p-2 w-full shadow-lg hover:shadow-xl transition-all hover:bg-white/15 border border-white/10">
              <Input
                placeholder="Enter a room code"
                className="bg-transparent border-none text-white placeholder-gray-400 focus:outline-none"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              />
              <Button
                variant="ghost"
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg flex items-center gap-1"
                onClick={handleJoinRoom}
                disabled={!roomCode.trim()}
              >
                Join
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="text-center p-8 bg-white/5 rounded-2xl hover:bg-white/10 transition-all hover:shadow-xl hover:transform hover:scale-105 border border-white/10">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-500/20 rounded-full">
                <Video className="h-10 w-10 text-blue-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Premium Video Meetings</h3>
            <p className="text-gray-400">
              Get high-quality video meetings with crystal clear audio and stunning visuals.
            </p>
          </div>
          <div className="text-center p-8 bg-white/5 rounded-2xl hover:bg-white/10 transition-all hover:shadow-xl hover:transform hover:scale-105 border border-white/10">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-500/20 rounded-full">
                <Users className="h-10 w-10 text-blue-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Built for Everyone</h3>
            <p className="text-gray-400">
              Whether you&apos;re meeting one-on-one or hosting large gatherings, MeetNext scales with your needs.
            </p>
          </div>
          <div className="text-center p-8 bg-white/5 rounded-2xl hover:bg-white/10 transition-all hover:shadow-xl hover:transform hover:scale-105 border border-white/10">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-500/20 rounded-full">
                <MessageSquare className="h-10 w-10 text-blue-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Chat & Collaboration</h3>
            <p className="text-gray-400">
              Share messages, files, and collaborate in real-time during your meetings.
            </p>
          </div>
        </div>

        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-12">Why Choose MeetNext?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left border border-white/10">
              <div className="p-3 bg-blue-500/20 rounded-lg mr-4">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Enterprise-Grade Security</h3>
                <p className="text-gray-400">All meetings are encrypted and protected with advanced security features.</p>
              </div>
            </div>
            <div className="flex items-start p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-left border border-white/10">
              <div className="p-3 bg-blue-500/20 rounded-lg mr-4">
                <Globe className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Global Accessibility</h3>
                <p className="text-gray-400">Connect with anyone, anywhere in the world with low-latency communication.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-white/10 text-center text-gray-400">
        <p>© 2023 MeetNext. All rights reserved.</p>
      </footer>
    </div>
  );
}