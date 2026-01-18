export interface GrammarPoint {
  id: string;
  pattern: string;
  meaning: string;
  example: string;
  category: string;
}

export interface MovieClip {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  grammarIds: string[];
  description: string;
  agentName: string; // The "AI Agent" that found it
}

export const grammarPoints: GrammarPoint[] = [
  {
    id: "g1",
    pattern: "～なり",
    meaning: "As soon as; right after",
    example: "彼は帰宅するなり、ベッドに倒れ込んだ。",
    category: "Time/Sequence"
  },
  {
    id: "g2",
    pattern: "～ごとき",
    meaning: "Like; as if; the likes of (often negative)",
    example: "私ごときが、そのような大役を務められるでしょうか。",
    category: "Comparison"
  },
  {
    id: "g3",
    pattern: "～めく",
    meaning: "To show signs of; to have the air of",
    example: "少しずつ春めいてきた。",
    category: "State/Condition"
  },
  {
    id: "g4",
    pattern: "～ずにはおかない",
    meaning: "Will definitely; cannot help but",
    example: "彼の行動は、人々を感動させずにはおかなかった。",
    category: "Emphasis"
  },
  {
    id: "g5",
    pattern: "～たるもの",
    meaning: "Those who are; in the capacity of",
    example: "教師たるもの、学生の模範となるべきだ。",
    category: "Role/Responsibility"
  },
  {
    id: "g6",
    pattern: "～極まりない",
    meaning: "Extremely; boundless",
    example: "その発言は失礼極まりない。",
    category: "Degree"
  }
];

export const movieClips: MovieClip[] = [
  {
    id: "c1",
    title: "Cyber Detective: Rain",
    thumbnail: "https://images.unsplash.com/photo-1515630278258-407f66498911?q=80&w=1000&auto=format&fit=crop",
    duration: "00:45",
    grammarIds: ["g1", "g3"],
    description: "The detective enters the room and immediately notices the change in atmosphere.",
    agentName: "CinemaScout-01"
  },
  {
    id: "c2",
    title: "The Last Samurai's Honor",
    thumbnail: "https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=1000&auto=format&fit=crop",
    duration: "01:20",
    grammarIds: ["g5", "g4"],
    description: "A speech about the duties of a warrior that moves the entire army.",
    agentName: "HistoryBot-X"
  },
  {
    id: "c3",
    title: "Neon Drift",
    thumbnail: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1000&auto=format&fit=crop",
    duration: "00:30",
    grammarIds: ["g2", "g6"],
    description: "A rival racer mocks the protagonist's skills before the final race.",
    agentName: "DriftKing-AI"
  }
];
