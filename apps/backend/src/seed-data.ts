const paragraphs = (...parts: string[]): string => parts.join('\n\n');

export interface SeedArticle {
  title: string;
  content: string;
}

/**
 * Fictional clubs, athletes and fixtures throughout: the seed has to look like a real
 * newsroom feed without putting invented quotes or results in the mouths of real people.
 */
export const seedArticles: SeedArticle[] = [
  {
    title: 'Harborline Snatch Derby Win With Stoppage-Time Header',
    content: paragraphs(
      'Harborline left it until the sixth minute of added time to settle a derby that had looked destined for a goalless draw, Ada Ferreiro rising at the near post to glance in a corner that barely cleared the first defender.',
      'For an hour the match had been a stalemate of midfield fouls and half-chances. Riverton sat deep, inviting pressure, and for long stretches the tactic worked — Harborline managed only two shots on target before the interval, both from outside the area.',
      'The win lifts Harborline to fourth, level on points with the side directly above them and with a game in hand. Riverton stay eleventh, still four clear of the relegation places but now without a league win in six.',
      'Ferreiro, a defender by trade, has now scored in three consecutive matches — as many goals as she managed in the previous two seasons combined.',
    ),
  },
  {
    title: 'Rookie Guard Drops 41 in Overtime Thriller',
    content: paragraphs(
      'Mika Odell scored 41 points in her fourteenth professional appearance, dragging the Kestrels back from eighteen down to win in overtime and setting a franchise record for a first-year player along the way.',
      'Odell was quiet through the opening half, taking only six shots as the visitors built their lead. The third quarter changed the game: she scored seventeen straight points for her side across a five-minute stretch, three of them from well beyond the arc.',
      'The Kestrels have now won four in a row at home. Their coaching staff has been careful about minutes all season, but Odell played forty-three of a possible fifty-three, the heaviest workload she has been given.',
    ),
  },
  {
    title: 'Sennett Falls to Qualifier in Longest Match of the Season',
    content: paragraphs(
      'Third seed Priya Sennett was knocked out in the second round by a qualifier ranked 214th in the world, losing 6-7, 7-5, 7-6 in a match that lasted four hours and eleven minutes — the longest of the tournament so far.',
      'Sennett served for the match twice and was broken both times. The final tiebreak turned on a single point at 5-5, a thirty-shot rally that ended with a forehand clipping the tape and dropping on her side of the net.',
      'It is the earliest she has exited a hard-court event in three seasons. She told reporters afterwards that a lingering shoulder problem had limited her practice in the week leading up to the draw, but declined to use it as an explanation for the result.',
    ),
  },
  {
    title: 'Relay Squad Break National Record on Home Track',
    content: paragraphs(
      'The national 4x400m squad took nearly a second off a record that had stood for nineteen years, clocking 3:19.44 in front of a sold-out crowd on the final evening of the domestic championships.',
      'The margin came almost entirely from the third leg. Tomas Bregu, running the position for only the second time, moved from fourth to first in a split that the timing system recorded at 44.6 — the fastest of any runner in the field.',
      'All four members of the squad are under twenty-five, and three of them will be eligible for the under-23 championships next summer.',
      'The previous mark had survived eleven attempts by six different squads, and had come to be treated within the federation as a soft target that nobody could quite reach.',
    ),
  },
  {
    title: 'Mountain Stage Chaos Reshuffles the General Classification',
    content: paragraphs(
      'A crosswind split the peloton with sixty kilometres remaining, and by the time the road tilted upward the race leader was stranded in the third group with no teammates and a deficit that never stopped growing.',
      'The stage was won by a rider who had been in the day-long breakaway, holding off the chasers by twenty-two seconds on a final climb that averaged nine percent for the last four kilometres.',
      'The overall lead now belongs to a rider who started the day two minutes and forty seconds down. With two mountain stages and a time trial still to come, the standings remain close enough that a single bad afternoon could rearrange them again.',
    ),
  },
  {
    title: 'Teenager Takes 200m Freestyle by Four Hundredths',
    content: paragraphs(
      'Nara Vilppu, seventeen, won the 200m freestyle final by four hundredths of a second, out-touching a defending champion who had led at every intermediate split.',
      'Vilppu was fifth at the halfway mark and still fourth with fifty metres to go. Her closing split was the fastest in the field by more than half a second.',
      'She has now won national titles at three distances this season, and her time would have placed her in the final at last year’s world championships.',
    ),
  },
  {
    title: 'Northgate Hold On With Fourteen Men After Red Card',
    content: paragraphs(
      'Reduced to fourteen after a shoulder-to-head tackle in the twenty-eighth minute, Northgate defended their line for the better part of an hour and won 13-10.',
      'The visitors had seventy-one percent of the possession in the second half and five attacking lineouts inside the twenty-two, and scored from none of them. Northgate conceded eleven penalties in that period but never conceded the try.',
      'Their fly-half kicked all thirteen points, including a penalty from just inside halfway with nine minutes remaining that ultimately decided the match.',
    ),
  },
  {
    title: 'Century Stand Rescues Ashford in Final Session',
    content: paragraphs(
      'Ashford were 94 for 6 and staring at an innings defeat when an unbroken stand of 138 between the wicketkeeper and the number eight took the match into a fifth day.',
      'The pair batted through the entire final session without offering a chance, scoring at under two an over and leaving the fielding side visibly frustrated as the light faded.',
    ),
  },
  {
    title: 'Bullpen Meltdown Costs Riverton a Sweep',
    content: paragraphs(
      'Riverton took a five-run lead into the eighth inning and lost by two, surrendering seven runs across the final two innings without recording a strikeout.',
      'Three relievers combined to walk five batters. The decisive hit was a bases-clearing double down the right-field line, struck off a first-pitch fastball on a night when the bullpen had thrown first-pitch strikes to barely half the hitters it faced.',
      'It is the third time this month the side has lost a game it led after seven innings.',
    ),
  },
  {
    title: 'Overtime Winner Ends Longest Playoff Game in Franchise History',
    content: paragraphs(
      'The third overtime period was eleven minutes old when a point shot deflected off a skate and past a goaltender who had already made sixty-two saves.',
      'The game lasted just under six hours from opening face-off to final horn. Both sides dressed only eleven forwards, and by the final period the shifts had shortened to barely thirty seconds.',
      'The series is now tied at two games apiece, with the fifth scheduled for less than forty-eight hours later.',
      'Neither coach would commit to a starting goaltender for the next game. Both men who played this one faced more shots than either had in any regular-season appearance.',
    ),
  },
  {
    title: 'Five-Set Comeback Sends Coastal Into the Final',
    content: paragraphs(
      'Coastal lost the first two sets 25-18 and 25-20, then won the next three, closing out the deciding set 15-12 after saving two match points.',
      'The turnaround followed a substitution at setter midway through the third. The change slowed the tempo noticeably and gave the middle blockers a look they had not had all evening.',
      'They will face the defending champions, who have not dropped a set in the tournament.',
    ),
  },
  {
    title: 'Unbeaten Streak Ends on a Split Decision',
    content: paragraphs(
      'Twenty-two fights into a professional career without a defeat, Idris Kwan lost a split decision on the judges’ scorecards, two of them separated by a single round.',
      'The fight was fought almost entirely at close range. Kwan landed the heavier shots through the middle rounds, but was out-worked in the final three by an opponent eight years his senior who kept a jab going to the end.',
      'A rematch clause was reported to be in the contract, though neither camp confirmed it in the immediate aftermath.',
    ),
  },
  {
    title: 'Grid Penalty Hands Pole to a Debutant',
    content: paragraphs(
      'A three-place grid penalty for impeding during qualifying moved the fastest driver back to fourth and handed a first career pole to a nineteen-year-old making his debut weekend.',
      'The stewards ruled that the impeding occurred at the final corner, where telemetry showed a lift of nearly forty kilometres per hour on the approach with a faster car following.',
      'Rain is expected for the start, which would make the front row rather less of an advantage than it looks.',
    ),
  },
  {
    title: 'Four-Shot Lead Evaporates on the Back Nine',
    content: paragraphs(
      'A four-shot lead with nine holes to play became a two-shot deficit by the eighteenth green, undone by a double bogey at the twelfth and a ball lost in the water at the fifteenth.',
      'The winner played the closing stretch in five under, including an eagle at the par-five sixteenth from a fairway bunker at 240 yards.',
    ),
  },
  {
    title: 'Downhill Cancelled as Fog Closes the Course',
    content: paragraphs(
      'Organisers abandoned the men’s downhill after a three-hour delay, with visibility at the upper timing gates never improving enough to allow a start.',
      'The race had already been shortened once, with officials proposing a lower start gate before conditions deteriorated further.',
      'Under the competition rules the points will not be reallocated, leaving the overall standings unchanged with two events remaining.',
    ),
  },
  {
    title: 'Lightweight Eight Take Gold by a Canvas',
    content: paragraphs(
      'The lightweight eight won by a margin the officials measured at 0.31 seconds after a review of the finish-line photograph, the closest result of the regatta.',
      'The crew were third at the halfway mark and moved through the field over the final five hundred metres, raising the rate to a stroke above their planned finish.',
      'It is the club’s first title in the event in eleven years.',
    ),
  },
  {
    title: 'Rally of the Tournament Decides the Semi-Final',
    content: paragraphs(
      'A rally of eighty-six shots at 19-19 in the deciding game drew the crowd to its feet and effectively ended the match: the loser of the point took only two more.',
      'Both players had been on court for well over an hour by that stage, and neither could reasonably be described as fresh.',
    ),
  },
  {
    title: 'Debut Marathon Win in Driving Rain',
    content: paragraphs(
      'Running her first marathon after four years on the track, Halima Osei won in 2:24:51 in conditions that saw nearly a fifth of the field fail to finish.',
      'She ran the first half conservatively, more than ninety seconds behind the leaders, and took the lead just after the thirty-kilometre mark without appearing to change pace.',
      'Her time is the fastest debut recorded at the race, though well outside the course record set in considerably better weather.',
      'Osei said afterwards that she had planned to treat the race as an experiment and would decide on a spring marathon only after seeing how her legs recovered over the following fortnight.',
    ),
  },
  {
    title: 'Expansion Side Confirm Stadium Timeline',
    content: paragraphs(
      'The league’s newest club confirmed that its permanent stadium will open at the start of the 2029 season, a year later than the timeline given when the franchise was awarded.',
      'The delay was attributed to ground conditions on the eastern edge of the site, which required a redesign of the foundations. The club will play its first two seasons at a shared municipal ground with roughly half the eventual capacity.',
      'Season-ticket deposits taken on the original timeline will be honoured at the price quoted, the club said, or refunded in full on request.',
    ),
  },
  {
    title: 'Wheelchair Basketball Side Book Qualifier Spot',
    content: paragraphs(
      'A fourteen-point win in the final group game secured qualification with a game to spare, the side’s first appearance at the tournament in eight years.',
      'The defence was the story: they forced nineteen turnovers and held an opponent that had averaged seventy-one points to forty-eight.',
      'The squad is unusually young, with five players aged twenty-two or under and only two who have played at this level before.',
    ),
  },
];
