import ReelCard from "@/components/ReelCard";
import BottomNav from "@/components/BottomNav";

const reels = [
  {
    username: "vector_x",
    avatarUrl: "https://picsum.photos/id/64/100/100",
    videoThumbnail: "https://picsum.photos/id/37/600/1200",
    caption: "Testing the aerodynamic limits. Response times under 12ms 🔥",
    likes: 1800,
    views: 24000,
    comments: 84,
    musicName: "Midnight Drift - JAGX Sound",
  },
  {
    username: "elara.void",
    avatarUrl: "https://picsum.photos/id/65/100/100",
    videoThumbnail: "https://picsum.photos/id/36/600/1200",
    caption: "When the sunset hits different in the mountains 🏔️",
    likes: 3200,
    views: 45000,
    comments: 156,
    musicName: "Golden Hour - Ambient",
  },
  {
    username: "kael.studio",
    avatarUrl: "https://picsum.photos/id/66/100/100",
    videoThumbnail: "https://picsum.photos/id/39/600/1200",
    caption: "Behind the scenes of the new collection drop 👀",
    likes: 5600,
    views: 89000,
    comments: 312,
    musicName: "Silk & Gold - Producer K",
  },
];

const ReelsPage = () => {
  return (
    <div className="min-h-screen pb-24 snap-y snap-mandatory overflow-y-auto">
      {/* Header overlay */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-background/80 to-transparent">
        <h1 className="font-display italic text-lg text-gold">Reels</h1>
        <button className="text-foreground text-sm font-medium">
          <span className="text-[10px] uppercase tracking-widest">Live</span>
          <span className="ml-1.5 inline-block size-2 rounded-full gold-gradient animate-pulse-gold" />
        </button>
      </div>

      {reels.map((reel, i) => (
        <ReelCard key={i} {...reel} />
      ))}

      <BottomNav />
    </div>
  );
};

export default ReelsPage;
