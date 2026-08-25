/**
 * Topic-matched photographs for the example dataset, keyed by the source id in
 * `docs/data-example.csv`.
 *
 * The supplied fixture's own image URLs were unusable: 17 of 30 answered 404, and all 30 were
 * topically unrelated to the article they belonged to. `imageUrl` is display data rather than
 * part of the record, so it is replaced wholesale here while title, content and createdAt stay
 * exactly as supplied.
 *
 * These were resolved once, at author time, from the Unsplash Search API by matching each
 * photo's own alt_description against the article's sport — the `alt` field below is that
 * description, kept as provenance. The application needs no credentials and makes no request
 * to Unsplash: images.unsplash.com serves these URLs unauthenticated, exactly as the fixture's
 * originals did. Do not add an API key, a dependency, or a lookup to the seed.
 *
 * The sizing parameters matter — the fixture's unparameterised originals were 1.6-6.2 MB each,
 * where these are 66-348 KB.
 */
export interface ImagePick {
  imageUrl: string;
  alt: string;
}

export const IMAGE_PICKS: Record<number, ImagePick> = {
  // 1. Champions League Final: Real Madrid Crowned Champions
  1: {
    imageUrl:
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'soccer field',
  },
  // 2. NBA Playoffs: Lakers Survive Game 7 Thriller
  2: {
    imageUrl:
      'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'people inside the basketball court',
  },
  // 3. Premier League: Arsenal Back on Top
  3: {
    imageUrl:
      'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'group of people playing soccer on soccer field',
  },
  // 4. Formula 1: Verstappen Extends Championship Lead
  4: {
    imageUrl:
      'https://images.unsplash.com/photo-1699138346782-8a8b211c3da2?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'a man driving a race car on a track',
  },
  // 5. UFC 302: Stunning Knockout in Main Event
  5: {
    imageUrl:
      'https://images.unsplash.com/photo-1780476871585-eb2a20b32d12?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'Mma fighters grapple and punch inside a fenced fighting cage',
  },
  // 6. NHL Playoffs: Rangers Advance to Conference Finals
  6: {
    imageUrl:
      'https://images.unsplash.com/photo-1545471977-94cac22e71ed?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'people playing ice hockey',
  },
  // 7. La Liga: Barcelona Drop Points in Title Race
  7: {
    imageUrl:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'man playing soccer game on field',
  },
  // 8. Tennis: Djokovic Returns Strong in Clay Season Opener
  8: {
    imageUrl:
      'https://images.unsplash.com/photo-1604259011171-2343696f776b?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'white and brown tennis net',
  },
  // 9. Olympics 2024: New Security Measures Announced
  9: {
    imageUrl:
      'https://images.unsplash.com/photo-1606416550697-3d653df8d9a7?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'white and blue stadium under blue sky during daytime',
  },
  // 10. MLS: Inter Miami Continue Winning Streak
  10: {
    imageUrl:
      'https://images.unsplash.com/photo-1629217855633-79a6925d6c47?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'people watching soccer game in stadium',
  },
  // 11. MotoGP: Last-Lap Drama in Spain
  11: {
    imageUrl:
      'https://images.unsplash.com/photo-1761092993029-70ab4bc9983d?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'Motorcyclists race on a track during a competition',
  },
  // 12. Boxing: Heavyweight Superfight Announced
  12: {
    imageUrl:
      'https://images.unsplash.com/photo-1575747515871-2e323827539e?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'brown and gray boxing stage',
  },
  // 13. Cricket: India Clinch T20 Series
  13: {
    imageUrl:
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'shallow focus photography of red cricket ball',
  },
  // 14. Rugby: All Blacks Dominate Opening Test
  14: {
    imageUrl:
      'https://images.unsplash.com/photo-1480099225005-2513c8947aec?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'A group of rugby players in a scrum on a grassy field',
  },
  // 15. Bundesliga: Bayern Win Seven-Goal Thriller
  15: {
    imageUrl:
      'https://images.unsplash.com/photo-1679391029864-d46f366a456b?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'a soccer stadium filled with lots of people',
  },
  // 16. Cycling: New Leader in Giro d’Italia
  16: {
    imageUrl:
      'https://images.unsplash.com/photo-1673890704132-9573476ac27c?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'a group of people riding bikes down a road',
  },
  // 17. NFL: Draft Class Shows Strong Quarterback Talent
  17: {
    imageUrl:
      'https://images.unsplash.com/photo-1485313260896-6e6edf486858?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'man holding brown football ball',
  },
  // 18. Baseball: Yankees Extend AL East Lead
  18: {
    imageUrl:
      'https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'baseball player swinging bat',
  },
  // 19. WNBA: Rookie Shines in Season Debut
  19: {
    imageUrl:
      'https://images.unsplash.com/photo-1721750475973-4ced61c27d93?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'A person jumping in the air with a basketball',
  },
  // 20. Golf: Masters Preview Highlights Top Contenders
  20: {
    imageUrl:
      'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'photo of man swinging golf driver',
  },
  // 21. Swimming: World Champion Sets New Record
  21: {
    imageUrl:
      'https://images.unsplash.com/photo-1558617320-e695f0d420de?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'swimming pool close-up photography',
  },
  // 22. Volleyball: Brazil Defeats Italy in Five-Set Epic
  22: {
    imageUrl:
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'silhouettes playing beach volleyball at sunset',
  },
  // 23. Athletics: Sprinter Breaks Season Record
  23: {
    imageUrl:
      'https://images.unsplash.com/photo-1526676537331-7747bf8278fc?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'people running on race track',
  },
  // 24. Hockey: Maple Leafs Make Key Trade
  24: {
    imageUrl:
      'https://images.unsplash.com/flagged/photo-1550585477-a025700d7fce?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'man wearing green and white ice hockey jersey while playing',
  },
  // 25. Fencing: Gold Medal Match Ends in Upset
  25: {
    imageUrl:
      'https://images.unsplash.com/photo-1631529819887-5b4340090570?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'a couple of people that are standing up with fencing equipment',
  },
  // 26. Esports: CS2 Major Sees Huge Upset
  26: {
    imageUrl:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'person sitting on gaming chair while playing video game',
  },
  // 27. Snooker: Veteran Reaches Final Again
  27: {
    imageUrl:
      'https://images.unsplash.com/photo-1550919834-db6fea0365fb?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'man fixing billiard balls',
  },
  // 28. Handball: Denmark Wins Championship
  28: {
    imageUrl:
      'https://images.unsplash.com/photo-1584196749098-8c9f18966a43?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'A group of male athletes in uniform on a bench',
  },
  // 29. Skiing: Season Opener in Austria Draws Massive Crowd
  29: {
    imageUrl:
      'https://images.unsplash.com/photo-1546195617-2fb3f21126d0?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'person skiing on snow',
  },
  // 30. Table Tennis: China Sweeps Team Finals
  30: {
    imageUrl:
      'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=1200&q=80&fm=jpg&fit=crop',
    alt: 'red and brown wooden table tennis racket',
  },
};
