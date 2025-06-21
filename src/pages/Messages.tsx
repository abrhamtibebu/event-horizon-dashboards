
import { useState } from "react";
import { MessageSquare, Search, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardCard } from "@/components/DashboardCard";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

const conversations = [
  {
    id: 1,
    eventName: "Tech Conference 2024",
    participants: ["John Smith", "Sarah Johnson", "Mike Davis"],
    lastMessage: "Event setup complete, all systems go!",
    lastMessageTime: "2 min ago",
    unreadCount: 3,
    isActive: true
  },
  {
    id: 2,
    eventName: "Music Festival",
    participants: ["Sarah Johnson", "Lisa Wilson", "Tom Brown"],
    lastMessage: "Need more ushers for gate 3",
    lastMessageTime: "15 min ago",
    unreadCount: 1,
    isActive: false
  },
  {
    id: 3,
    eventName: "Business Summit",
    participants: ["Mike Davis", "John Smith"],
    lastMessage: "Registration numbers updated",
    lastMessageTime: "1 hour ago",
    unreadCount: 0,
    isActive: false
  },
];

const messages = [
  {
    id: 1,
    sender: "John Smith",
    message: "Good morning everyone! How are the preparations going?",
    time: "09:30 AM",
    isOwn: false,
    avatar: "JS"
  },
  {
    id: 2,
    sender: "You",
    message: "Everything is on track! The venue setup is almost complete.",
    time: "09:32 AM",
    isOwn: true,
    avatar: "ME"
  },
  {
    id: 3,
    sender: "Sarah Johnson",
    message: "Audio/visual equipment tested and ready. No issues found.",
    time: "09:35 AM",
    isOwn: false,
    avatar: "SJ"
  },
  {
    id: 4,
    sender: "Mike Davis",
    message: "Registration desk is set up. We're expecting the first attendees in 30 minutes.",
    time: "09:45 AM",
    isOwn: false,
    avatar: "MD"
  },
  {
    id: 5,
    sender: "You",
    message: "Perfect! Let's do a final walkthrough in 10 minutes.",
    time: "09:47 AM",
    isOwn: true,
    avatar: "ME"
  }
];

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const activeConversation = conversations.find(c => c.id === selectedConversation);
  
  const filteredConversations = conversations.filter(conv =>
    conv.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Communicate with your team in real-time</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <MessageSquare className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Messages Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <DashboardCard title="Conversations" className="lg:col-span-1">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[480px]">
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedConversation === conversation.id
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {conversation.eventName}
                      </h4>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {conversation.participants.slice(0, 2).join(", ")}
                      {conversation.participants.length > 2 && ` +${conversation.participants.length - 2} more`}
                    </p>
                    <p className="text-sm text-gray-600 truncate mb-1">
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-gray-500">{conversation.lastMessageTime}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DashboardCard>

        {/* Message Thread */}
        <DashboardCard title={activeConversation?.eventName || "Select a conversation"} className="lg:col-span-2">
          {activeConversation ? (
            <div className="flex flex-col h-[480px]">
              {/* Participants */}
              <div className="flex items-center gap-2 pb-4 border-b mb-4">
                <div className="flex -space-x-2">
                  {activeConversation.participants.slice(0, 3).map((participant, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white"
                    >
                      <span className="text-white text-xs font-medium">
                        {participant.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activeConversation.participants.slice(0, 2).join(", ")}
                    {activeConversation.participants.length > 2 && ` +${activeConversation.participants.length - 2} more`}
                  </p>
                  <p className="text-xs text-gray-500">Event Team</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.isOwn ? "flex-row-reverse" : ""}`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">{message.avatar}</span>
                      </div>
                      <div className={`max-w-xs lg:max-w-md ${message.isOwn ? "text-right" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{message.sender}</span>
                          <span className="text-xs text-gray-500">{message.time}</span>
                        </div>
                        <div
                          className={`p-3 rounded-lg ${
                            message.isOwn
                              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {message.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 resize-none"
                  rows={2}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[480px] text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
