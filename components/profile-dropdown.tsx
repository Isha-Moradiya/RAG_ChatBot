"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, LogOut, Camera, User } from "lucide-react";

interface ProfileDropdownProps {
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  onLogout: () => void;
}

export default function ProfileDropdown({
  userName,
  userEmail,
  userPhotoURL,
  onLogout,
}: ProfileDropdownProps) {
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-9 h-9 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center text-lg font-semibold overflow-hidden"
        >
          {userPhotoURL ? (
            <Avatar className="w-9 h-9">
              <AvatarImage src={userPhotoURL} alt={userName} />
              <AvatarFallback className="bg-blue-500 text-white text-lg font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
          ) : (
            userInitial
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-4 bg-[#303134] border border-[#444649] text-gray-100 rounded-xl shadow-lg"
        align="end"
        forceMount
      >
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-4xl font-bold text-white mb-3 overflow-hidden">
            {userPhotoURL ? (
              <Avatar className="w-20 h-20">
                <AvatarImage src={userPhotoURL} alt={userName} />
                <AvatarFallback className="bg-purple-600 text-white text-4xl font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            ) : (
              <>
                {userInitial}
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center border-2 border-[#303134]">
                  <Camera className="w-4 h-4 text-gray-300" />
                </div>
              </>
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-100 mb-2">
            Hi, {userName}!
          </h3>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-300">{userEmail}</span>
          </div>
          <Button
            variant="outline"
            className="w-full bg-[#444649] hover:bg-gray-600 text-gray-200 border border-[#444649] rounded-full"
            onClick={() =>
              window.open("https://myaccount.google.com/", "_blank")
            }
          >
            Manage your Google Account
          </Button>
        </div>

        <DropdownMenuSeparator className="bg-[#444649] my-4" />

 
        <DropdownMenuItem
          onClick={onLogout}
          className="flex items-center gap-3 text-gray-200 hover:bg-[#444649] cursor-pointer p-2 rounded-md"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#444649] my-4" />

        <div className="flex justify-center gap-4 text-xs text-gray-400">
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
          <a href="#" className="hover:underline">
            Terms of Service
          </a>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
