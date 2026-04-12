import { Bell, Search, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StoryCircle from "@/components/StoryCircle";
import PostCard from "@/components/PostCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

const stories = [
  { name: "You", imageUrl: "", isAdd: true },
  { name: "Aurelius", imageUrl: "https://picsum.photos/id/101/200/200" },
  { name: "Elara", imageUrl: "https://picsum.photos/id/102/200/200" },
  { name: "Soren", imageUrl: "https://picsum.photos/id/103/200/200" },
  { name: "Maison", imageUrl: "https://picsum.photos/id/104/200/200" },
  { name: "Kael", imageUrl: "https://picsum.photos/id/106/200/200" },
];

const posts = [
  {
    username: "julian.v",
    avatarUrl: "https://picsum.photos/id/65/100/100",
    imageUrl: "https://picsum.photos/id/42/800/800",
    caption: "The brutalist intersection of light and shadow at the Pavilion. A study in permanence. ✨",
    likes: 1847,
    comments: 42,
    timeAgo: "2 hours ago",
    location: "Paris, France",
    isVerified: true,
  },
  {
    username: "elara.thorne",
    avatarUrl: "https://picsum.photos/id/66/100/100",
    imageUrl: "https://picsum.photos/id/48/800/800",
    caption: "Curating the morning quiet. Velvet textures and cold espresso. ☕",
    likes: 426,
    comments: 18,
    timeAgo: "4 hours ago",
    location: "London, UK",
  },
  {
    username: "drift.culture",
    avatarUrl: "https://picsum.photos/id/67/100/100",
    imageUrl: "https://picsum.photos/id/29/800/800",
    caption: "Nature doesn't rush, yet everything is accomplished 🌿",
    likes: 2103,
    comments: 67,
    timeAgo: "6 hours ago",
    isVerified: true,
  },
];

const FeedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-display italic text-xl text-gold">JagX</h1>
          <div className="flex items-center gap-4">
            <button className="text-foreground">
              <Search className="size-5" />
            </button>
            <button className="relative text-foreground">
              <Bell className="size-5" />
              <span className="absolute -top-1 -right-1 size-2 rounded-full gold-gradient" />
            </button>
          </div>
        </div>
      </header>

      {/* Stories */}
      <div className="flex gap-4 px-4 py-4 overflow-x-auto no-scrollbar">
        {stories.map((story) => (
          <StoryCircle
            key={story.name}
            imageUrl={story.imageUrl}
            name={story.name}
            isAdd={story.isAdd}
          />
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-2">
        {posts.map((post, i) => (
          <PostCard key={i} {...post} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default FeedPage;
